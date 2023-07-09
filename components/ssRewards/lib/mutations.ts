import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { getWalletClient } from "@wagmi/core";
import { fantom } from "wagmi/chains";
import { Address, type WalletClient } from "viem";

import viemClient from "../../../stores/connectors/viem";
import { CONTRACTS, QUERY_KEYS } from "../../../stores/constants/constants";
import {
  Bribe,
  Gauge,
  ITransaction,
  TransactionStatus,
  VeDistReward,
} from "../../../stores/types/types";
import { writeContractWrapper } from "../../../lib/global/mutations";
import { getTXUUID } from "../../../utils/utils";
import { useTransactionStore } from "../../transactionQueue/transactionQueue";

export function useClaimBribes(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: Parameters<typeof claimBribes>[1]) =>
      claimBribes(address, options),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.REWARDS]);
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
      onSuccess?.();
    },
  });
}

export function useClaimReward(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: Parameters<typeof claimRewards>[1]) =>
      claimRewards(address, options),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.REWARDS]);
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
      onSuccess?.();
    },
  });
}

export function useClaimVeDist(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: Parameters<typeof claimVeDist>[1]) =>
      claimVeDist(address, options),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.REWARDS]);
      onSuccess?.();
    },
  });
}

export function useClaimAllRewards(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  return useMutation({
    mutationFn: (options: Parameters<typeof claimAllRewards>[1]) =>
      claimAllRewards(address, options),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.REWARDS]);
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
      onSuccess?.();
    },
  });
}

export const writeClaimBribes = async (
  walletClient: WalletClient,
  txId: string,
  sendGauges: `0x${string}`[],
  sendTokens: `0x${string}`[][],
  tokenID: string
) => {
  const [account] = await walletClient.getAddresses();
  const write = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: CONTRACTS.VOTER_ADDRESS,
      abi: CONTRACTS.VOTER_ABI,
      functionName: "claimBribes",
      args: [sendGauges, sendTokens, BigInt(tokenID)],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };
  await writeContractWrapper(txId, write);
};

const claimBribes = async (
  account: Address | undefined,
  options: {
    pair: Gauge;
    tokenID: string;
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

  const { pair, tokenID } = options;

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let claimTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: claimTXID,
        description: `Claiming your bribes`,
        status: TransactionStatus.WAITING,
      },
    ],
  });

  let targetBribeContractAddress = pair.gauge.bribeAddress;
  let targetSendTokens = pair.gauge.bribesEarned;

  // SUBMIT CLAIM TRANSACTION
  const sendGauges = [targetBribeContractAddress];
  const sendTokens = [
    targetSendTokens!.map((bribe) => {
      return (bribe as Bribe).token.address;
    }),
  ];
  await writeClaimBribes(
    walletClient,
    claimTXID,
    sendGauges,
    sendTokens,
    tokenID
  );
};

const claimRewards = async (
  account: Address | undefined,
  options: { pair: Gauge }
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

  const { pair } = options;

  let claimTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: claimTXID,
        description: `Claiming your rewards`,
        status: TransactionStatus.WAITING,
      },
    ],
  });

  const targetRewards = pair.rewardsToClaim?.map((reward) => reward.address);

  if (!targetRewards) throw new Error("No rewards to claim");

  const writeGetReward = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: pair.gauge?.address,
      abi: CONTRACTS.GAUGE_ABI,
      functionName: "getReward",
      args: [account, targetRewards],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };
  await writeContractWrapper(claimTXID, writeGetReward);
};

const claimVeDist = async (account: Address | undefined, tokenID: string) => {
  if (!account) {
    console.warn("account not found");
    throw new Error("account not found");
  }

  const walletClient = await getWalletClient({ chainId: fantom.id });
  if (!walletClient) {
    console.warn("wallet");
    throw new Error("wallet not found");
  }

  // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
  let claimTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: claimTXID,
        description: `Claiming your distribution`,
        status: TransactionStatus.WAITING,
      },
    ],
  });

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

  await writeContractWrapper(claimTXID, writeClaim);
};

const claimAllRewards = async (
  account: Address | undefined,
  options: {
    rewards: (Gauge | VeDistReward)[] | undefined;
    tokenID: string;
  }
) => {
  if (!account) {
    throw new Error("account not found");
  }

  const walletClient = await getWalletClient({ chainId: fantom.id });
  if (!walletClient) {
    throw new Error("wallet not found");
  }

  const { rewards, tokenID } = options;

  if (!rewards) {
    throw new Error("rewards not found");
  }

  let claimTXID = getTXUUID();
  let rewardClaimTXIDs: string[] = [];
  let distributionClaimTXIDs: string[] = [];

  let bribePairs = (rewards as Gauge[]).filter((pair) => {
    return pair.rewardType === "Bribe";
  });

  let rewardPairs = (rewards as Gauge[]).filter((pair) => {
    return pair.rewardType === "Reward";
  });

  let distribution = (rewards as VeDistReward[]).filter((pair) => {
    return pair.rewardType === "Distribution";
  });

  const sendGauges = bribePairs.map((pair) => {
    return pair.gauge.bribeAddress;
  });
  const sendTokens = bribePairs.map((pair) => {
    return pair.gauge.bribesEarned!.map((bribe) => {
      return (bribe as Bribe).token.address;
    });
  });

  if (bribePairs.length == 0 && rewardPairs.length == 0) {
    throw new Error("Nothing to claim");
  }

  let sendOBJ: {
    title: string;
    verb: string;
    transactions: ITransaction["transactions"];
  } = {
    title: `Claim all rewards`,
    verb: "Rewards Claimed",
    transactions: [],
  };

  if (bribePairs.length > 0) {
    sendOBJ.transactions.push({
      uuid: claimTXID,
      description: `Claiming all your available bribes`,
      status: TransactionStatus.WAITING,
    });
  }

  if (rewardPairs.length > 0) {
    for (let i = 0; i < rewardPairs.length; i++) {
      const newClaimTX = getTXUUID();

      rewardClaimTXIDs.push(newClaimTX);
      sendOBJ.transactions.push({
        uuid: newClaimTX,
        description: `Claiming reward for ${rewardPairs[i].symbol}`,
        status: TransactionStatus.WAITING,
      });
    }
  }

  if (distribution.length > 0) {
    for (let i = 0; i < distribution.length; i++) {
      const newClaimTX = getTXUUID();

      distributionClaimTXIDs.push(newClaimTX);
      sendOBJ.transactions.push({
        uuid: newClaimTX,
        description: `Claiming distribution for NFT #${distribution[i].token.id}`,
        status: TransactionStatus.WAITING,
      });
    }
  }

  useTransactionStore.getState().updateTransactionQueue({
    transactions: sendOBJ.transactions,
  });

  if (bribePairs.length > 0) {
    await writeClaimBribes(
      walletClient,
      claimTXID,
      sendGauges,
      sendTokens,
      tokenID
    );
  }

  if (rewardPairs.length > 0) {
    for (let i = 0; i < rewardPairs.length; i++) {
      const targetRewards = rewardPairs[i].rewardsToClaim?.map(
        (r) => r.address
      );
      if (!targetRewards) {
        throw new Error("Target rewards not found");
      }
      const writeGetReward = async () => {
        const { request } = await viemClient.simulateContract({
          account,
          address: rewardPairs[i].gauge.address,
          abi: CONTRACTS.GAUGE_ABI,
          functionName: "getReward",
          args: [account, targetRewards],
        });
        const txHash = await walletClient.writeContract(request);
        return txHash;
      };
      await writeContractWrapper(rewardClaimTXIDs[i], writeGetReward);
    }
  }

  if (distribution.length > 0) {
    for (let i = 0; i < distribution.length; i++) {
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
      await writeContractWrapper(distributionClaimTXIDs[i], writeClaim);
    }
  }
};
