import { useQuery } from "@tanstack/react-query";

import { useTokenPrices } from "../../header/lib/queries";

import { type Token, useGaugeRewardTokens } from "./useGaugeRewards";
import { useStakeData } from "./useStakeData";

export function useGaugeApr() {
  const { data: rewardTokens } = useGaugeRewardTokens();
  const { data: tokenPrices } = useTokenPrices();
  const { totalStakedValue } = useStakeData();
  return useQuery({
    queryKey: ["GAUGE-APR", rewardTokens, tokenPrices, totalStakedValue],
    queryFn: () => getGaugeApr(rewardTokens, tokenPrices, totalStakedValue),
    enabled: !!rewardTokens && !!tokenPrices && totalStakedValue !== undefined,
  });
}

function getGaugeApr(
  rewardTokens: Token[] | undefined,
  tokenPrices: Map<string, number> | undefined,
  totalStakedValue: number | undefined
) {
  if (!rewardTokens || !tokenPrices || totalStakedValue === undefined) {
    throw new Error("rewardTokens or tokenPrices is undefined");
  }

  let apr = 0;

  for (const rewardToken of rewardTokens) {
    const price = tokenPrices?.get(rewardToken.address.toLowerCase());
    if (price) {
      apr += ((rewardToken.reward * price) / totalStakedValue) * 100 * 365;
    }
  }

  return apr;
}
