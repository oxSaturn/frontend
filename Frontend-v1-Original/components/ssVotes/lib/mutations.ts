import { useMutation } from "@tanstack/react-query";
import { Address, useAccount } from "wagmi";
import { getWalletClient } from "@wagmi/core";
import { canto } from "wagmi/chains";
import BigNumber from "bignumber.js";

import viemClient from "../../../stores/connectors/viem";
import { Pair, TransactionStatus, Votes } from "../../../stores/types/types";
import { CONTRACTS } from "../../../stores/constants/constants";
import { writeContractWrapper } from "../../../lib/global/mutations";
import { getTXUUID } from "../../../utils/utils";
import { usePairs, useVestNfts } from "../../../lib/global/queries";
import { useTransactionStore } from "../../transactionQueue/transactionQueue";

export function useVote() {
  const { address } = useAccount();
  const { data: pairs } = usePairs();
  const { refetch: refetchVestNfts } = useVestNfts();
  return useMutation({
    mutationFn: (options: { votes: Votes | undefined; tokenID: string }) =>
      vote(address, { ...options, pairs }),
    onSuccess: () => refetchVestNfts(),
  });
}

const vote = async (
  account: Address | undefined,
  options: {
    votes: Votes | undefined;
    pairs: Pair[] | undefined;
    tokenID: string;
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

  const { tokenID, votes, pairs } = options;

  if (!pairs) {
    console.warn("pairs not found");
    throw new Error("pairs not found");
  }
  if (!votes) {
    console.warn("votes not found");
    throw new Error("votes not found");
  }

  const voteTXID = getTXUUID();

  useTransactionStore.getState().updateTransactionQueue({
    transactions: [
      {
        uuid: voteTXID,
        description: `Cast votes using token #${tokenID}`,
        status: TransactionStatus.WAITING,
      },
    ],
  });

  const deadGauges: string[] = [];

  const onlyVotes = votes.filter((vote) => {
    return BigNumber(vote.value).gt(0) || BigNumber(vote.value).lt(0);
  });

  const votesAddresses = onlyVotes.map((vote) => vote.address);
  const p = pairs?.filter((pair) => {
    return votesAddresses.includes(pair.address);
  });
  p?.forEach((pair) => {
    if (pair.isAliveGauge === false) {
      deadGauges.push(pair.symbol);
    }
  });

  if (deadGauges.length > 0) {
    const error_message = `Gauges ${deadGauges.join(
      ", "
    )} are dead and cannot be voted on`;
    useTransactionStore.getState().updateTransactionStatus({
      uuid: voteTXID,
      description: error_message,
      status: TransactionStatus.REJECTED,
    });
    throw new Error(error_message);
  }

  const tokens = onlyVotes.map((vote) => {
    return vote.address;
  });

  const voteCounts = onlyVotes.map((vote) => {
    return BigInt(BigNumber(vote.value).times(100).toFixed(0));
  });

  const writeVote = async () => {
    const { request } = await viemClient.simulateContract({
      account,
      address: CONTRACTS.VOTER_ADDRESS,
      abi: CONTRACTS.VOTER_ABI,
      functionName: "vote",
      args: [BigInt(tokenID), tokens, voteCounts],
    });
    const txHash = await walletClient.writeContract(request);
    return txHash;
  };

  await writeContractWrapper(voteTXID, writeVote);
};
