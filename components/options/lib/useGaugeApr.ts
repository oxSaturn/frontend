import { useQuery } from "@tanstack/react-query";

import { useTokenPrices } from "../../header/lib/queries";
import {
  useOptionTokenDiscount,
  useOptionTokenUnderlyingToken,
  useOptionTokenVeDiscount,
} from "../../../lib/wagmiGen";
import { CONTRACTS, PRO_OPTIONS } from "../../../stores/constants/constants";

import { type Token, useGaugeRewardTokens } from "./useGaugeRewards";
import { useStakeData } from "./useStakeData";
import { useDiscountsData } from "./useDiscountsData";
import { useIsEmittingOptions } from "./useIsEmittingOptions";
import { aggregateApr } from "./aggregateApr";
import { useInputs } from "./useInputs";

export function useGaugeApr() {
  const { optionToken } = useInputs();
  const { data: rewardTokens } = useGaugeRewardTokens();
  const { data: tokenPrices } = useTokenPrices();
  const { data: underlyingTokenAddress } = useOptionTokenUnderlyingToken({
    address: PRO_OPTIONS[optionToken].tokenAddress,
  });
  const { data: govDiscount } = useOptionTokenDiscount({
    address: PRO_OPTIONS.oFVM.tokenAddress,
    select: (asianDiscount) => (100n - asianDiscount).toString(),
  });
  const { data: govVeDiscount } = useOptionTokenVeDiscount({
    address: PRO_OPTIONS.oFVM.tokenAddress,
    select: (asianDiscount) => (100n - asianDiscount).toString(),
  });
  const { discount, maxLpDiscount, minLpDiscount, veDiscount } =
    useDiscountsData();
  const { totalStakedValue } = useStakeData();
  const { data: isEmittingOptions } = useIsEmittingOptions();
  const optionTokenAddress = PRO_OPTIONS[optionToken].tokenAddress;
  return useQuery({
    queryKey: [
      "GAUGE-APR",
      rewardTokens,
      tokenPrices,
      totalStakedValue,
      underlyingTokenAddress,
      optionTokenAddress,
      discount,
      maxLpDiscount,
      minLpDiscount,
      veDiscount,
      isEmittingOptions,
      govDiscount,
      govVeDiscount,
    ],
    queryFn: () =>
      getGaugeApr(
        rewardTokens,
        tokenPrices,
        totalStakedValue,
        {
          discount,
          maxLpDiscount,
          minLpDiscount,
          veDiscount,
          underlyingTokenAddress,
          optionTokenAddress,
        },
        {
          govDiscount,
          govVeDiscount,
          isEmittingOptions,
        }
      ),
    keepPreviousData: true,
    enabled:
      !!underlyingTokenAddress &&
      !!rewardTokens &&
      !!tokenPrices &&
      totalStakedValue !== undefined &&
      !!discount &&
      maxLpDiscount !== undefined &&
      minLpDiscount !== undefined &&
      !!veDiscount &&
      isEmittingOptions !== undefined &&
      !!govDiscount &&
      !!govVeDiscount,
  });
}

function getGaugeApr(
  rewardTokens: Token[] | undefined,
  tokenPrices: Map<string, number> | undefined,
  totalStakedValue: number | undefined,
  discountsPriceOverride: {
    discount: string | undefined;
    maxLpDiscount: number | undefined;
    minLpDiscount: number | undefined;
    veDiscount: string | undefined;
    underlyingTokenAddress: `0x${string}` | undefined;
    optionTokenAddress: `0x${string}` | undefined;
  },
  govDiscounts: {
    govDiscount: string | undefined;
    govVeDiscount: string | undefined;
    isEmittingOptions: boolean | undefined;
  }
) {
  if (!rewardTokens || !tokenPrices || totalStakedValue === undefined) {
    throw new Error("rewardTokens or tokenPrices or totalStaked is undefined");
  }
  const {
    discount,
    maxLpDiscount,
    minLpDiscount,
    veDiscount,
    underlyingTokenAddress,
    optionTokenAddress,
  } = discountsPriceOverride;
  if (
    !discount ||
    !veDiscount ||
    !underlyingTokenAddress ||
    !optionTokenAddress ||
    maxLpDiscount === undefined ||
    minLpDiscount === undefined
  ) {
    throw new Error(
      "discount, maxLpDiscount, minLpDiscount, veDiscount, underlyingTokenAddress, isEmittingOptions undefined error"
    );
  }
  const { govDiscount, govVeDiscount, isEmittingOptions } = govDiscounts;
  if (!govDiscount || !govVeDiscount || isEmittingOptions === undefined) {
    throw new Error(
      "govDiscount or govVeDiscount or isEmittingOptions undefined error"
    );
  }

  const minDiscount = Math.min(
    maxLpDiscount,
    minLpDiscount,
    +discount,
    +veDiscount
  );
  const maxDiscount = Math.max(
    maxLpDiscount,
    minLpDiscount,
    +discount,
    +veDiscount
  );

  const minDiscountFactor = minDiscount / 100;
  const maxDiscountFactor = maxDiscount / 100;

  const map = new Map<Token, readonly [number, number]>(); // [minApr, maxApr]

  for (const rewardToken of rewardTokens) {
    const isOptionToken =
      rewardToken.address.toLowerCase() === optionTokenAddress.toLowerCase();
    const isUnderlyingTokenEmittedAsOption =
      rewardToken.address.toLowerCase() ===
        underlyingTokenAddress.toLowerCase() && isEmittingOptions;
    const isGovTokenEmittedAsOption =
      rewardToken.address.toLowerCase() ===
        CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase() && isEmittingOptions;
    if (isUnderlyingTokenEmittedAsOption || isOptionToken) {
      const fullUnderlyingTokenPrice =
        tokenPrices.get(underlyingTokenAddress.toLowerCase()) ?? 0;

      const maxPrice = fullUnderlyingTokenPrice * maxDiscountFactor;
      const minPrice = fullUnderlyingTokenPrice * minDiscountFactor;

      const maxApr =
        ((rewardToken.reward * maxPrice) / totalStakedValue) * 100 * 365;
      const minApr =
        ((rewardToken.reward * minPrice) / totalStakedValue) * 100 * 365;

      map.set(rewardToken, [minApr, maxApr] as const);
    } else if (isGovTokenEmittedAsOption) {
      const fullGovTokenPrice =
        tokenPrices.get(CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase()) ?? 0;
      const minDiscountFactor = +govDiscount / 100;
      const maxDiscountFactor = +govVeDiscount / 100;

      const maxPrice = fullGovTokenPrice * maxDiscountFactor;
      const minPrice = fullGovTokenPrice * minDiscountFactor;

      const maxApr =
        ((rewardToken.reward * maxPrice) / totalStakedValue) * 100 * 365;
      const minApr =
        ((rewardToken.reward * minPrice) / totalStakedValue) * 100 * 365;

      map.set(rewardToken, [minApr, maxApr] as const);
    } else {
      const price = tokenPrices.get(rewardToken.address.toLowerCase()) ?? 0;
      const apr = ((rewardToken.reward * price) / totalStakedValue) * 100 * 365;
      map.set(rewardToken, [apr, apr] as const);
    }
  }

  const arr = [];

  for (const [token, aprRange] of map) {
    if (aprRange[0] === aprRange[1] || aprRange[1] < 0.01) {
      arr.push({ ...token, apr: aprRange[0] });
    } else {
      arr.push({ ...token, aprRange });
    }
  }

  const aggreatedApr = aggregateApr(arr);

  return aggreatedApr;
}
