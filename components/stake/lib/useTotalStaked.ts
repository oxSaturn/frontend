import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";

import { useStakeFvmTotalSupply } from "../../../lib/wagmiGen";
import { CONTRACTS } from "../../../stores/constants/constants";
import { useTokenPrices } from "../../header/lib/queries";

export function useTotalStaked() {
  const { data: totalSupply } = useStakeFvmTotalSupply({
    select: (data) => formatEther(data),
  });
  const { data: tokenPrices } = useTokenPrices();
  return useQuery({
    queryKey: ["FVM-STAKE-TVL", totalSupply, tokenPrices],
    queryFn: () => {
      const fvmPrice =
        tokenPrices?.get(CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase()) ?? 0;
      return Number(totalSupply) * fvmPrice;
    },
    enabled: !!totalSupply && !!tokenPrices,
  });
}
