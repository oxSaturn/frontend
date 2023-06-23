import { useQuery } from "@tanstack/react-query";
import { Address, erc20ABI, useAccount } from "wagmi";
import { formatUnits } from "viem";

import viemClient from "../../../stores/connectors/viem";

import { useMaxxingGaugeRewardsListLength } from "../../../lib/wagmiGen";
import { PRO_OPTIONS } from "../../../stores/constants/constants";

const QUERY_KEYS = {
  TOKEN_ADDRESSES: "TOKEN_ADDRESSES",
  EARNED: "EARNED",
};

export interface Token {
  address: Address;
  symbol: string;
  decimals: number;
  reward: number;
}

interface Earned {
  address: Address;
  earnedAmount: string;
  symbol: string;
}

export function useGaugeRewards() {
  const { address } = useAccount();
  const { data: rewardTokens } = useGaugeRewardTokens();
  return useQuery({
    queryKey: [QUERY_KEYS.EARNED, rewardTokens, address],
    queryFn: () => getEarned(address, rewardTokens),
    enabled: !!rewardTokens && !!address,
    select: filterEarned,
    keepPreviousData: true,
  });
}

export function useGaugeRewardTokens() {
  const { data: rewardsListLength } = useMaxxingGaugeRewardsListLength({
    select: (data) => Number(data),
  });
  return useQuery({
    queryKey: [QUERY_KEYS.TOKEN_ADDRESSES, rewardsListLength],
    queryFn: () => getGaugeRewardTokens(rewardsListLength),
    enabled: !!rewardsListLength,
  });
}

async function getGaugeRewardTokens(rewardsListLength: number | undefined) {
  if (!rewardsListLength) {
    throw new Error("rewardsListLength is undefined or zero");
  }

  const gaugeContract = {
    address: PRO_OPTIONS.oFLOW.gaugeAddress,
    abi: PRO_OPTIONS.maxxingGaugeABI,
  } as const;

  const rewardsTokens: Token[] = [];

  for (let i = 0; i < rewardsListLength; i++) {
    const rewardTokenAddress = await viemClient.readContract({
      ...gaugeContract,
      functionName: "rewards",
      args: [BigInt(i)],
    });

    const rewardTokenContract = {
      address: rewardTokenAddress,
      abi: erc20ABI,
    } as const;

    const [symbol, decimals, rewardRate, left] = await viemClient.multicall({
      allowFailure: false,
      contracts: [
        {
          ...rewardTokenContract,
          functionName: "symbol",
        },
        {
          ...rewardTokenContract,
          functionName: "decimals",
        },
        {
          ...gaugeContract,
          functionName: "rewardRate",
          args: [rewardTokenAddress],
        },
        {
          ...gaugeContract,
          functionName: "left",
          args: [rewardTokenAddress],
        },
      ],
    });
    rewardsTokens.push({
      address: rewardTokenAddress,
      symbol,
      decimals,
      reward:
        left === 0n ? 0 : +formatUnits(rewardRate, decimals) * 24 * 60 * 60,
    });
  }

  return rewardsTokens;
}

async function getEarned(
  account: Address | undefined,
  rewardsTokens: Token[] | undefined
) {
  if (!account) {
    throw new Error("account is undefined");
  }
  if (!rewardsTokens) {
    throw new Error("tokenAddresses is undefined");
  }

  const gaugeContract = {
    address: PRO_OPTIONS.oFLOW.gaugeAddress,
    abi: PRO_OPTIONS.maxxingGaugeABI,
  } as const;

  const earned: Earned[] = [];

  for (const token of rewardsTokens) {
    const { address, symbol, decimals } = token;

    const earnedAmount = await viemClient.readContract({
      ...gaugeContract,
      functionName: "earned",
      args: [address, account],
    });
    earned.push({
      address,
      earnedAmount: formatUnits(earnedAmount, decimals),
      symbol,
    });
  }

  return earned;
}

function filterEarned(earned: Earned[]) {
  return earned.filter(({ earnedAmount }) => {
    return Number(earnedAmount) > 0;
  });
}
