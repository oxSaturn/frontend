import { useQuery } from "@tanstack/react-query";

import { useTokenPrices } from "../../header/lib/queries";
import { useOptionTokenUnderlyingToken } from "../../../lib/wagmiGen";
import { PRO_OPTIONS } from "../../../stores/constants/constants";

import { type Token, useGaugeRewardTokens } from "./useGaugeRewards";
import { useStakeData } from "./useStakeData";
import { useDiscountsData } from "./useDiscountsData";

export function useGaugeApr() {
  const { data: rewardTokens } = useGaugeRewardTokens();
  const { data: tokenPrices } = useTokenPrices();
  const { data: underlyingTokenAddress } = useOptionTokenUnderlyingToken();
  const { discount, maxLpDiscount, minLpDiscount, veDiscount } =
    useDiscountsData();
  const { totalStakedValue } = useStakeData();
  const optionTokenAddress = PRO_OPTIONS.oFLOW.tokenAddress;
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
    ],
    queryFn: () =>
      getGaugeApr(rewardTokens, tokenPrices, totalStakedValue, {
        discount,
        maxLpDiscount,
        minLpDiscount,
        veDiscount,
        underlyingTokenAddress,
        optionTokenAddress,
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
      !!veDiscount,
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
  }
) {
  if (!rewardTokens || !tokenPrices || totalStakedValue === undefined) {
    throw new Error("rewardTokens or tokenPrices is undefined");
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
      "discount, maxLpDiscount, minLpDiscount, veDiscount, underlyingTokenAddress undefined error"
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

  let minApr = 0;
  let maxApr = 0;
  let apr = 0;

  for (const rewardToken of rewardTokens) {
    let minPrice: number | undefined;
    let maxPrice: number | undefined;
    let price: number | undefined;

    if (
      rewardToken.address.toLowerCase() ===
        underlyingTokenAddress.toLowerCase() ||
      rewardToken.address.toLowerCase() === optionTokenAddress.toLowerCase()
    ) {
      const fullUnderlyingTokenPrice =
        tokenPrices.get(underlyingTokenAddress.toLowerCase()) ?? 0;

      maxPrice = (fullUnderlyingTokenPrice * (100 - minDiscount)) / 100;
      minPrice = (fullUnderlyingTokenPrice * (100 - maxDiscount)) / 100;

      maxApr +=
        ((rewardToken.reward * maxPrice) / totalStakedValue) * 100 * 365;
      minApr +=
        ((rewardToken.reward * minPrice) / totalStakedValue) * 100 * 365;
    } else {
      price = tokenPrices.get(rewardToken.address.toLowerCase()) ?? 0;
      apr += ((rewardToken.reward * price) / totalStakedValue) * 100 * 365;
    }
  }

  minApr += apr;
  maxApr += apr;

  return [minApr, maxApr] as const;
}
