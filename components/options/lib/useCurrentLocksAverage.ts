import { useQuery } from "@tanstack/react-query";

import { PRO_OPTIONS } from "../../../stores/constants/constants";
import { useOptionTokenGauge } from "../../../lib/wagmiGen";

import { useInputs } from "./useInputs";

export function useCurrentLocksAverage() {
  const { optionToken } = useInputs();
  const optionTokenAddress = PRO_OPTIONS[optionToken].tokenAddress;
  const { data: gaugeAddress } = useOptionTokenGauge({
    address: optionTokenAddress,
  });
  return useQuery({
    queryKey: ["currentLocks", gaugeAddress, optionTokenAddress],
    queryFn: async () => {
      const jsonAverageLocksData = await fetch("/api/current-locks", {
        method: "POST",
        body: JSON.stringify({
          gaugeAddress,
          optionTokenAddress,
        }),
      });
      const averageLocksData = await jsonAverageLocksData.json();
      return averageLocksData as string;
    },
    // this is purely because not to spam the nodes
    staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days
    cacheTime: 1000 * 60 * 10, // 10 minutes
    retry: 5,
    enabled: !!gaugeAddress && !!optionTokenAddress,
  });
}
