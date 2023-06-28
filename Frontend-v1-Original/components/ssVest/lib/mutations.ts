import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { serialize, useAccount } from "wagmi";
import { getWalletClient } from "@wagmi/core";
import { Address, formatUnits } from "viem";
import { fantom } from "viem/chains";
import dayjs from "dayjs";
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
  TransactionStatus,
  VeToken,
} from "../../../stores/types/types";
import { CONTRACTS, QUERY_KEYS } from "../../../stores/constants/constants";
import {
  useGovToken,
  usePairs,
  useVeToken,
  useVestNfts,
} from "../../../lib/global/queries";
import { writeClaimBribes } from "../../ssRewards/lib/mutations";
import { getRewardBalances, useRewards } from "../../ssRewards/lib/queries";
import { useTransactionStore } from "../../transactionQueue/transactionQueue";

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

export function useTransferVest(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: Parameters<typeof transferNft>[1]) =>
      transferNft(address, options),
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

  const walletClient = await getWalletClient({ chainId: fantom.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("wallet not found");
  }

  const { amount, unlockTime, govToken } = options;
  if (!govToken) throw new Error("No gov token");

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let allowanceTXID = getTXUUID();
  let vestTXID = getTXUUID();

  const unlockString = dayjs().add(+unlockTime, "seconds").format("YYYY-MM-DD");

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: allowanceTXID,
        description: `Checking your ${govToken.symbol} allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: vestTXID,
        description: `Vesting ${govToken.symbol} until ${unlockString} `,
        status: TransactionStatus.WAITING,
      },
    ],
  });

  // CHECK ALLOWANCES AND SET TX DISPLAY
  const allowance = await getVestAllowance(govToken, account);
  if (BigNumber(allowance).lt(amount)) {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowanceTXID,
      description: `Allow the vesting contract to use your ${govToken.symbol}`,
      status: TransactionStatus.WAITING,
    });
  } else {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowanceTXID,
      description: `Allowance on ${govToken.symbol} sufficient`,
      status: TransactionStatus.DONE,
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

  const walletClient = await getWalletClient({ chainId: fantom.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("");
  }

  const { amount, tokenID, govToken } = options;
  if (!govToken) throw new Error("Error getting gov token in increase vest");

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let allowanceTXID = getTXUUID();
  let vestTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: allowanceTXID,
        description: `Checking your ${govToken.symbol} allowance`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: vestTXID,
        description: `Increasing your vest amount on token #${tokenID}`,
        status: TransactionStatus.WAITING,
      },
    ],
  });

  // CHECK ALLOWANCES AND SET TX DISPLAY
  const allowance = await getVestAllowance(govToken, account);
  if (!allowance) throw new Error("Error getting allowance in increase vest");
  if (BigNumber(allowance).lt(amount)) {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowanceTXID,
      description: `Allow the vesting contract to use your ${govToken.symbol}`,
      status: TransactionStatus.WAITING,
    });
  } else {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: allowanceTXID,
      description: `Allowance on ${govToken.symbol} sufficient`,
      status: TransactionStatus.DONE,
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

  const walletClient = await getWalletClient({ chainId: fantom.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("");
  }

  const { tokenID, unlockTime } = options;

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let vestTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: vestTXID,
        description: `Increasing vest duration on token #${tokenID}`,
        status: TransactionStatus.WAITING,
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
  const walletClient = await getWalletClient({ chainId: fantom.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("wallet not found");
  }

  const { govToken, pairs, serialised_vestNFTs, tokenID, veToken } = options;

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let rewardsTXID = getTXUUID();
  let rebaseTXID = getTXUUID();
  let resetTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: rewardsTXID,
        description: `Checking unclaimed bribes`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: rebaseTXID,
        description: `Checking unclaimed rebase distribution`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: resetTXID,
        description: `Resetting your veNFT #${tokenID}`,
        status: TransactionStatus.WAITING,
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

  if (rewards && rewards.bribes.length > 0) {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: rewardsTXID,
      description: `Unclaimed bribes found, claiming`,
      status: TransactionStatus.WAITING,
    });
  } else {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: rewardsTXID,
      description: `No unclaimed bribes found`,
      status: TransactionStatus.DONE,
    });
  }

  if (rewards && rewards.bribes.length > 0) {
    const sendGauges = rewards.bribes.map((pair) => {
      return pair.gauge.bribeAddress;
    });
    const sendTokens = rewards.bribes.map((pair) => {
      return pair.gauge.bribesEarned!.map((bribe) => {
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
    useTransactionStore.getState().updateTransactionStatus({
      uuid: rebaseTXID,
      description: `Unclaimed rebase distribution found, claiming`,
      status: TransactionStatus.WAITING,
    });
  } else {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: rebaseTXID,
      description: `No unclaimed rebase distribution found`,
      status: TransactionStatus.DONE,
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
  const walletClient = await getWalletClient({ chainId: fantom.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("wallet not found");
  }

  const { tokenID, rewards } = options;

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let rewardsTXID = getTXUUID();
  let resetTXID = getTXUUID();
  let vestTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: rewardsTXID,
        description: `Checking unclaimed bribes`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: resetTXID,
        description: `Checking if your has votes`,
        status: TransactionStatus.WAITING,
      },
      {
        uuid: vestTXID,
        description: `Withdrawing your expired tokens`,
        status: TransactionStatus.WAITING,
      },
    ],
  });

  if (rewards && rewards.bribes.length > 0) {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: rewardsTXID,
      description: `Unclaimed bribes found, claiming`,
      status: TransactionStatus.WAITING,
    });
  } else {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: rewardsTXID,
      description: `No unclaimed bribes found`,
      status: TransactionStatus.DONE,
    });
  }

  if (rewards && rewards.bribes.length > 0) {
    const sendGauges = rewards.bribes.map((pair) => {
      return pair.gauge.bribeAddress;
    });
    const sendTokens = rewards.bribes.map((pair) => {
      return pair.gauge.bribesEarned!.map((bribe) => {
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

  // CHECK if veNFT has votes
  const voted = await checkNFTVoted(tokenID);

  if (!!voted) {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: resetTXID,
      description: `NFT has votes, resetting`,
      status: TransactionStatus.WAITING,
    });
  } else {
    useTransactionStore.getState().updateTransactionStatus({
      uuid: resetTXID,
      description: `NFT doesn't have votes`,
      status: TransactionStatus.DONE,
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
const transferNft = async (
  account: Address | undefined,
  options: {
    nftId: string;
    to: `0x${string}`;
  }
) => {
  if (!account) {
    console.warn("account not found");
    throw new Error("account not found");
  }
  const walletClient = await getWalletClient({ chainId: fantom.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("wallet not found");
  }

  const { nftId, to } = options;

  let transferTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: transferTXID,
        description: `Transferring NFT #${nftId} to ${to}`,
        status: TransactionStatus.WAITING,
      },
    ],
  });

  const writeTransfer = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: CONTRACTS.VE_TOKEN_ADDRESS,
      abi: CONTRACTS.VE_TOKEN_ABI,
      functionName: "safeTransferFrom",
      args: [account, to, BigInt(nftId)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };

  await writeContractWrapper(transferTXID, writeTransfer);
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
  const walletClient = await getWalletClient({ chainId: fantom.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("wallet not found");
  }

  const { from, to } = options;

  let mergeTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: mergeTXID,
        description: `Merging NFT #${from} into #${to}`,
        status: TransactionStatus.WAITING,
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
