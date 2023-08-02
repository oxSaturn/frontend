import { useQuery } from "@tanstack/react-query";

import { useInputs } from "./useInputs";

export function useTotalRewardedAmount() {
  const { optionToken } = useInputs();
  return useQuery({
    queryKey: ["totalRewardedAmount"],
    queryFn: async () => {
      const jsonTotalRewarded = await fetch("api/total-rewarded");
      const totalRewarded = (await jsonTotalRewarded.json()) as number;
      return totalRewarded;
    },
    // this is purely because not to spam the nodes
    staleTime: 1000 * 60 * 60 * 24, // day
    cacheTime: 1000 * 60 * 10, // 10 minutes
    retry: 5,
    enabled: optionToken === "oFVM",
  });
}
