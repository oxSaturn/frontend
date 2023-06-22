import { useQuery } from "@tanstack/react-query";

import { useTokenPrices } from "../../header/lib/queries";

import { type Token, useGaugeRewardTokens } from "./useGaugeRewards";
import { useStakeData } from "./useStakeData";

export function useGaugeApr() {
  const { data: rewardTokens } = useGaugeRewardTokens();
  const { data: tokenPrices } = useTokenPrices();
  const { tvl } = useStakeData();
  return useQuery({
    queryKey: ["GAUGE-APR", rewardTokens, tokenPrices, tvl],
    queryFn: () => getGaugeApr(rewardTokens, tokenPrices, tvl),
    enabled: !!rewardTokens && !!tokenPrices && tvl !== undefined,
  });
}

function getGaugeApr(
  rewardTokens: Token[] | undefined,
  tokenPrices: Map<string, number> | undefined,
  tvl: number | undefined
) {
  if (!rewardTokens || !tokenPrices || tvl === undefined) {
    throw new Error("rewardTokens or tokenPrices is undefined");
  }

  let apr = 0;

  for (const rewardToken of rewardTokens) {
    const price = tokenPrices?.get(rewardToken.address.toLowerCase());
    if (price) {
      apr += ((rewardToken.reward * price) / tvl) * 100 * 365;
    }
  }

  return apr;
}
