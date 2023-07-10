import { useQuery } from "@tanstack/react-query";
import { deserialize, serialize, useAccount } from "wagmi";
import { type Address, formatUnits, parseUnits } from "viem";

import viemClient, {
  chunkArray,
  multicallChunks,
} from "../../../stores/connectors/viem";
import { CONTRACTS, QUERY_KEYS } from "../../../stores/constants/constants";
import {
  hasGauge,
  VeDistReward,
  Gauge,
  GovToken,
  VeToken,
  VestNFT,
  Pair,
} from "../../../stores/types/types";
import {
  useGovToken,
  useVeToken,
  usePairsWithGauges,
  useVestNfts,
  getInitBaseAssets,
} from "../../../lib/global/queries";

export const getRewardBalances = async (
  address: Address | undefined,
  tokenID: string | undefined,
  govToken: GovToken | undefined,
  veToken: VeToken | undefined,
  vestNfts: string,
  pairs: Pair[] | undefined
) => {
  if (!address) {
    console.warn("account not found");
    throw new Error("No address");
  }

  if (!govToken || !veToken) {
    throw new Error("govToken or veToken not found");
  }

  if (!pairs) {
    throw new Error("pairs not found");
  }

  const gauges = pairs.filter(hasGauge);

  if (typeof window.structuredClone === "undefined") {
    throw new Error(
      "Your browser does not support structuredClone. Please use a different browser."
    );
  }

  const x_filteredPairs = structuredClone(gauges);
  const xx_filteredPairs = structuredClone(gauges);
  const filteredPairs2 = structuredClone(gauges);

  let veDistReward: VeDistReward[] = [];
  let x_filteredBribes: Gauge[] = []; // Pair with gauge rewardType set to "XBribe"
  let xx_filteredBribes: Gauge[] = []; // Pair with gauge rewardType set to "XBribe"

  if (tokenID && tokenID !== "0") {
    const x_calls = x_filteredPairs.flatMap((pair) =>
      pair.gauge.x_bribes.map(
        (bribe) =>
          ({
            address: pair.gauge.x_wrapped_bribe_address,
            abi: CONTRACTS.BRIBE_ABI,
            functionName: "earned",
            args: [bribe.token.address, BigInt(tokenID)],
          } as const)
      )
    );
    const x_callsChunks = chunkArray(x_calls, 100);

    const x_earnedBribesAllPairs = await multicallChunks(x_callsChunks);

    const xx_calls = x_filteredPairs.flatMap((pair) =>
      pair.gauge.xx_bribes.map(
        (bribe) =>
          ({
            address: pair.gauge.xx_wrapped_bribe_address,
            abi: CONTRACTS.BRIBE_ABI,
            functionName: "earned",
            args: [bribe.token.address, BigInt(tokenID)],
          } as const)
      )
    );
    const xx_callsChunks = chunkArray(xx_calls, 100);

    const xx_earnedBribesAllPairs = await multicallChunks(xx_callsChunks);

    x_filteredPairs.forEach((pair) => {
      const x_earnedBribesPair = x_earnedBribesAllPairs.splice(
        0,
        pair.gauge.x_bribes.length
      );
      pair.gauge.x_bribesEarned = pair.gauge.x_bribes.map((bribe, i) => {
        return {
          ...bribe,
          earned: formatUnits(
            x_earnedBribesPair[i],
            bribe.token.decimals
          ) as `${number}`,
        };
      });
    });

    xx_filteredPairs.forEach((pair) => {
      const xx_earnedBribesPair = xx_earnedBribesAllPairs.splice(
        0,
        pair.gauge.xx_bribes.length
      );
      pair.gauge.xx_bribesEarned = pair.gauge.xx_bribes.map((bribe, i) => {
        return {
          ...bribe,
          earned: formatUnits(
            xx_earnedBribesPair[i],
            bribe.token.decimals
          ) as `${number}`,
        };
      });
    });

    x_filteredBribes = x_filteredPairs
      .filter((pair) => {
        if (pair.gauge.x_bribesEarned && pair.gauge.x_bribesEarned.length > 0) {
          let shouldReturn = false;

          for (let i = 0; i < pair.gauge.x_bribesEarned.length; i++) {
            if (
              pair.gauge.x_bribesEarned[i].earned &&
              parseUnits(
                pair.gauge.x_bribesEarned[i].earned as `${number}`,
                pair.gauge.x_bribes[i].token.decimals
              ) > 0
            ) {
              shouldReturn = true;
            }
          }

          return shouldReturn;
        }

        return false;
      })
      .map((pair) => {
        pair.rewardType = "XBribe";
        return pair;
      });

    xx_filteredBribes = xx_filteredPairs
      .filter((pair) => {
        if (
          pair.gauge.xx_bribesEarned &&
          pair.gauge.xx_bribesEarned.length > 0
        ) {
          let shouldReturn = false;

          for (let i = 0; i < pair.gauge.xx_bribesEarned.length; i++) {
            if (
              pair.gauge.xx_bribesEarned[i].earned &&
              parseUnits(
                pair.gauge.xx_bribesEarned[i].earned as `${number}`,
                pair.gauge.xx_bribes[i].token.decimals
              ) > 0
            ) {
              shouldReturn = true;
            }
          }

          return shouldReturn;
        }

        return false;
      })
      .map((pair) => {
        pair.rewardType = "XXBribe";
        return pair;
      });

    const veDistEarned = await viemClient.readContract({
      address: CONTRACTS.VE_DIST_ADDRESS,
      abi: CONTRACTS.VE_DIST_ABI,
      functionName: "claimable",
      args: [BigInt(tokenID)],
    });

    const vestNFTs = deserialize(vestNfts) as VestNFT[] | undefined;

    const theNFT = vestNFTs?.filter((vestNFT) => {
      return vestNFT.id === tokenID;
    });

    if (theNFT && veDistEarned > 0) {
      veDistReward.push({
        token: theNFT[0],
        lockToken: veToken,
        rewardToken: govToken,
        earned: formatUnits(veDistEarned, govToken.decimals),
        rewardType: "Distribution",
      });
    }
  }

  const tokens = getInitBaseAssets();

  await Promise.all(
    filteredPairs2.map(async (pair) => {
      const gaugeAddress = pair.gauge.address;
      const rewardNumber = await viemClient.readContract({
        address: gaugeAddress,
        abi: CONTRACTS.GAUGE_ABI,
        functionName: "rewardsListLength",
      });
      const rewardTokens: {
        address: `0x${string}`;
        symbol: string;
        decimals: number;
      }[] = [];
      const arr = [...Array(Number(rewardNumber)).keys()];
      await Promise.all(
        arr.map(async (i) => {
          const rewardToken = await viemClient.readContract({
            address: gaugeAddress,
            abi: CONTRACTS.GAUGE_ABI,
            functionName: "rewards",
            args: [BigInt(i)],
          });
          const baseRewardToken = tokens.find(
            (token) => token.address.toLowerCase() === rewardToken.toLowerCase()
          );
          // we only check symbol in baseRewardTokenCase because we know for sure that govToken is going to be there
          if (baseRewardToken) {
            rewardTokens.push({
              address: baseRewardToken.address,
              symbol: baseRewardToken.symbol,
              decimals: baseRewardToken.decimals,
            });
          } else {
            const [symbol, decimals] = await viemClient.multicall({
              allowFailure: false,
              contracts: [
                {
                  address: rewardToken,
                  abi: CONTRACTS.ERC20_ABI,
                  functionName: "symbol",
                },
                {
                  address: rewardToken,
                  abi: CONTRACTS.ERC20_ABI,
                  functionName: "decimals",
                },
              ],
            });
            rewardTokens.push({
              address: rewardToken,
              symbol: symbol,
              decimals: Number(decimals),
            });
          }
        })
      );
      pair.gauge.rewardTokens = rewardTokens;
    })
  );

  const rewardsCalls = filteredPairs2.flatMap((pair) => {
    if (!pair.gauge.rewardTokens) throw new Error("rewardTokens not found");
    return pair.gauge.rewardTokens.map(
      (rewardToken) =>
        ({
          address: pair.gauge.address,
          abi: CONTRACTS.GAUGE_ABI,
          functionName: "earned",
          args: [rewardToken.address, address],
        } as const)
    );
  });

  const rewardsEarnedCallResult = await viemClient.multicall({
    allowFailure: false,
    multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
    contracts: rewardsCalls,
  });

  filteredPairs2.forEach((pair) => {
    const earnedRewardsPair = rewardsEarnedCallResult.splice(
      0,
      pair.gauge.rewardTokens!.length
    );
    pair.gauge.rewardsEarned = pair.gauge.rewardTokens!.map(
      (rewardToken, i) => {
        return {
          ...rewardToken,
          earned: formatUnits(
            earnedRewardsPair[i],
            rewardToken.decimals
          ) as `${number}`,
        };
      }
    );
  });

  const filteredRewards: Gauge[] = []; // Pair with rewardType set to "Reward" and defined token symbol of reward
  const hashSet = new Set<`0x${string}`>();

  for (let j = 0; j < filteredPairs2.length; j++) {
    let pair = Object.assign({}, filteredPairs2[j]);
    if (pair.gauge && pair.gauge.rewardsEarned) {
      for (const reward of pair.gauge.rewardsEarned) {
        if (parseFloat(reward.earned) > 0) {
          pair.rewardType = "Reward";
          if (!pair.rewardsToClaim) {
            pair.rewardsToClaim = [reward];
          } else {
            pair.rewardsToClaim.push(reward);
          }
          if (!hashSet.has(pair.address)) {
            hashSet.add(pair.address);
            filteredRewards.push(pair);
          }
        }
      }
    }
  }

  const rewards: {
    xBribes: Gauge[];
    xxBribes: Gauge[];
    rewards: Gauge[];
    veDist: VeDistReward[];
  } = {
    xBribes: x_filteredBribes,
    xxBribes: xx_filteredBribes,
    rewards: filteredRewards,
    veDist: veDistReward,
  };

  return rewards;
};

export const useRewards = <
  TData = {
    xBribes: Gauge[];
    xxBribes: Gauge[];
    rewards: Gauge[];
    veDist: VeDistReward[];
  }
>(
  tokenID: string | undefined,
  select?: (_data: {
    xBribes: Gauge[];
    xxBribes: Gauge[];
    rewards: Gauge[];
    veDist: VeDistReward[];
  }) => TData
) => {
  const { address } = useAccount();
  const { data: veToken } = useVeToken();
  const { data: govToken } = useGovToken();
  const { data: vestNFTs } = useVestNfts();
  const { data: pairs } = usePairsWithGauges();
  const serialised_vestNFTs = serialize(vestNFTs);
  return useQuery({
    queryKey: [
      QUERY_KEYS.REWARDS,
      address,
      tokenID,
      govToken,
      veToken,
      serialised_vestNFTs,
      pairs,
    ],
    queryFn: () =>
      getRewardBalances(
        address,
        tokenID,
        govToken,
        veToken,
        serialised_vestNFTs,
        pairs
      ),
    enabled: !!address && !!govToken && !!veToken && !!pairs && !!vestNFTs,
    select,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    keepPreviousData: true,
  });
};
