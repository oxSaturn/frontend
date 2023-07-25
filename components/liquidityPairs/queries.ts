import { useEffect } from "react";
import { create } from "zustand";

import {
  usePairs,
  usePairsWithoutGauges,
  usePairsWithGauges,
} from "../../lib/global/queries";
import { Pair } from "../../stores/types/types";

interface UseReactivePairs {
  pairs: Pair[] | undefined;
  isFetching: boolean;
  setPairs: (_pairs: Pair[] | undefined) => void;
  setIsFetching: (_isFetching: boolean) => void;
}
const fuckMultiPairAddress = "0x90102FbbB9226bBD286Da3003ADD03D4178D896e";

const useReactivePairs = create<UseReactivePairs>()((set) => ({
  pairs: undefined,
  isFetching: false,
  setPairs: (pairs) => set({ pairs }),
  setIsFetching: (isFetching) => set({ isFetching }),
}));

export const useDisplayedPairs = () => {
  const { pairs, setPairs, isFetching, setIsFetching } = useReactivePairs();

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
  }, [initPairs, pairsWithoutGauges, pairsWithGauges, setPairs]);

  useEffect(() => {
    if (
      isFetchingWithGauges ||
      isFetchingWithoutGauges ||
      isFetchingInitPairs
    ) {
      setIsFetching(true);
    } else {
      setIsFetching(false);
    }
  }, [
    isFetchingInitPairs,
    isFetchingWithoutGauges,
    isFetchingWithGauges,
    setIsFetching,
  ]);

  return {
    data: pairs?.map((pair) => {
      if (pair.address.toLowerCase() === fuckMultiPairAddress.toLowerCase()) {
        return {
          ...pair,
          symbol: "vAMM-WFTM/FMULTI",
        };
      }
      return pair;
    }),
    isFetching,
  };
};
