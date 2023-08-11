import { useQuery } from "@tanstack/react-query";

import { useTokenPrices } from "../../header/lib/queries";

export function useTokenValue(
  tokenAddress: `0x${string}` | undefined,
  amount: string | undefined
) {
  const { data: tokenPrices } = useTokenPrices();
  return useQuery({
    queryKey: ["paymentTokenValue", tokenAddress, amount],
    queryFn: () => {
      if (!tokenAddress || !amount)
        throw new Error("Missing token address and amount");

      const price = tokenPrices?.get(tokenAddress);
      if (!price) throw new Error("No price found for payment token");

      return price * parseFloat(amount);
    },
    enabled: !!tokenPrices && !!tokenAddress && !!amount,
  });
}
