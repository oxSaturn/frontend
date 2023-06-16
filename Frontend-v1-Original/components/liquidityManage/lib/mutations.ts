import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, type Address, type WalletClient } from "wagmi";
import { getWalletClient } from "@wagmi/core";
import { canto } from "wagmi/chains";
import { formatEther, formatUnits } from "viem";
import BigNumber from "bignumber.js";
import dayjs from "dayjs";

import viemClient from "../../../stores/connectors/viem";
import {
  writeApprove,
  writeContractWrapper,
} from "../../../lib/global/mutations";
import {
  BaseAsset,
  Gauge,
  Pair,
  RouteAsset,
  TransactionStatus,
  hasGauge,
} from "../../../stores/types/types";
import {
  CONTRACTS,
  MAX_UINT256,
  NATIVE_TOKEN,
  PAIR_DECIMALS,
  QUERY_KEYS,
  W_NATIVE_ADDRESS,
  ZERO_ADDRESS,
} from "../../../stores/constants/constants";
import { getTXUUID } from "../../../utils/utils";
import { useTransactionStore } from "../../transactionQueue/transactionQueue";

import { getPairByAddress } from "./queries";

// --- hooks ---

export function useCreatePairStake(onSuccess?: () => void) {
  const queryClient = useQueryClient();
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
    onSuccess: () => {
      onSuccess?.();
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
    },
  });
}

export function useCreatePairDeposit(onSuccess?: () => void) {
  const queryClient = useQueryClient();
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
    onSuccess: () => {
      onSuccess?.();
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
    },
  });
}

export function useAddLiquidity(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: {
      token0: BaseAsset | null;
      token1: BaseAsset | null;
      amount0: string;
      amount1: string;
      pair: Pair | undefined;
      slippage: string;
    }) => addLiquidity(address, options),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
      onSuccess?.();
    },
  });
}

export function useStakeLiquidity(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: { pair: Pair | undefined }) =>
      stakeLiquidity(address, options),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
      onSuccess?.();
    },
  });
}

export function useAddLiquidityAndStake(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: {
      token0: BaseAsset | null;
      token1: BaseAsset | null;
      amount0: string;
      amount1: string;
      minLiquidity: string;
      pair: Pair | undefined;
      slippage: string;
    }) => addLiquidityAndStake(address, options),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
      onSuccess?.();
    },
  });
}

export function useRemoveLiquidity(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: {
      token0: BaseAsset | RouteAsset;
      token1: BaseAsset | RouteAsset;
      pair: Pair;
      slippage: string;
    }) => removeLiquidity(address, options),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
      onSuccess?.();
    },
  });
}

export function useUnstakeAndRemoveLiquidity(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: {
      token0: BaseAsset | RouteAsset;
      token1: BaseAsset | RouteAsset;
      amount: string;
      amount0: string | undefined;
      amount1: string | undefined;
      pair: Gauge;
      slippage: string;
    }) => unstakeAndRemoveLiquidity(address, options),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
      onSuccess?.();
    },
  });
}

export function useUnstakeLiquidity(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: { amount: string; pair: Gauge }) =>
      unstakeLiquidity(address, options),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
      onSuccess?.();
    },
  });
}

export function useCreateGauge(onSuccess?: () => void) {
  const { address } = useAccount();
  return useMutation({
    mutationFn: (pair: Pair | undefined) => createGauge(address, pair),
    onSuccess,
  });
}

// --- functions ---

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
    throw new Error("Pair already exists");
  }

  let allowance0TXID = getTXUUID();
  let allowance1TXID = getTXUUID();
  let depositTXID = getTXUUID();
  let createGaugeTXID = getTXUUID();
  let stakeAllowanceTXID = getTXUUID();
  let stakeTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: allowance0TXID,
        description: `Checking your ${token0.symbol} allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: allowance1TXID,
        description: `Checking your ${token1.symbol} allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: depositTXID,
        description: `Create liquidity pool`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: createGaugeTXID,
        description: `Create gauge`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: stakeAllowanceTXID,
        description: `Checking your pool allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: stakeTXID,
        description: `Stake LP tokens in the gauge`,
        status: TransactionStatus.WAITING,
      },
    ],
    action: `Create liquidity pool for ${token0.symbol}/${token1.symbol}`,
    purpose: "Liquidity",
  });

  let allowance0: string | null = "0";
  let allowance1: string | null = "0";

  // CHECK ALLOWANCES AND SET TX DISPLAY
  if (token0.address !== NATIVE_TOKEN.symbol) {
    allowance0 = await getDepositAllowance(token0, account);
    if (!allowance0) throw new Error("Couldnt get allowance");
    if (BigNumber(allowance0).lt(amount0)) {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance0TXID,
        description: `Allow the router to spend your ${token0.symbol}`,
        status: TransactionStatus.WAITING,
      });
    } else {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance0TXID,
        description: `Allowance on ${token0.symbol} sufficient`,
        status: TransactionStatus.DONE,
      });
    }
  } else {
    allowance0 = MAX_UINT256;
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowance0TXID,
      description: `Allowance on ${token0.symbol} sufficient`,
      status: TransactionStatus.DONE,
    });
  }

  if (token1.address !== NATIVE_TOKEN.symbol) {
    allowance1 = await getDepositAllowance(token1, account);
    if (!allowance1) throw new Error("Couldnt get allowance");
    if (BigNumber(allowance1).lt(amount1)) {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance1TXID,
        description: `Allow the router to spend your ${token1.symbol}`,
        status: TransactionStatus.WAITING,
      });
    } else {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance1TXID,
        description: `Allowance on ${token0.symbol} sufficient`,
        status: TransactionStatus.DONE,
      });
    }
  } else {
    allowance1 = MAX_UINT256;
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowance1TXID,
      description: `Allowance on ${token0.symbol} sufficient`,
      status: TransactionStatus.DONE,
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
  const deadline = "" + dayjs().add(600, "seconds").unix();
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

  const pair = (await getPairByAddress(account, _pairFor, [])) as Gauge | null; // this has to have gauge because it was created dayjs ago

  const stakeAllowance = await getStakeAllowance(pair, account, _pairFor);
  if (!stakeAllowance) throw new Error("stakeAllowance is null");

  if (BigNumber(stakeAllowance).lt(BigNumber(formatEther(balanceOf)))) {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: stakeAllowanceTXID,
      description: `Allow the router to spend your ${
        pair?.symbol ?? "LP token"
      }`,
      status: TransactionStatus.WAITING,
    });
  } else {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: stakeAllowanceTXID,
      description: `Allowance on ${pair?.symbol ?? "LP token"} sufficient`,
      status: TransactionStatus.DONE,
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
    throw new Error("Pair already exists");
  }

  let allowance0TXID = getTXUUID();
  let allowance1TXID = getTXUUID();
  let depositTXID = getTXUUID();
  let createGaugeTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: allowance0TXID,
        description: `Checking your ${token0.symbol} allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: allowance1TXID,
        description: `Checking your ${token1.symbol} allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: depositTXID,
        description: `Create liquidity pool`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: createGaugeTXID,
        description: `Create gauge`,
        status: TransactionStatus.WAITING,
      },
    ],
    action: `Create liquidity pool for ${token0.symbol}/${token1.symbol}`,
    purpose: "Liquidity",
  });

  let allowance0: string = "0";
  let allowance1: string = "0";

  if (token0.address !== NATIVE_TOKEN.symbol) {
    allowance0 = await getDepositAllowance(token0, account);
    if (BigNumber(allowance0).lt(amount0)) {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance0TXID,
        description: `Allow the router to spend your ${token0.symbol}`,
        status: TransactionStatus.WAITING,
      });
    } else {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance0TXID,
        description: `Allowance on ${token0.symbol} sufficient`,
        status: TransactionStatus.DONE,
      });
    }
  } else {
    allowance0 = MAX_UINT256;
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowance0TXID,
      description: `Allowance on ${token0.symbol} sufficient`,
      status: TransactionStatus.DONE,
    });
  }

  if (token1.address !== NATIVE_TOKEN.symbol) {
    allowance1 = await getDepositAllowance(token1, account);
    if (BigNumber(allowance1).lt(amount1)) {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance1TXID,
        description: `Allow the router to spend your ${token1.symbol}`,
        status: TransactionStatus.WAITING,
      });
    } else {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance1TXID,
        description: `Allowance on ${token1.symbol} sufficient`,
        status: TransactionStatus.DONE,
      });
    }
  } else {
    allowance1 = MAX_UINT256;
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowance1TXID,
      description: `Allowance on ${token1.symbol} sufficient`,
      status: TransactionStatus.DONE,
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
  const deadline = "" + dayjs().add(600, "seconds").unix();
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

const addLiquidity = async (
  account: Address | undefined,
  options: {
    token0: BaseAsset | null;
    token1: BaseAsset | null;
    amount0: string;
    amount1: string;
    pair: Pair | undefined;
    slippage: string;
  }
) => {
  if (!account) {
    console.warn("account not found");
    throw new Error("account not found");
  }

  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    console.warn("walletClient not found");
    throw new Error("walletClient not found");
  }

  const { token0, token1, amount0, amount1, pair, slippage } = options;

  if (!token0 || !token1 || !pair) {
    console.warn("token0 or token1 or pair not found");
    throw new Error("token0 or token1 or pair not found");
  }

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let allowance0TXID = getTXUUID();
  let allowance1TXID = getTXUUID();
  let depositTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: allowance0TXID,
        description: `Checking your ${token0.symbol} allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: allowance1TXID,
        description: `Checking your ${token1.symbol} allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: depositTXID,
        description: `Deposit tokens in the pool`,
        status: TransactionStatus.WAITING,
      },
    ],
    action: `Add liquidity to ${pair.symbol}`,
    purpose: "Liquidity",
  });

  let allowance0: string | null = "0";
  let allowance1: string | null = "0";

  // CHECK ALLOWANCES AND SET TX DISPLAY
  if (token0.address !== NATIVE_TOKEN.symbol) {
    allowance0 = await getDepositAllowance(token0, account);
    if (!allowance0) throw new Error("Error getting allowance");
    if (BigNumber(allowance0).lt(amount0)) {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance0TXID,
        description: `Approve ${token0.symbol} spending`,
        status: TransactionStatus.WAITING,
      });
    } else {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance0TXID,
        description: `Allowance on ${token0.symbol} sufficient`,
        status: TransactionStatus.DONE,
      });
    }
  } else {
    allowance0 = MAX_UINT256;
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowance0TXID,
      description: `Allowance on ${token0.symbol} sufficient`,
      status: TransactionStatus.DONE,
    });
  }

  if (token1.address !== NATIVE_TOKEN.symbol) {
    allowance1 = await getDepositAllowance(token1, account);
    if (!allowance1) throw new Error("couldnt get allowance");
    if (BigNumber(allowance1).lt(amount1)) {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance1TXID,
        description: `Approve ${token1.symbol} spending`,
        status: TransactionStatus.WAITING,
      });
    } else {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance1TXID,
        description: `Allowance on ${token1.symbol} sufficient`,
        status: TransactionStatus.DONE,
      });
    }
  } else {
    allowance1 = MAX_UINT256;
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowance1TXID,
      description: `Allowance on ${token1.symbol} sufficient`,
      status: TransactionStatus.DONE,
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
  const deadline = "" + dayjs().add(600, "seconds").unix();
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
    pair.stable,
    sendAmount0,
    sendAmount1,
    sendAmount0Min,
    sendAmount1Min,
    deadline
  );
};

const stakeLiquidity = async (
  account: Address | undefined,
  options: { pair: Pair | undefined }
) => {
  if (!account) {
    console.warn("account not found");
    throw new Error("account not found");
  }

  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("wallet not found");
  }

  const { pair } = options;
  if (!pair || (pair && !hasGauge(pair))) {
    console.warn("pair");
    throw new Error("pair not found");
  }

  let stakeAllowanceTXID = getTXUUID();
  let stakeTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: stakeAllowanceTXID,
        description: `Checking your ${pair.symbol} allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: stakeTXID,
        description: `Stake LP tokens in the gauge`,
        status: TransactionStatus.WAITING,
      },
    ],
    action: `Stake ${pair.symbol} in the gauge`,
    purpose: "Liquidity",
  });

  const stakeAllowance = await getStakeAllowance(pair, account);
  if (!stakeAllowance) throw new Error("Error getting stake allowance");

  const balanceOf = await viemClient.readContract({
    abi: CONTRACTS.PAIR_ABI,
    address: pair.address,
    functionName: "balanceOf",
    args: [account],
  });

  if (BigNumber(stakeAllowance).lt(BigNumber(formatEther(balanceOf)))) {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: stakeAllowanceTXID,
      description: `Allow the router to spend your ${pair.symbol}`,
      status: TransactionStatus.WAITING,
    });
  } else {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: stakeAllowanceTXID,
      description: `Allowance on ${pair.symbol} sufficient`,
      status: TransactionStatus.DONE,
    });
  }

  if (!pair.gauge?.address) throw new Error("Gauge address is undefined");

  if (BigNumber(stakeAllowance).lt(BigNumber(formatEther(balanceOf)))) {
    await writeApprove(
      walletClient,
      stakeAllowanceTXID,
      pair.address,
      pair.gauge.address
    );
  }

  await writeDeposit(walletClient, stakeTXID, pair.gauge.address, balanceOf);
};

const addLiquidityAndStake = async (
  account: Address | undefined,
  options: {
    token0: BaseAsset | null;
    token1: BaseAsset | null;
    amount0: string;
    amount1: string;
    minLiquidity: string;
    pair: Pair | undefined;
    slippage: string;
  }
) => {
  if (!account) {
    console.warn("account not found");
    throw new Error("account not found");
  }

  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("wallet not found");
  }

  const { token0, token1, amount0, amount1, minLiquidity, pair, slippage } =
    options;

  if (!token0 || !token1 || !pair || !hasGauge(pair)) {
    throw new Error("token or pair not found");
  }

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let allowance0TXID = getTXUUID();
  let allowance1TXID = getTXUUID();
  let stakeAllowanceTXID = getTXUUID();
  let depositTXID = getTXUUID();
  let stakeTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: allowance0TXID,
        description: `Checking your ${token0.symbol} allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: allowance1TXID,
        description: `Checking your ${token1.symbol} allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: stakeAllowanceTXID,
        description: `Checking your ${pair.symbol} allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: depositTXID,
        description: `Deposit tokens in the pool`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: stakeTXID,
        description: `Stake LP tokens in the gauge`,
        status: TransactionStatus.WAITING,
      },
    ],
    action: `Add liquidity to ${pair.symbol}`,
    purpose: "Liquidity",
  });

  let allowance0: string | null = "0";
  let allowance1: string | null = "0";

  // CHECK ALLOWANCES AND SET TX DISPLAY
  if (token0.address !== NATIVE_TOKEN.symbol) {
    allowance0 = await getDepositAllowance(token0, account);
    if (!allowance0) throw new Error();
    if (BigNumber(allowance0).lt(amount0)) {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance0TXID,
        description: `Allow the router to spend your ${token0.symbol}`,
        status: TransactionStatus.WAITING,
      });
    } else {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance0TXID,
        description: `Allowance on ${token0.symbol} sufficient`,
        status: TransactionStatus.DONE,
      });
    }
  } else {
    allowance0 = MAX_UINT256;
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowance0TXID,
      description: `Allowance on ${token0.symbol} sufficient`,
      status: TransactionStatus.DONE,
    });
  }

  if (token1.address !== NATIVE_TOKEN.symbol) {
    allowance1 = await getDepositAllowance(token1, account);
    if (!allowance1) throw new Error("couldnt get allowance");
    if (BigNumber(allowance1).lt(amount1)) {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance1TXID,
        description: `Allow the router to spend your ${token1.symbol}`,
        status: TransactionStatus.WAITING,
      });
    } else {
      useTransactionStore.getState().updateTransactionStatus({
        uuid: allowance1TXID,
        description: `Allowance on ${token1.symbol} sufficient`,
        status: TransactionStatus.DONE,
      });
    }
  } else {
    allowance1 = MAX_UINT256;
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowance1TXID,
      description: `Allowance on ${token1.symbol} sufficient`,
      status: TransactionStatus.DONE,
    });
  }

  const stakeAllowance = await getStakeAllowance(pair, account);
  if (!stakeAllowance) throw new Error("Error getting stake allowance");

  if (BigNumber(stakeAllowance).lt(minLiquidity)) {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: stakeAllowanceTXID,
      description: `Allow the gauge to spend your ${pair.symbol}`,
      status: TransactionStatus.WAITING,
    });
  } else {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: stakeAllowanceTXID,
      description: `Allowance on ${pair.symbol} sufficient`,
      status: TransactionStatus.DONE,
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

  if (!pair.gauge?.address) throw new Error("Gauge address is undefined");

  if (BigNumber(stakeAllowance).lt(minLiquidity)) {
    await writeApprove(
      walletClient,
      stakeAllowanceTXID,
      pair.address,
      pair.gauge.address
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
  const deadline = "" + dayjs().add(600, "seconds").unix();
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
    pair.stable,
    sendAmount0,
    sendAmount1,
    sendAmount0Min,
    sendAmount1Min,
    deadline
  );

  const balanceOf = await viemClient.readContract({
    abi: CONTRACTS.PAIR_ABI,
    address: pair.address,
    functionName: "balanceOf",
    args: [account],
  });

  await writeDeposit(walletClient, stakeTXID, pair.gauge.address, balanceOf);
};

const createGauge = async (
  account: Address | undefined,
  pair: Pair | undefined
) => {
  if (!account) {
    console.warn("account not found");
    throw new Error("account not found");
  }
  if (!pair) {
    console.warn("pair not found");
    throw new Error("pair not found");
  }

  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("wallet not found");
  }

  let createGaugeTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: createGaugeTXID,
        description: `Create gauge`,
        status: TransactionStatus.WAITING,
      },
    ],
    action: `Create liquidity gauge for ${pair.token0.symbol}/${pair.token1.symbol}`,
    purpose: "Liquidty",
  });

  await writeCreateGauge(walletClient, createGaugeTXID, pair.address);
};

const removeLiquidity = async (
  account: Address | undefined,
  options: {
    token0: BaseAsset | RouteAsset;
    token1: BaseAsset | RouteAsset;
    pair: Pair;
    slippage: string;
  }
) => {
  if (!account) {
    console.warn("account not found");
    throw new Error("account not foundva");
  }

  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("wallet not found");
  }

  const { token0, token1, pair, slippage } = options;
  if (!token0 || !token1 || !pair) {
    throw new Error("invalid options in remove liq");
  }

  let allowanceTXID = getTXUUID();
  let withdrawTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: allowanceTXID,
        description: `Checking your ${pair.symbol} allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: withdrawTXID,
        description: `Withdraw tokens from the pool`,
        status: TransactionStatus.WAITING,
      },
    ],
    action: `Remove liquidity from ${pair.symbol}`,
    purpose: "Liquidty",
  });

  // CHECK ALLOWANCES AND SET TX DISPLAY
  const allowance = await getWithdrawAllowance(pair, account);
  if (!allowance) throw new Error("Error getting withdraw allowance");
  if (!pair.balance) throw new Error("No pair balance");
  if (BigNumber(allowance).lt(pair.balance)) {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowanceTXID,
      description: `Allow the router to spend your ${pair.symbol}`,
      status: TransactionStatus.WAITING,
    });
  } else {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowanceTXID,
      description: `Allowance on ${pair.symbol} sufficient`,
      status: TransactionStatus.DONE,
    });
  }

  // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
  if (BigNumber(allowance).lt(pair.balance)) {
    await writeApprove(
      walletClient,
      allowanceTXID,
      pair.address,
      CONTRACTS.ROUTER_ADDRESS
    );
  }

  // SUBMIT WITHDRAW TRANSACTION
  const sendAmount = BigNumber(pair.balance)
    .times(10 ** PAIR_DECIMALS)
    .toFixed(0);

  const [amountA, amountB] = await viemClient.readContract({
    address: CONTRACTS.ROUTER_ADDRESS,
    abi: CONTRACTS.ROUTER_ABI,
    functionName: "quoteRemoveLiquidity",
    args: [token0.address, token1.address, pair.stable, BigInt(sendAmount)],
  });

  const sendSlippage = BigNumber(100).minus(slippage).div(100);
  const deadline = "" + dayjs().add(600, "seconds").unix();
  const sendAmount0Min = BigNumber(amountA.toString())
    .times(sendSlippage)
    .toFixed(0);
  const sendAmount1Min = BigNumber(amountB.toString())
    .times(sendSlippage)
    .toFixed(0);

  await writeRemoveLiquidty(
    walletClient,
    withdrawTXID,
    token0.address,
    token1.address,
    pair.stable,
    BigInt(sendAmount),
    sendAmount0Min,
    sendAmount1Min,
    deadline
  );
};

const getWithdrawAllowance = async (pair: Pair, address: `0x${string}`) => {
  const allowance = await viemClient.readContract({
    address: pair.address,
    abi: CONTRACTS.ERC20_ABI,
    functionName: "allowance",
    args: [address, CONTRACTS.ROUTER_ADDRESS],
  });

  return formatUnits(allowance, PAIR_DECIMALS);
};

const writeRemoveLiquidty = async (
  walletClient: WalletClient,
  withdrawTXID: string,
  token0Address: `0x${string}`,
  token1Address: `0x${string}`,
  stable: boolean,
  sendAmount: bigint,
  sendAmount0Min: string,
  sendAmount1Min: string,
  deadline: string
) => {
  const [account] = await walletClient.getAddresses();
  const write = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      abi: CONTRACTS.ROUTER_ABI,
      address: CONTRACTS.ROUTER_ADDRESS,
      functionName: "removeLiquidity",
      args: [
        token0Address,
        token1Address,
        stable,
        sendAmount,
        BigInt(sendAmount0Min),
        BigInt(sendAmount1Min),
        account,
        BigInt(deadline),
      ],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };
  await writeContractWrapper(withdrawTXID, write);
};

const unstakeAndRemoveLiquidity = async (
  account: Address | undefined,
  options: {
    token0: BaseAsset | RouteAsset;
    token1: BaseAsset | RouteAsset;
    amount: string;
    amount0: string | undefined;
    amount1: string | undefined;
    pair: Gauge;
    slippage: string;
  }
) => {
  if (!account) {
    console.warn("account not found");
    throw new Error("account not found");
  }

  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("wallet not found");
  }

  const { token0, token1, amount, amount0, amount1, pair, slippage } = options;
  if (!amount0 || !amount1) {
    throw new Error("invalid quote options in unstake and remove liq");
  }
  let allowanceTXID = getTXUUID();
  let withdrawTXID = getTXUUID();
  let unstakeTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: allowanceTXID,
        description: `Checking your ${pair.symbol} allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: unstakeTXID,
        description: `Unstake LP tokens from the gauge`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: withdrawTXID,
        description: `Withdraw tokens from the pool`,
        status: TransactionStatus.WAITING,
      },
    ],
    action: `Remove liquidity from ${pair.symbol}`,
    purpose: "Liquidity",
  });

  // CHECK ALLOWANCES AND SET TX DISPLAY
  const allowance = await getWithdrawAllowance(pair, account);
  if (!allowance) throw new Error("Error getting withdraw allowance");

  if (BigNumber(allowance).lt(amount)) {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowanceTXID,
      description: `Allow the router to spend your ${pair.symbol}`,
      status: TransactionStatus.WAITING,
    });
  } else {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowanceTXID,
      description: `Allowance on ${pair.symbol} sufficient`,
      status: TransactionStatus.DONE,
    });
  }

  // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
  if (BigNumber(allowance).lt(amount)) {
    await writeApprove(
      walletClient,
      allowanceTXID,
      pair.address,
      CONTRACTS.ROUTER_ADDRESS
    );
  }

  // SUBMIT DEPOSIT TRANSACTION
  const sendSlippage = BigNumber(100).minus(slippage).div(100);
  const sendAmount = BigNumber(amount)
    .times(10 ** PAIR_DECIMALS)
    .toFixed(0);
  const deadline = "" + dayjs().add(600, "seconds").unix();
  const sendAmount0Min = BigNumber(amount0)
    .times(sendSlippage)
    .times(10 ** token0.decimals)
    .toFixed(0);
  const sendAmount1Min = BigNumber(amount1)
    .times(sendSlippage)
    .times(10 ** token1.decimals)
    .toFixed(0);

  const withdraw = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: pair.gauge?.address,
      abi: CONTRACTS.GAUGE_ABI,
      functionName: "withdraw",
      args: [BigInt(sendAmount)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };

  await writeContractWrapper(unstakeTXID, withdraw);

  const balanceOf = await viemClient.readContract({
    abi: CONTRACTS.PAIR_ABI,
    address: pair.address,
    functionName: "balanceOf",
    args: [account],
  });

  await writeRemoveLiquidty(
    walletClient,
    withdrawTXID,
    token0.address,
    token1.address,
    pair.stable,
    balanceOf,
    sendAmount0Min,
    sendAmount1Min,
    deadline
  );
};

const unstakeLiquidity = async (
  account: Address | undefined,
  options: { amount: string; pair: Gauge }
) => {
  if (!account) {
    console.warn("account not found");
    return null;
  }

  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    console.warn("wallet");
    return null;
  }

  const { amount, pair } = options;

  let unstakeTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: unstakeTXID,
        description: `Unstake LP tokens from the gauge`,
        status: TransactionStatus.WAITING,
      },
    ],
    action: `Unstake liquidity from ${pair.symbol}`,
    purpose: "Liquidity",
  });

  // SUBMIT WITHDRAW TRANSACTION
  const sendAmount = BigNumber(amount)
    .times(10 ** PAIR_DECIMALS)
    .toFixed(0);

  const withdraw = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: pair.gauge?.address,
      abi: CONTRACTS.GAUGE_ABI,
      functionName: "withdraw",
      args: [BigInt(sendAmount)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };

  await writeContractWrapper(unstakeTXID, withdraw);
};
