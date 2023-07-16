import { useMemo } from "react";
import { type Address, useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import BigNumber from "bignumber.js";

import viemClient from "../../../stores/connectors/viem";
import { Pair, Vote, Votes, hasGauge } from "../../../stores/types/types";
import { usePairs } from "../../../lib/global/queries";
import { CONTRACTS, QUERY_KEYS } from "../../../stores/constants/constants";
import { useDisplayedPairs } from "../../liquidityPairs/queries";

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
  return useQuery({
    queryKey: [QUERY_KEYS.VEST_VOTES, address, tokenID, pairs],
    queryFn: () => getVestVotes(address, tokenID, pairs),
    enabled: !!address && !!tokenID && !!pairs,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    select: (votes) => {
      const votesValues: Votes | undefined = votes?.map((vote) => {
        return {
          address: vote?.address,
          value: BigNumber(
            vote && vote.votePercent ? vote.votePercent : 0
          ).toNumber(),
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

  const filteredPairs = pairs.filter((pair) => {
    return pair && pair.gauge && pair.gauge.address;
  });

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

  let votes: Vote[] = [];

  const totalVotes = voteCounts.reduce((curr, acc) => {
    let num = acc > 0 ? acc : acc * BigInt(-1);
    return curr + num;
  }, BigInt(0));

  for (let i = 0; i < voteCounts.length; i++) {
    votes.push({
      address: filteredPairs[i].address,
      votePercent:
        totalVotes > 0 || totalVotes < 0
          ? parseFloat(
              ((voteCounts[i] * BigInt(100)) / totalVotes).toString()
            ).toFixed(0)
          : "0",
    });
  }

  return votes;
};

const getPairsWithGaugesAndVotes = (
  pairsWithGauges: Pair[] | undefined,
  votes: Votes | undefined
) => {
  const gauges = pairsWithGauges?.filter(hasGauge).filter((gauge) => {
    let sliderValue =
      votes?.find((el) => el.address === gauge.address)?.value ?? 0;
    if (gauge.isAliveGauge === false && sliderValue === 0) {
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
