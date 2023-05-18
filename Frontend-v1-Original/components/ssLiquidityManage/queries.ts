import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import BigNumber from "bignumber.js";

import {
  getPairsWithGauges,
  usePairsWithoutGauges,
} from "../../lib/global/queries";
import { QUERY_KEYS } from "../../stores/constants/constants";

export const usePairsWithGaugesOnlyWithBalance = () => {
  const { address } = useAccount();
  const { data: pairsWithoutGauges } = usePairsWithoutGauges();
  return useQuery({
    queryKey: [
      QUERY_KEYS.PAIRS_WITH_GAUGES_AND_BALANCES,
      address,
      pairsWithoutGauges,
    ],
    queryFn: () => getPairsWithGauges(address!, pairsWithoutGauges!),
    enabled: !!address && !!pairsWithoutGauges,
    select: (pairs) => {
      return pairs.filter((ppp) => {
        return (
          (ppp.balance && BigNumber(ppp.balance).gt(0)) ||
          (ppp.gauge?.balance && BigNumber(ppp.gauge.balance).gt(0))
        );
      });
    },
  });
};
