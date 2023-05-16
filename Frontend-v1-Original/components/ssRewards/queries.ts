import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  type Address,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from "viem";

import viemClient, {
  chunkArray,
  multicallChunks,
} from "../../stores/connectors/viem";
import stores from "../../stores";
import {
  CONTRACTS,
  ACTIONS,
  QUERY_KEYS,
} from "../../stores/constants/constants";
import { hasGauge, VeDistReward, Gauge } from "../../stores/types/types";

const getVeTokenBase = () => {
  return {
    address: CONTRACTS.VE_TOKEN_ADDRESS,
    name: CONTRACTS.VE_TOKEN_NAME,
    symbol: CONTRACTS.VE_TOKEN_SYMBOL,
    decimals: CONTRACTS.VE_TOKEN_DECIMALS,
    logoURI: CONTRACTS.VE_TOKEN_LOGO,
  };
};

const getGovTokenBase = () => {
  return {
    address: CONTRACTS.GOV_TOKEN_ADDRESS,
    name: CONTRACTS.GOV_TOKEN_NAME,
    symbol: CONTRACTS.GOV_TOKEN_SYMBOL,
    decimals: CONTRACTS.GOV_TOKEN_DECIMALS,
    logoURI: CONTRACTS.GOV_TOKEN_LOGO,
    balance: "0",
    balanceOf: "0",
  };
};

const getGovTokenInfo = async (address: `0x${string}`) => {
  const govToken = getGovTokenBase();

  const balanceOf = await viemClient.readContract({
    abi: CONTRACTS.GOV_TOKEN_ABI,
    address: CONTRACTS.GOV_TOKEN_ADDRESS,
    functionName: "balanceOf",
    args: [address],
  });

  govToken.balanceOf = balanceOf.toString();
  govToken.balance = formatUnits(balanceOf, govToken.decimals);

  return govToken;
};

export const getRewardBalances = async (
  address: Address | undefined,
  tokenID: string
) => {
  if (!address) {
    console.warn("account not found");
    throw new Error("No address");
  }

  const pairs = stores.stableSwapStore.getStore("pairs");
  let veToken = stores.stableSwapStore.getStore("veToken");
  let govToken = stores.stableSwapStore.getStore("govToken");
  if (!govToken) {
    // FIXME
    // @ts-expect-error
    govToken = await getGovTokenInfo(address);
  }
  if (!veToken) {
    // FIXME
    // @ts-expect-error
    veToken = getVeTokenBase();
  }

  if (!govToken || !veToken) {
    throw new Error("govToken or veToken not found");
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

    const vestNFTs = stores.stableSwapStore.getStore("vestNFTs");
    let theNFT = vestNFTs.filter((vestNFT) => {
      return vestNFT.id === tokenID;
    });

    if (veDistEarned > 0) {
      veDistReward.push({
        token: theNFT[0],
        lockToken: veToken,
        rewardToken: govToken,
        earned: formatUnits(veDistEarned, govToken.decimals),
        rewardType: "Distribution",
      });
    }
  }

  const rewardsCalls = filteredPairs2.map((pair) => {
    return {
      address: pair.gauge.address,
      abi: CONTRACTS.GAUGE_ABI,
      functionName: "earned",
      args: [CONTRACTS.GOV_TOKEN_ADDRESS, address],
    } as const;
  });

  const rewardsEarnedCallResult = await viemClient.multicall({
    allowFailure: false,
    multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
    contracts: rewardsCalls,
  });

  const rewardsEarned = [...filteredPairs2];

  for (let i = 0; i < rewardsEarned.length; i++) {
    rewardsEarned[i].gauge.rewardsEarned = formatEther(
      rewardsEarnedCallResult[i]
    );
  }

  const filteredRewards: Gauge[] = []; // Pair with rewardType set to "Reward"
  for (let j = 0; j < rewardsEarned.length; j++) {
    let pair = Object.assign({}, rewardsEarned[j]);
    if (
      pair.gauge &&
      pair.gauge.rewardsEarned &&
      parseEther(pair.gauge.rewardsEarned as `${number}`) > 0
    ) {
      pair.rewardType = "Reward";
      filteredRewards.push(pair);
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

export const useRewards = (
  tokenID: string,
  onSuccess:
    | ((
        _data:
          | {
              xBribes: Gauge[];
              xxBribes: Gauge[];
              rewards: Gauge[];
              veDist: VeDistReward[];
            }
          | undefined
      ) => void)
    | undefined
) => {
  const { address } = useAccount();
  return useQuery({
    queryKey: [QUERY_KEYS.REWARDS, address, tokenID],
    queryFn: () => getRewardBalances(address, tokenID),
    enabled: !!address,
    onSuccess,
    refetchOnWindowFocus: false,
    onError: (e) => {
      stores.emitter.emit(ACTIONS.ERROR, e);
    },
  });
};
