import { useQuery } from "@tanstack/react-query";
import { Address, erc20ABI, useAccount } from "wagmi";
import { formatUnits } from "viem";

import viemClient from "../../../stores/connectors/viem";
import { getInitBaseAssets } from "../../../lib/global/queries";
import {
  useMaxxingGaugeRewardsListLength,
  useOptionTokenGauge,
} from "../../../lib/wagmiGen";
import { CONTRACTS, PRO_OPTIONS } from "../../../stores/constants/constants";

import { useIsEmittingOptions } from "./useIsEmittingOptions";
import { useInputs } from "./useInputs";

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
  const { optionToken } = useInputs();
  const { address } = useAccount();
  const { data: rewardTokens } = useGaugeRewardTokens();
  const { data: gaugeAddress } = useOptionTokenGauge({
    address: PRO_OPTIONS[optionToken].tokenAddress,
  });
  return useQuery({
    queryKey: [QUERY_KEYS.EARNED, rewardTokens, address, gaugeAddress],
    queryFn: () => getEarned(address, rewardTokens, gaugeAddress),
    enabled: !!rewardTokens && !!address && !!gaugeAddress,
    select: filterEarned,
    keepPreviousData: true,
  });
}

export function useGaugeRewardTokens() {
  const { optionToken } = useInputs();
  const { data: gaugeAddress } = useOptionTokenGauge({
    address: PRO_OPTIONS[optionToken].tokenAddress,
  });

  const { data: rewardsListLength } = useMaxxingGaugeRewardsListLength({
    address: gaugeAddress,
    select: (data) => Number(data),
  });

  const { data: isEmittingOptions } = useIsEmittingOptions();

  return useQuery({
    queryKey: [
      QUERY_KEYS.TOKEN_ADDRESSES,
      rewardsListLength,
      gaugeAddress,
      isEmittingOptions,
    ],
    queryFn: () =>
      getGaugeRewardTokens(rewardsListLength, gaugeAddress, isEmittingOptions),
    enabled:
      !!rewardsListLength && !!gaugeAddress && isEmittingOptions !== undefined,
  });
}

async function getGaugeRewardTokens(
  rewardsListLength: number | undefined,
  gaugeAddress: Address | undefined,
  isEmittingOptions: boolean | undefined
) {
  if (!rewardsListLength) {
    throw new Error("rewardsListLength is undefined or zero");
  }
  if (!gaugeAddress) {
    throw new Error("gaugeAddress is undefined");
  }
  if (isEmittingOptions === undefined) {
    throw new Error("isEmittingOptions is undefined");
  }

  const initBaseAssets = getInitBaseAssets();

  const gaugeContract = {
    address: gaugeAddress,
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
    const isUnderlyingTokenEmittedAsOption =
      asset?.address.toLowerCase() ===
        CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase() && isEmittingOptions;
    if (isUnderlyingTokenEmittedAsOption) {
      logoUrl = "https://base.velocimeter.xyz/tokens/oBvm.png";
    }

    rewardsTokens.push({
      address: rewardTokenAddress,
      symbol: isUnderlyingTokenEmittedAsOption ? `o${symbol}` : symbol,
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
  rewardsTokens: Token[] | undefined,
  gaugeAddress: Address | undefined
) {
  if (!account) {
    throw new Error("account is undefined");
  }
  if (!rewardsTokens) {
    throw new Error("tokenAddresses is undefined");
  }
  if (!gaugeAddress) {
    throw new Error("gaugeAddress is undefined");
  }

  const gaugeContract = {
    address: gaugeAddress,
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
