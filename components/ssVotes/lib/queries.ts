import { useMemo } from "react";
import { type Address, useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";

import viemClient from "../../../stores/connectors/viem";
import { Pair, Vote, Votes, hasGauge } from "../../../stores/types/types";
import { usePairs } from "../../../lib/global/queries";
import { CONTRACTS, QUERY_KEYS } from "../../../stores/constants/constants";
import { useDisplayedPairs } from "../../liquidityPairs/queries";

import { useIsVoting } from "./useIsVoting";

interface VotesStore {
  votes: Votes | undefined;
  setVotes: (_votes: Votes | undefined) => void;
}

export const useVotes = create<VotesStore>((set) => ({
  votes: undefined,
  setVotes: (votes) => set({ votes }),
}));

export const useVestVotes = (tokenID: string | undefined) => {
  const { address } = useAccount();
  const { data: pairs } = usePairs();
  const isVoting = useIsVoting((state) => state.isVoting);
  return useQuery({
    queryKey: [QUERY_KEYS.VEST_VOTES, address, tokenID, pairs],
    queryFn: () => getVestVotes(address, tokenID, pairs),
    enabled: !!address && !!tokenID && !!pairs && isVoting === false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    select: (votes) => {
      const votesValues: Votes | undefined = votes?.map((vote) => {
        return {
          address: vote?.address,
          gaugeAddress: vote?.gaugeAddress,
          value: vote && vote.votePercent ? +vote.votePercent : 0,
        };
      });
      return votesValues;
    },
    onSuccess: (votes) => useVotes.getState().setVotes(votes),
  });
};

const getVestVotes = async (
  account: Address | undefined,
  tokenID: string | undefined,
  pairs: Pair[] | undefined
) => {
  if (!account) {
    console.warn("account not found");
    throw new Error("not found in vest votes");
  }

  if (!pairs) {
    throw new Error("not found in vest votes");
  }

  if (!tokenID) {
    throw new Error("no token id");
  }

  const filteredPairs = pairs.filter(hasGauge);

  const gaugesContract = {
    abi: CONTRACTS.VOTER_ABI,
    address: CONTRACTS.VOTER_ADDRESS,
  } as const;

  const calls = filteredPairs.map((pair) => {
    return {
      ...gaugesContract,
      functionName: "votes",
      args: [BigInt(tokenID), pair.address],
    } as const;
  });

  const voteCounts = await viemClient.multicall({
    allowFailure: false,
    contracts: calls,
  });

  let formattedVoteCounts = voteCounts.map((voteCount) => {
    return Number(voteCount);
  });
  let votes: Vote[] = [];

  const totalVotes = formattedVoteCounts.reduce((curr, acc) => {
    return curr + acc;
  }, 0);

  for (let i = 0; i < formattedVoteCounts.length; i++) {
    votes.push({
      address: filteredPairs[i].address,
      gaugeAddress: filteredPairs[i].gauge.address,
      votePercent:
        totalVotes > 0
          ? ((formattedVoteCounts[i] * 100) / totalVotes).toFixed(0)
          : "0",
    });
  }

  return votes;
};

const getPairsWithGaugesAndVotes = (
  pairsWithGauges: Pair[] | undefined,
  votes: Votes | undefined
) => {
  const gauges = pairsWithGauges?.filter(hasGauge).filter((pairWithGauge) => {
    let sliderValue =
      votes?.find(
        (el) =>
          el.address === pairWithGauge.address &&
          el.gaugeAddress === pairWithGauge.gauge.address
      )?.value ?? 0;
    if (pairWithGauge.isAliveGauge === false && sliderValue === 0) {
      return false;
    }
    return true;
  });
  return gauges;
};

export const useGaugesWithGaugesAndVotes = (votes: Votes | undefined) => {
  const { data: pairs } = useDisplayedPairs();
  return useMemo(() => {
    return getPairsWithGaugesAndVotes(pairs, votes);
  }, [pairs, votes]);
};
