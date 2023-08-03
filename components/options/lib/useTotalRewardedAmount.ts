import { useQuery } from "@tanstack/react-query";

import { PRO_OPTIONS } from "../../../stores/constants/constants";
import { useOptionTokenGauge } from "../../../lib/wagmiGen";

import { useInputs } from "./useInputs";
import { useTokenData } from "./useTokenData";

export function useTotalRewardedAmount() {
  const { optionToken } = useInputs();
  const { data: gaugeAddress } = useOptionTokenGauge({
    address: PRO_OPTIONS[optionToken].tokenAddress,
  });
  const { paymentTokenAddress, paymentTokenDecimals } = useTokenData();
  return useQuery({
    queryKey: [
      "totalRewardedAmount",
      gaugeAddress,
      paymentTokenAddress,
      paymentTokenDecimals,
    ],
    queryFn: async () => {
      const jsonTotalRewarded = await fetch("api/total-rewarded", {
        method: "POST",
        body: JSON.stringify({
          gaugeAddress,
          paymentTokenAddress,
          paymentTokenDecimals,
        }),
      });
      const totalRewarded = (await jsonTotalRewarded.json()) as number;
      return totalRewarded;
    },
    // this is purely because not to spam the nodes
    staleTime: 1000 * 60 * 60 * 24, // day
    cacheTime: 1000 * 60 * 10, // 10 minutes
    retry: 5,
    enabled:
      !!gaugeAddress &&
      !!paymentTokenAddress &&
      paymentTokenDecimals !== undefined,
  });
}
