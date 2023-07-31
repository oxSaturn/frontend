import { useQuery } from "@tanstack/react-query";

import { useInputs } from "./useInputs";

export function useCurrentLocks() {
  const { optionToken } = useInputs();
  return useQuery({
    queryKey: ["currentLocks"],
    queryFn: async () => {
      const jsonLocksData = await fetch(`/api/current-locks`);
      const locksData = await jsonLocksData.json();
      return locksData as { average: string; median: string };
    },
    // this is purely because not to spam the nodes
    staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days
    cacheTime: 1000 * 60 * 10, // 10 minutes
    retry: 5,
    enabled: optionToken === "oFVM",
  });
}
