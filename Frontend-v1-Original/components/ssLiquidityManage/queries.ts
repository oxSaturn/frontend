import { useMemo } from "react";
import BigNumber from "bignumber.js";

import { usePairsWithGauges } from "../../lib/global/queries";

export const usePairsWithGaugesOnlyWithBalance = () => {
  const query = usePairsWithGauges();
  return {
    ...query,
    data: useMemo(() => {
      return query.data?.filter((ppp) => {
        return (
          (ppp.balance && BigNumber(ppp.balance).gt(0)) ||
          (ppp.gauge?.balance && BigNumber(ppp.gauge.balance).gt(0))
        );
      });
    }, [query.data]),
  };
};
