import { useMutation } from "@tanstack/react-query";
import { useAccount, type Address, type WalletClient } from "wagmi";
import { getWalletClient } from "@wagmi/core";
import { canto } from "wagmi/chains";
import { formatEther, formatUnits } from "viem";
import BigNumber from "bignumber.js";
import moment from "moment";

import viemClient from "../../../stores/connectors/viem";
import {
  writeApprove,
  writeContractWrapper,
} from "../../../lib/global/mutations";
import { BaseAsset, Gauge } from "../../../stores/types/types";
import {
  ACTIONS,
  CONTRACTS,
  MAX_UINT256,
  NATIVE_TOKEN,
  PAIR_DECIMALS,
  W_NATIVE_ADDRESS,
  ZERO_ADDRESS,
} from "../../../stores/constants/constants";
import stores from "../../../stores";
import { getTXUUID } from "../../../utils/utils";

import { getPairByAddress } from "./queries";

export function useCreatePairStake(onSuccess?: () => void) {
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: {
      token0: BaseAsset | null;
      token1: BaseAsset | null;
      amount0: string;
      amount1: string;
      isStable: boolean;
      slippage: string;
    }) => createPairStake(address, options),
    onSuccess,
  });
}

export function useCreatePairDeposit(onSuccess?: () => void) {
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: {
      token0: BaseAsset | null;
      token1: BaseAsset | null;
      amount0: string;
      amount1: string;
      isStable: boolean;
      slippage: string;
    }) => createPairDeposit(address, options),
    onSuccess,
  });
}

const createPairStake = async (
  account: Address | undefined,
  options: {
    token0: BaseAsset | null;
    token1: BaseAsset | null;
    amount0: string;
    amount1: string;
    isStable: boolean;
    slippage: string;
  }
) => {
  if (!account) {
    console.warn("account not found");
    throw new Error("account not found");
  }

  const {
    token0,
    token1,
    amount0,
    amount1,
    isStable: stable,
    slippage,
  } = options;

  if (!token0 || !token1) {
    console.warn("tokens not found");
    throw new Error("tokens not found");
  }

  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("wallet not found");
  }

  let toki0 = token0.address;
  let toki1 = token1.address;
  if (token0.address === NATIVE_TOKEN.symbol) {
    toki0 = W_NATIVE_ADDRESS as `0x${string}`;
  }
  if (token1.address === NATIVE_TOKEN.symbol) {
    toki1 = W_NATIVE_ADDRESS as `0x${string}`;
  }

  const pairFor = await viemClient.readContract({
    abi: CONTRACTS.FACTORY_ABI,
    address: CONTRACTS.FACTORY_ADDRESS,
    functionName: "getPair",
    args: [toki0, toki1, stable],
  });

  if (pairFor && pairFor !== ZERO_ADDRESS) {
    stores.emitter.emit(ACTIONS.ERROR, "Pair already exists");
    throw new Error("Pair already exists");
  }

  let allowance0TXID = getTXUUID();
  let allowance1TXID = getTXUUID();
  let depositTXID = getTXUUID();
  let createGaugeTXID = getTXUUID();
  let stakeAllowanceTXID = getTXUUID();
  let stakeTXID = getTXUUID();

  stores.emitter.emit(ACTIONS.TX_ADDED, {
    title: `Create liquidity pool for ${token0.symbol}/${token1.symbol}`,
    type: "Liquidity",
    verb: "Liquidity Pool Created",
    transactions: [
      {
        uuid: allowance0TXID,
        description: `Checking your ${token0.symbol} allowance`,
        status: "WAITING",
      },
      {
        uuid: allowance1TXID,
        description: `Checking your ${token1.symbol} allowance`,
        status: "WAITING",
      },
      {
        uuid: depositTXID,
        description: `Create liquidity pool`,
        status: "WAITING",
      },
      {
        uuid: createGaugeTXID,
        description: `Create gauge`,
        status: "WAITING",
      },
      {
        uuid: stakeAllowanceTXID,
        description: `Checking your pool allowance`,
        status: "WAITING",
      },
      {
        uuid: stakeTXID,
        description: `Stake LP tokens in the gauge`,
        status: "WAITING",
      },
    ],
  });

  let allowance0: string | null = "0";
  let allowance1: string | null = "0";

  // CHECK ALLOWANCES AND SET TX DISPLAY
  if (token0.address !== NATIVE_TOKEN.symbol) {
    allowance0 = await getDepositAllowance(token0, account);
    if (!allowance0) throw new Error("Couldnt get allowance");
    if (BigNumber(allowance0).lt(amount0)) {
      stores.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowance0TXID,
        description: `Allow the router to spend your ${token0.symbol}`,
      });
    } else {
      stores.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowance0TXID,
        description: `Allowance on ${token0.symbol} sufficient`,
        status: "DONE",
      });
    }
  } else {
    allowance0 = MAX_UINT256;
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: allowance0TXID,
      description: `Allowance on ${token0.symbol} sufficient`,
      status: "DONE",
    });
  }

  if (token1.address !== NATIVE_TOKEN.symbol) {
    allowance1 = await getDepositAllowance(token1, account);
    if (!allowance1) throw new Error("Couldnt get allowance");
    if (BigNumber(allowance1).lt(amount1)) {
      stores.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowance1TXID,
        description: `Allow the router to spend your ${token1.symbol}`,
      });
    } else {
      stores.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowance1TXID,
        description: `Allowance on ${token1.symbol} sufficient`,
        status: "DONE",
      });
    }
  } else {
    allowance1 = MAX_UINT256;
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: allowance1TXID,
      description: `Allowance on ${token1.symbol} sufficient`,
      status: "DONE",
    });
  }

  // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
  if (BigNumber(allowance0).lt(amount0)) {
    await writeApprove(
      walletClient,
      allowance0TXID,
      token0.address,
      CONTRACTS.ROUTER_ADDRESS
    );
  }

  if (BigNumber(allowance1).lt(amount1)) {
    await writeApprove(
      walletClient,
      allowance1TXID,
      token1.address,
      CONTRACTS.ROUTER_ADDRESS
    );
  }

  // SUBMIT DEPOSIT TRANSACTION
  const sendSlippage = BigNumber(100).minus(slippage).div(100);
  const sendAmount0 = BigNumber(amount0)
    .times(10 ** token0.decimals)
    .toFixed(0);
  const sendAmount1 = BigNumber(amount1)
    .times(10 ** token1.decimals)
    .toFixed(0);
  const deadline = "" + moment().add(600, "seconds").unix();
  const sendAmount0Min = BigNumber(amount0)
    .times(sendSlippage)
    .times(10 ** token0.decimals)
    .toFixed(0);
  const sendAmount1Min = BigNumber(amount1)
    .times(sendSlippage)
    .times(10 ** token1.decimals)
    .toFixed(0);

  await writeAddLiquidity(
    walletClient,
    depositTXID,
    token0,
    token1,
    stable,
    sendAmount0,
    sendAmount1,
    sendAmount0Min,
    sendAmount1Min,
    deadline
  );

  let tok0 = token0.address;
  let tok1 = token1.address;
  if (token0.address === NATIVE_TOKEN.symbol) {
    tok0 = W_NATIVE_ADDRESS as `0x${string}`;
  }
  if (token1.address === NATIVE_TOKEN.symbol) {
    tok1 = W_NATIVE_ADDRESS as `0x${string}`;
  }

  const _pairFor = await viemClient.readContract({
    abi: CONTRACTS.FACTORY_ABI,
    address: CONTRACTS.FACTORY_ADDRESS,
    functionName: "getPair",
    args: [tok0, tok1, stable],
  });

  await writeCreateGauge(walletClient, createGaugeTXID, _pairFor);

  const gaugeAddress = await viemClient.readContract({
    abi: CONTRACTS.VOTER_ABI,
    address: CONTRACTS.VOTER_ADDRESS,
    functionName: "gauges",
    args: [_pairFor],
  });

  const balanceOf = await viemClient.readContract({
    abi: CONTRACTS.PAIR_ABI,
    address: _pairFor,
    functionName: "balanceOf",
    args: [account],
  });

  const pair = (await getPairByAddress(account, _pairFor)) as Gauge | null; // this has to have gauge because it was created moment ago

  const stakeAllowance = await getStakeAllowance(pair, account, _pairFor);
  if (!stakeAllowance) throw new Error("stakeAllowance is null");

  if (BigNumber(stakeAllowance).lt(BigNumber(formatEther(balanceOf)))) {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: stakeAllowanceTXID,
      description: `Allow the router to spend your ${
        pair?.symbol ?? "LP token"
      }`,
    });
  } else {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: stakeAllowanceTXID,
      description: `Allowance on ${pair?.symbol ?? "LP token"} sufficient`,
      status: "DONE",
    });
  }

  if (BigNumber(stakeAllowance).lt(BigNumber(formatEther(balanceOf)))) {
    await writeApprove(
      walletClient,
      stakeAllowanceTXID,
      _pairFor,
      gaugeAddress
    );
  }

  await writeDeposit(walletClient, stakeTXID, gaugeAddress, balanceOf);
};

const createPairDeposit = async (
  account: Address | undefined,
  options: {
    token0: BaseAsset | null;
    token1: BaseAsset | null;
    amount0: string;
    amount1: string;
    isStable: boolean;
    slippage: string;
  }
) => {
  if (!account) {
    console.warn("account not found");
    throw new Error();
  }

  const {
    token0,
    token1,
    amount0,
    amount1,
    isStable: stable,
    slippage,
  } = options;

  if (!token0 || !token1) {
    console.warn("tokens not found");
    throw new Error("tokens not found");
  }

  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("wallet not found");
  }

  let toki0 = token0.address;
  let toki1 = token1.address;
  if (token0.address === NATIVE_TOKEN.symbol) {
    toki0 = W_NATIVE_ADDRESS as `0x${string}`;
  }
  if (token1.address === NATIVE_TOKEN.symbol) {
    toki1 = W_NATIVE_ADDRESS as `0x${string}`;
  }

  const pairFor = await viemClient.readContract({
    abi: CONTRACTS.FACTORY_ABI,
    address: CONTRACTS.FACTORY_ADDRESS,
    functionName: "getPair",
    args: [toki0, toki1, stable],
  });

  if (pairFor && pairFor !== ZERO_ADDRESS) {
    stores.emitter.emit(ACTIONS.ERROR, "Pair already exists");
    throw new Error("Pair already exists");
  }

  let allowance0TXID = getTXUUID();
  let allowance1TXID = getTXUUID();
  let depositTXID = getTXUUID();
  let createGaugeTXID = getTXUUID();

  stores.emitter.emit(ACTIONS.TX_ADDED, {
    title: `Create liquidity pool for ${token0.symbol}/${token1.symbol}`,
    type: "Liquidity",
    verb: "Liquidity Pool Created",
    transactions: [
      {
        uuid: allowance0TXID,
        description: `Checking your ${token0.symbol} allowance`,
        status: "WAITING",
      },
      {
        uuid: allowance1TXID,
        description: `Checking your ${token1.symbol} allowance`,
        status: "WAITING",
      },
      {
        uuid: depositTXID,
        description: `Create liquidity pool`,
        status: "WAITING",
      },
      {
        uuid: createGaugeTXID,
        description: `Create gauge`,
        status: "WAITING",
      },
    ],
  });

  let allowance0: string | null = "0";
  let allowance1: string | null = "0";

  if (token0.address !== NATIVE_TOKEN.symbol) {
    allowance0 = await getDepositAllowance(token0, account);
    if (!allowance0) throw new Error("Error getting allowance0");
    if (BigNumber(allowance0).lt(amount0)) {
      stores.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowance0TXID,
        description: `Allow the router to spend your ${token0.symbol}`,
      });
    } else {
      stores.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowance0TXID,
        description: `Allowance on ${token0.symbol} sufficient`,
        status: "DONE",
      });
    }
  } else {
    allowance0 = MAX_UINT256;
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: allowance0TXID,
      description: `Allowance on ${token0.symbol} sufficient`,
      status: "DONE",
    });
  }

  if (token1.address !== NATIVE_TOKEN.symbol) {
    allowance1 = await getDepositAllowance(token1, account);
    if (!allowance1) throw new Error("couldnt get allowance");
    if (BigNumber(allowance1).lt(amount1)) {
      stores.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowance1TXID,
        description: `Allow the router to spend your ${token1.symbol}`,
      });
    } else {
      stores.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowance1TXID,
        description: `Allowance on ${token1.symbol} sufficient`,
        status: "DONE",
      });
    }
  } else {
    allowance1 = MAX_UINT256;
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: allowance1TXID,
      description: `Allowance on ${token1.symbol} sufficient`,
      status: "DONE",
    });
  }

  // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
  if (BigNumber(allowance0).lt(amount0)) {
    await writeApprove(
      walletClient,
      allowance0TXID,
      token0.address,
      CONTRACTS.ROUTER_ADDRESS
    );
  }

  if (BigNumber(allowance1).lt(amount1)) {
    await writeApprove(
      walletClient,
      allowance1TXID,
      token1.address,
      CONTRACTS.ROUTER_ADDRESS
    );
  }

  const sendSlippage = BigNumber(100).minus(slippage).div(100);
  const sendAmount0 = BigNumber(amount0)
    .times(10 ** token0.decimals)
    .toFixed(0);
  const sendAmount1 = BigNumber(amount1)
    .times(10 ** token1.decimals)
    .toFixed(0);
  const deadline = "" + moment().add(600, "seconds").unix();
  const sendAmount0Min = BigNumber(amount0)
    .times(sendSlippage)
    .times(10 ** token0.decimals)
    .toFixed(0);
  const sendAmount1Min = BigNumber(amount1)
    .times(sendSlippage)
    .times(10 ** token1.decimals)
    .toFixed(0);

  await writeAddLiquidity(
    walletClient,
    depositTXID,
    token0,
    token1,
    stable,
    sendAmount0,
    sendAmount1,
    sendAmount0Min,
    sendAmount1Min,
    deadline
  );

  let tok0 = token0.address;
  let tok1 = token1.address;
  if (token0.address === NATIVE_TOKEN.symbol) {
    tok0 = W_NATIVE_ADDRESS as `0x${string}`;
  }
  if (token1.address === NATIVE_TOKEN.symbol) {
    tok1 = W_NATIVE_ADDRESS as `0x${string}`;
  }

  const _pairFor = await viemClient.readContract({
    abi: CONTRACTS.FACTORY_ABI,
    address: CONTRACTS.FACTORY_ADDRESS,
    functionName: "getPair",
    args: [tok0, tok1, stable],
  });

  await writeCreateGauge(walletClient, createGaugeTXID, _pairFor);
};

const getDepositAllowance = async (
  token: BaseAsset,
  address: `0x${string}`
) => {
  const allowance = await viemClient.readContract({
    address: token.address,
    abi: CONTRACTS.ERC20_ABI,
    functionName: "allowance",
    args: [address, CONTRACTS.ROUTER_ADDRESS],
  });

  return formatUnits(allowance, token.decimals);
};

const getStakeAllowance = async (
  pair: Gauge | null,
  address: `0x${string}`,
  pairAddress?: `0x${string}`
) => {
  if (pair === null && !!pairAddress) {
    const tokenContract = {
      abi: CONTRACTS.ERC20_ABI,
      address: pairAddress,
    } as const;
    const allowance = await viemClient.readContract({
      ...tokenContract,
      functionName: "allowance",
      args: [address, pairAddress],
    });
    return formatUnits(allowance, PAIR_DECIMALS);
  } else if (pair !== null) {
    const tokenContract = {
      abi: CONTRACTS.ERC20_ABI,
      address: pair.address,
    } as const;
    const allowance = await viemClient.readContract({
      ...tokenContract,
      functionName: "allowance",
      args: [address, pair.gauge.address],
    });
    return formatUnits(allowance, PAIR_DECIMALS);
  }
};

const writeAddLiquidity = async (
  walletClient: WalletClient,
  depositTXID: string,
  token0: BaseAsset,
  token1: BaseAsset,
  stable: boolean,
  sendAmount0: string,
  sendAmount1: string,
  sendAmount0Min: string,
  sendAmount1Min: string,
  deadline: string
) => {
  const [account] = await walletClient.getAddresses();
  const routerContract = {
    abi: CONTRACTS.ROUTER_ABI,
    address: CONTRACTS.ROUTER_ADDRESS,
  } as const;
  const writeWithoutNativeToken = async () => {
    const { request } = await viemClient.simulateContract({
      ...routerContract,
      account,
      functionName: "addLiquidity",
      args: [
        token0.address,
        token1.address,
        stable,
        BigInt(sendAmount0),
        BigInt(sendAmount1),
        BigInt(sendAmount0Min),
        BigInt(sendAmount1Min),
        account,
        BigInt(deadline),
      ],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };
  const writeWithNativeTokenFirst = async () => {
    const { request } = await viemClient.simulateContract({
      ...routerContract,
      account,
      functionName: "addLiquidityETH",
      args: [
        token1.address,
        stable,
        BigInt(sendAmount1),
        BigInt(sendAmount1Min),
        BigInt(sendAmount0Min),
        account,
        BigInt(deadline),
      ],
      value: BigInt(sendAmount0),
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };
  const writeWithNativeTokenSecond = async () => {
    const { request } = await viemClient.simulateContract({
      ...routerContract,
      account,
      functionName: "addLiquidityETH",
      args: [
        token0.address,
        stable,
        BigInt(sendAmount0),
        BigInt(sendAmount0Min),
        BigInt(sendAmount1Min),
        account,
        BigInt(deadline),
      ],
      value: BigInt(sendAmount1),
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };
  if (
    token0.address !== NATIVE_TOKEN.symbol &&
    token1.address !== NATIVE_TOKEN.symbol
  ) {
    await writeContractWrapper(depositTXID, writeWithoutNativeToken);
  } else if (token0.address === NATIVE_TOKEN.symbol) {
    await writeContractWrapper(depositTXID, writeWithNativeTokenFirst);
  } else {
    await writeContractWrapper(depositTXID, writeWithNativeTokenSecond);
  }
};

const writeCreateGauge = async (
  walletClient: WalletClient,
  createGaugeTXID: string,
  pairAddress: `0x${string}`
) => {
  const [account] = await walletClient.getAddresses();
  const write = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: CONTRACTS.VOTER_ADDRESS,
      abi: CONTRACTS.VOTER_ABI,
      functionName: "createGauge",
      args: [pairAddress],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };
  await writeContractWrapper(createGaugeTXID, write);
};

const writeDeposit = async (
  walletClient: WalletClient,
  stakeTXID: string,
  gaugeAddress: `0x${string}`,
  balanceOf: bigint
) => {
  const [account] = await walletClient.getAddresses();
  const write = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      abi: CONTRACTS.GAUGE_ABI,
      address: gaugeAddress,
      functionName: "deposit",
      args: [balanceOf, BigInt(0)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };
  await writeContractWrapper(stakeTXID, write);
};
