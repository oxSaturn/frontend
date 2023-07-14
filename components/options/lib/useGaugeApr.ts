import { useQuery } from "@tanstack/react-query";

import { useTokenPrices } from "../../header/lib/queries";
import { useOptionTokenUnderlyingToken } from "../../../lib/wagmiGen";
import { PRO_OPTIONS } from "../../../stores/constants/constants";

import { type Token, useGaugeRewardTokens } from "./useGaugeRewards";
import { useStakeData } from "./useStakeData";
import { useDiscountsData } from "./useDiscountsData";
import { useIsEmittingOptions } from "./useIsEmittingOptions";
import { aggregateApr } from "./aggregateApr";

export function useGaugeApr() {
  const { data: rewardTokens } = useGaugeRewardTokens();
  const { data: tokenPrices } = useTokenPrices();
  const { data: underlyingTokenAddress } = useOptionTokenUnderlyingToken();
  const { discount, maxLpDiscount, minLpDiscount, veDiscount } =
    useDiscountsData();
  const { totalStakedValue } = useStakeData();
  const { data: isEmittingOptions } = useIsEmittingOptions();
  const optionTokenAddress = PRO_OPTIONS.oFVM.tokenAddress;
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
    ],
    queryFn: () =>
      getGaugeApr(rewardTokens, tokenPrices, totalStakedValue, {
        discount,
        maxLpDiscount,
        minLpDiscount,
        veDiscount,
        underlyingTokenAddress,
        optionTokenAddress,
        isEmittingOptions,
      }),
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
      isEmittingOptions !== undefined,
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
    isEmittingOptions,
  } = discountsPriceOverride;
  if (
    !discount ||
    !veDiscount ||
    !underlyingTokenAddress ||
    !optionTokenAddress ||
    maxLpDiscount === undefined ||
    minLpDiscount === undefined ||
    isEmittingOptions === undefined
  ) {
    throw new Error(
      "discount, maxLpDiscount, minLpDiscount, veDiscount, underlyingTokenAddress, isEmittingOptions undefined error"
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
