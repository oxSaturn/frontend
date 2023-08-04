import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export function useEligibleAirdropAmount() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["eligible-airdrop-amount", address],
    queryFn: async () => {
      const jsonAirdropEligibleData = await fetch(`/api/airdrop-amount`, {
        method: "POST",
        body: JSON.stringify({
          address,
        }),
      });
      const eligibleData = await jsonAirdropEligibleData.json();
      return eligibleData as number;
    },
    // this is purely because not to spam the nodes
    staleTime: 1000 * 60 * 60 * 24 * 3, // 3 days
    cacheTime: 1000 * 60 * 10, // 10 minutes
    retry: 5,
    enabled: !!address,
  });
}
