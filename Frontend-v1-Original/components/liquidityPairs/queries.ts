import { useEffect, useState } from "react";

import {
  usePairs,
  usePairsWithoutGauges,
  usePairsWithGauges,
} from "../../lib/global/queries";
import { Pair } from "../../stores/types/types";

export const useTablePairs = () => {
  const [pairs, setPairs] = useState<Pair[]>();

  const { data: initPairs, isFetching: isFetchingInitPairs } = usePairs();
  const { data: pairsWithoutGauges, isFetching: isFetchingWithoutGauges } =
    usePairsWithoutGauges();
  const { data: pairsWithGauges, isFetching: isFetchingWithGauges } =
    usePairsWithGauges();

  useEffect(() => {
    if (pairsWithGauges) {
      return setPairs(pairsWithGauges);
    }
    if (pairsWithoutGauges) {
      return setPairs(pairsWithoutGauges);
    }
    if (initPairs) {
      return setPairs(initPairs);
    }
  }, [initPairs, pairsWithoutGauges, pairsWithGauges]);

  const isFetching =
    isFetchingWithGauges || isFetchingWithoutGauges || isFetchingInitPairs;

  return { data: pairs, isFetching };
};
