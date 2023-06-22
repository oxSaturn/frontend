import { useQuery } from "@tanstack/react-query";
import { Address, erc20ABI, useAccount } from "wagmi";
import { formatUnits } from "viem";

import viemClient from "../../../stores/connectors/viem";

import { useMaxxingGaugeRewardsListLength } from "../../../lib/wagmiGen";
import { PRO_OPTIONS } from "../../../stores/constants/constants";
import { aggMaxxingABI } from "../../../stores/abis/aggMaxxingABI";

const QUERY_KEYS = {
  TOKEN_ADDRESSES: "TOKEN_ADDRESSES",
  EARNED: "EARNED",
};

interface Token {
  address: Address;
  symbol: string;
  decimals: number;
}

interface Earned {
  address: Address;
  earnedAmount: string;
  symbol: string;
}

export function useGaugeRewards() {
  const { address } = useAccount();
  const { data: rewardsListLength } = useMaxxingGaugeRewardsListLength({
    select: (data) => Number(data),
  });
  const { data: rewardsTokens } = useQuery({
    queryKey: [QUERY_KEYS.TOKEN_ADDRESSES, rewardsListLength],
    queryFn: () => getGaugeRewardsTokenAddresses(rewardsListLength),
    enabled: !!rewardsListLength,
  });
  return useQuery({
    queryKey: [QUERY_KEYS.EARNED, rewardsTokens, address],
    queryFn: () => getEarned(address, rewardsTokens),
    enabled: !!rewardsTokens && !!address,
    select: filterEarned,
  });
}

async function getGaugeRewardsTokenAddresses(
  rewardsListLength: number | undefined
) {
  if (!rewardsListLength) {
    throw new Error("rewardsListLength is undefined or zero");
  }

  const gaugeContract = {
    address: PRO_OPTIONS.oAGG.gaugeAddress,
    abi: aggMaxxingABI,
  } as const;

  const rewardsTokenAddresses: Token[] = [];

  for (let i = 0; i < rewardsListLength; i++) {
    const rewardTokenAddress = await viemClient.readContract({
      ...gaugeContract,
      functionName: "rewards",
      args: [BigInt(i)],
    });
    const symbol = await viemClient.readContract({
      address: rewardTokenAddress,
      abi: erc20ABI,
      functionName: "symbol",
    });
    const decimals = await viemClient.readContract({
      address: rewardTokenAddress,
      abi: erc20ABI,
      functionName: "decimals",
    });
    rewardsTokenAddresses.push({
      address: rewardTokenAddress,
      symbol,
      decimals,
    });
  }

  return rewardsTokenAddresses;
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
    address: PRO_OPTIONS.oAGG.gaugeAddress,
    abi: aggMaxxingABI,
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
