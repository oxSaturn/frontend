import BigNumber from "bignumber.js";

import { usePairsWithGauges } from "../../lib/global/queries";
import { Pair } from "../../stores/types/types";

export const usePairsWithGaugesOnlyWithBalance = () => {
  return usePairsWithGauges(getOnlyWithBalance);
};

const getOnlyWithBalance = (data: Pair[]) => {
  return data.filter((ppp) => {
    return (
      (ppp.balance && BigNumber(ppp.balance).gt(0)) ||
      (ppp.gauge?.balance && BigNumber(ppp.gauge.balance).gt(0))
    );
  });
};
