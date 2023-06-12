import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { serialize, useAccount } from "wagmi";
import { getWalletClient } from "@wagmi/core";
import { Address, formatUnits } from "viem";
import { canto } from "viem/chains";
import moment from "moment";
import BigNumber from "bignumber.js";

import viemClient from "../../../stores/connectors/viem";
import {
  writeApprove,
  writeContractWrapper,
} from "../../../lib/global/mutations";
import { getTXUUID } from "../../../utils/utils";
import {
  Bribe,
  GovToken,
  Pair,
  Rewards,
  VeToken,
} from "../../../stores/types/types";
import stores from "../../../stores";
import {
  ACTIONS,
  CONTRACTS,
  QUERY_KEYS,
} from "../../../stores/constants/constants";
import { useGovToken, usePairs, useVeToken } from "../../../lib/global/queries";
import { writeClaimBribes } from "../../ssRewards/lib/mutations";
import { getRewardBalances, useRewards } from "../../ssRewards/lib/queries";
import { useVestNfts } from "../../ssVests/queries";

// --- hooks ---

export function useCreateVest(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { data: govToken } = useGovToken();
  return useMutation({
    mutationFn: (options: { amount: string; unlockTime: string }) =>
      createVest(address, { ...options, govToken }),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.GOV_TOKEN]);
      queryClient.invalidateQueries([QUERY_KEYS.VEST_NFTS]);
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
      onSuccess?.();
    },
  });
}

export function useIncreaseVestAmount(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { data: govToken } = useGovToken();
  return useMutation({
    mutationFn: (options: { amount: string; tokenID: string }) =>
      increaseVestAmount(address, { ...options, govToken }),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.GOV_TOKEN]);
      queryClient.invalidateQueries([QUERY_KEYS.VEST_NFTS]);
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
      onSuccess?.();
    },
  });
}

export function useIncreaseVestDuration(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: { unlockTime: string; tokenID: string }) =>
      increaseVestDuration(address, options),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.VEST_NFTS]);
      onSuccess?.();
    },
  });
}

export function useResetVest() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { data: govToken } = useGovToken();
  const { data: veToken } = useVeToken();
  const { data: pairs } = usePairs();
  const { data: vestNfts } = useVestNfts();
  const serialised_vestNFTs = serialize(vestNfts);
  return useMutation({
    mutationFn: (tokenID: string) =>
      resetVest(address, queryClient, {
        tokenID,
        govToken,
        veToken,
        pairs,
        serialised_vestNFTs,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.VEST_NFTS]);
    },
  });
}

export function useWithdrawVest(tokenID: string, onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { data: rewards } = useRewards(tokenID);
  return useMutation({
    mutationFn: () => withdrawVest(address, { tokenID, rewards }),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.VEST_NFTS]);
      onSuccess?.();
    },
  });
}

export function useMergeVest(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: Parameters<typeof mergeNft>[1]) =>
      mergeNft(address, options),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.VEST_NFTS]);
      onSuccess?.();
    },
  });
}

// --- functions ---

const createVest = async (
  account: Address | undefined,
  options: {
    amount: string;
    unlockTime: string;
    govToken: GovToken | undefined;
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

  const { amount, unlockTime, govToken } = options;
  if (!govToken) throw new Error("No gov token");

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let allowanceTXID = getTXUUID();
  let vestTXID = getTXUUID();

  const unlockString = moment().add(unlockTime, "seconds").format("YYYY-MM-DD");

  stores.emitter.emit(ACTIONS.TX_ADDED, {
    title: `Vest ${govToken.symbol} until ${unlockString}`,
    type: "Vest",
    verb: "Vest Created",
    transactions: [
      {
        uuid: allowanceTXID,
        description: `Checking your ${govToken.symbol} allowance`,
        status: "WAITING",
      },
      {
        uuid: vestTXID,
        description: `Vesting your tokens`,
        status: "WAITING",
      },
    ],
  });

  // CHECK ALLOWANCES AND SET TX DISPLAY
  const allowance = await getVestAllowance(govToken, account);
  if (BigNumber(allowance).lt(amount)) {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: allowanceTXID,
      description: `Allow the vesting contract to use your ${govToken.symbol}`,
    });
  } else {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: allowanceTXID,
      description: `Allowance on ${govToken.symbol} sufficient`,
      status: "DONE",
    });
  }

  // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
  if (BigNumber(allowance).lt(amount)) {
    await writeApprove(
      walletClient,
      allowanceTXID,
      govToken.address,
      CONTRACTS.VE_TOKEN_ADDRESS
    );
  }

  // SUBMIT VEST TRANSACTION
  const sendAmount = BigNumber(amount)
    .times(10 ** govToken.decimals)
    .toFixed(0);

  const writeCreateLock = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: CONTRACTS.VE_TOKEN_ADDRESS,
      abi: CONTRACTS.VE_TOKEN_ABI,
      functionName: "create_lock",
      args: [BigInt(sendAmount), BigInt(unlockTime)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };

  await writeContractWrapper(vestTXID, writeCreateLock);
};

const increaseVestAmount = async (
  account: Address | undefined,
  options: {
    amount: string;
    tokenID: string;
    govToken: GovToken | undefined;
  }
) => {
  if (!account) {
    console.warn("account not found");
    throw new Error("");
  }

  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("");
  }

  const { amount, tokenID, govToken } = options;
  if (!govToken) throw new Error("Error getting gov token in increase vest");

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let allowanceTXID = getTXUUID();
  let vestTXID = getTXUUID();

  stores.emitter.emit(ACTIONS.TX_ADDED, {
    title: `Increase vest amount on token #${tokenID}`,
    type: "Vest",
    verb: "Vest Increased",
    transactions: [
      {
        uuid: allowanceTXID,
        description: `Checking your ${govToken.symbol} allowance`,
        status: "WAITING",
      },
      {
        uuid: vestTXID,
        description: `Increasing your vest amount`,
        status: "WAITING",
      },
    ],
  });

  // CHECK ALLOWANCES AND SET TX DISPLAY
  const allowance = await getVestAllowance(govToken, account);
  if (!allowance) throw new Error("Error getting allowance in increase vest");
  if (BigNumber(allowance).lt(amount)) {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: allowanceTXID,
      description: `Allow vesting contract to use your ${govToken.symbol}`,
    });
  } else {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: allowanceTXID,
      description: `Allowance on ${govToken.symbol} sufficient`,
      status: "DONE",
    });
  }

  // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
  if (BigNumber(allowance).lt(amount)) {
    await writeApprove(
      walletClient,
      allowanceTXID,
      govToken.address,
      CONTRACTS.VE_TOKEN_ADDRESS
    );
  }

  // SUBMIT INCREASE TRANSACTION
  const sendAmount = BigNumber(amount)
    .times(10 ** govToken.decimals)
    .toFixed(0);

  const writeIncreaseAmount = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: CONTRACTS.VE_TOKEN_ADDRESS,
      abi: CONTRACTS.VE_TOKEN_ABI,
      functionName: "increase_amount",
      args: [BigInt(tokenID), BigInt(sendAmount)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };

  await writeContractWrapper(vestTXID, writeIncreaseAmount);
};

const getVestAllowance = async (token: GovToken, address: `0x${string}`) => {
  const allowance = await viemClient.readContract({
    address: token.address,
    abi: CONTRACTS.ERC20_ABI,
    functionName: "allowance",
    args: [address, CONTRACTS.VE_TOKEN_ADDRESS],
  });

  return formatUnits(allowance, token.decimals);
};

const increaseVestDuration = async (
  account: Address | undefined,
  options: {
    unlockTime: string;
    tokenID: string;
  }
) => {
  if (!account) {
    console.warn("account not found");
    throw new Error("");
  }

  const walletClient = await getWalletClient({ chainId: canto.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("");
  }

  const { tokenID, unlockTime } = options;

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let vestTXID = getTXUUID();

  await stores.emitter.emit(ACTIONS.TX_ADDED, {
    title: `Increase unlock time on token #${tokenID}`,
    type: "Vest",
    verb: "Vest Increased",
    transactions: [
      {
        uuid: vestTXID,
        description: `Increasing your vest duration`,
        status: "WAITING",
      },
    ],
  });

  const writeIncreaseDuration = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: CONTRACTS.VE_TOKEN_ADDRESS,
      abi: CONTRACTS.VE_TOKEN_ABI,
      functionName: "increase_unlock_time",
      args: [BigInt(tokenID), BigInt(unlockTime)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };

  await writeContractWrapper(vestTXID, writeIncreaseDuration);
};

const resetVest = async (
  account: Address | undefined,
  queryClient: QueryClient,
  options: {
    tokenID: string;
    govToken: GovToken | undefined;
    veToken: VeToken | undefined;
    pairs: Pair[] | undefined;
    serialised_vestNFTs: string;
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

  const { govToken, pairs, serialised_vestNFTs, tokenID, veToken } = options;

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let rewardsTXID = getTXUUID();
  let rebaseTXID = getTXUUID();
  let resetTXID = getTXUUID();

  stores.emitter.emit(ACTIONS.TX_ADDED, {
    title: `Reset veNFT #${tokenID}`,
    type: "Reset",
    verb: "Vest Reseted",
    transactions: [
      {
        uuid: rewardsTXID,
        description: `Checking unclaimed bribes`,
        status: "WAITING",
      },
      {
        uuid: rebaseTXID,
        description: `Checking unclaimed rebase distribution`,
        status: "WAITING",
      },
      {
        uuid: resetTXID,
        description: `Resetting your veNFT`,
        status: "WAITING",
      },
    ],
  });

  // CHECK unclaimed bribes
  const rewards = await queryClient.fetchQuery({
    queryKey: [
      QUERY_KEYS.REWARDS,
      account,
      tokenID,
      govToken,
      veToken,
      serialised_vestNFTs,
      pairs,
    ],
    queryFn: () =>
      getRewardBalances(
        account,
        tokenID,
        govToken,
        veToken,
        serialised_vestNFTs,
        pairs
      ),
  });

  if (rewards && rewards.xxBribes.length > 0) {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: rewardsTXID,
      description: `Unclaimed bribes found, claiming`,
    });
  } else {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: rewardsTXID,
      description: `No unclaimed bribes found`,
      status: "DONE",
    });
  }

  if (rewards && rewards.xxBribes.length > 0) {
    const sendGauges = rewards.xxBribes.map((pair) => {
      return pair.gauge.xx_wrapped_bribe_address;
    });
    const sendTokens = rewards.xxBribes.map((pair) => {
      return pair.gauge.xx_bribesEarned!.map((bribe) => {
        return (bribe as Bribe).token.address;
      });
    });

    await writeClaimBribes(
      walletClient,
      rewardsTXID,
      sendGauges,
      sendTokens,
      tokenID
    );
  }

  if (rewards && rewards.veDist.length > 0) {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: rebaseTXID,
      description: `Claiming rebase distribution`,
    });
  } else {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: rebaseTXID,
      description: `No unclaimed rebase`,
      status: "DONE",
    });
  }

  if (rewards && rewards.veDist.length > 0) {
    const writeClaim = async () => {
      const { request } = await viemClient.simulateContract({
        account,
        address: CONTRACTS.VE_DIST_ADDRESS,
        abi: CONTRACTS.VE_DIST_ABI,
        functionName: "claim",
        args: [BigInt(tokenID)],
      });
      const txHash = await walletClient.writeContract(request);
      return txHash;
    };
    await writeContractWrapper(rebaseTXID, writeClaim);
  }

  const writeReset = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: CONTRACTS.VOTER_ADDRESS,
      abi: CONTRACTS.VOTER_ABI,
      functionName: "reset",
      args: [BigInt(tokenID)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };

  await writeContractWrapper(resetTXID, writeReset);
};

const withdrawVest = async (
  account: Address | undefined,
  options: { tokenID: string; rewards: Rewards | undefined }
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

  const { tokenID, rewards } = options;

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let rewards01TXID = getTXUUID();
  let rewards0TXID = getTXUUID();
  let resetTXID = getTXUUID();
  let vestTXID = getTXUUID();

  stores.emitter.emit(ACTIONS.TX_ADDED, {
    title: `Withdraw vest amount on token #${tokenID}`,
    type: "Vest",
    verb: "Vest Withdrawn",
    transactions: [
      {
        uuid: rewards01TXID,
        description: `Checking unclaimed bribes`,
        status: "WAITING",
      },
      {
        uuid: rewards0TXID,
        description: `Checking unclaimed bribes`,
        status: "WAITING",
      },
      {
        uuid: resetTXID,
        description: `Checking if your has votes`,
        status: "WAITING",
      },
      {
        uuid: vestTXID,
        description: `Withdrawing your expired tokens`,
        status: "WAITING",
      },
    ],
  });

  if (rewards && rewards.xxBribes.length > 0) {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: rewards01TXID,
      description: `Unclaimed bribes found, claiming`,
    });
  } else {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: rewards01TXID,
      description: `No unclaimed bribes found`,
      status: "DONE",
    });
  }
  if (rewards && rewards.xBribes.length > 0) {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: rewards0TXID,
      description: `Unclaimed bribes found, claiming`,
    });
  } else {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: rewards0TXID,
      description: `No unclaimed bribes found`,
      status: "DONE",
    });
  }

  if (rewards && rewards.xxBribes.length > 0) {
    const sendGauges = rewards.xxBribes.map((pair) => {
      return pair.gauge.xx_wrapped_bribe_address;
    });
    const sendTokens = rewards.xxBribes.map((pair) => {
      return pair.gauge.xx_bribesEarned!.map((bribe) => {
        return (bribe as Bribe).token.address;
      });
    });

    await writeClaimBribes(
      walletClient,
      rewards01TXID,
      sendGauges,
      sendTokens,
      tokenID
    );
  }
  if (rewards && rewards.xBribes.length > 0) {
    const sendGauges = rewards.xBribes.map((pair) => {
      return pair.gauge.x_wrapped_bribe_address;
    });
    const sendTokens = rewards.xBribes.map((pair) => {
      return pair.gauge.x_bribesEarned!.map((bribe) => {
        return (bribe as Bribe).token.address;
      });
    });

    await writeClaimBribes(
      walletClient,
      rewards0TXID,
      sendGauges,
      sendTokens,
      tokenID
    );
  }

  // CHECK if veNFT has votes
  const voted = await checkNFTVoted(tokenID);

  if (!!voted) {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: resetTXID,
      description: `NFT has votes, resetting`,
    });
  } else {
    stores.emitter.emit(ACTIONS.TX_STATUS, {
      uuid: resetTXID,
      description: `NFT doesn't have votes`,
      status: "DONE",
    });
  }

  if (!!voted) {
    const writeReset = async () => {
      const { request } = await viemClient.simulateContract({
        account,
        address: CONTRACTS.VOTER_ADDRESS,
        abi: CONTRACTS.VOTER_ABI,
        functionName: "reset",
        args: [BigInt(tokenID)],
      });
      const txHash = await walletClient.writeContract(request);
      return txHash;
    };

    await writeContractWrapper(resetTXID, writeReset);
  }

  const writeWithdrawLock = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: CONTRACTS.VE_TOKEN_ADDRESS,
      abi: CONTRACTS.VE_TOKEN_ABI,
      functionName: "withdraw",
      args: [BigInt(tokenID)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };

  await writeContractWrapper(vestTXID, writeWithdrawLock);
};

const mergeNft = async (
  account: Address | undefined,
  options: {
    from: string;
    to: string;
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

  const { from, to } = options;

  let mergeTXID = getTXUUID();
  await stores.emitter.emit(ACTIONS.TX_ADDED, {
    title: `Merge NFT #${from} into #${to}`,
    verb: "NFT Merged",
    transactions: [
      {
        uuid: mergeTXID,
        description: `Merging NFT #${from} into #${to}`,
        status: "WAITING",
      },
    ],
  });

  const writeMergeLock = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: CONTRACTS.VE_TOKEN_ADDRESS,
      abi: CONTRACTS.VE_TOKEN_ABI,
      functionName: "merge",
      args: [BigInt(from), BigInt(to)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };

  await writeContractWrapper(mergeTXID, writeMergeLock);
};

const checkNFTVoted = async (tokenID: string) => {
  const voted = await viemClient.readContract({
    address: CONTRACTS.VE_TOKEN_ADDRESS,
    abi: CONTRACTS.VE_TOKEN_ABI,
    functionName: "voted",
    args: [BigInt(tokenID)],
  });

  return voted;
};
