import { useQuery } from "@tanstack/react-query";
import { Address, erc20ABI, useAccount } from "wagmi";
import { formatUnits } from "viem";

import viemClient from "../../../stores/connectors/viem";
import { getInitBaseAssets } from "../../../lib/global/queries";
import { useMaxxingGaugeRewardsListLength } from "../../../lib/wagmiGen";
import { CONTRACTS, PRO_OPTIONS } from "../../../stores/constants/constants";

const QUERY_KEYS = {
  TOKEN_ADDRESSES: "TOKEN_ADDRESSES",
  EARNED: "EARNED",
};

export interface Token {
  address: Address;
  symbol: string;
  decimals: number;
  reward: number;
  logoUrl: string | undefined;
}

interface Earned {
  address: Address;
  earnedAmount: string;
  symbol: string;
  logoUrl: string | undefined;
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

  const initBaseAssets = getInitBaseAssets();

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

    const asset = initBaseAssets.find((asset) => {
      return asset.address.toLowerCase() === rewardTokenAddress.toLowerCase();
    });

    let logoUrl = asset?.logoURI ? asset.logoURI : undefined;
    if (
      asset?.address.toLowerCase() === CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase()
    ) {
      logoUrl =
        "https://raw.githubusercontent.com/Velocimeter/frontend/pulse/Frontend-v1-Original/public/tokens/oFlow.png?raw=true";
    }

    rewardsTokens.push({
      address: rewardTokenAddress,
      symbol,
      decimals,
      logoUrl,
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
    const { address, symbol, decimals, logoUrl } = token;

    const earnedAmount = await viemClient.readContract({
      ...gaugeContract,
      functionName: "earned",
      args: [address, account],
    });
    earned.push({
      address,
      earnedAmount: formatUnits(earnedAmount, decimals),
      symbol,
      logoUrl,
    });
  }

  return earned;
}

function filterEarned(earned: Earned[]) {
  return earned.filter(({ earnedAmount }) => {
    return Number(earnedAmount) > 0;
  });
}
