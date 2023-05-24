import { useMemo } from "react";

import {
  useBaseAssetWithInfo,
  usePairsWithGauges,
} from "../../lib/global/queries";
import { NATIVE_TOKEN } from "../../stores/constants/constants";
import { hasGauge } from "../../stores/types/types";

export const useGauges = () => {
  const query = usePairsWithGauges();
  return {
    ...query,
    data: useMemo(() => {
      return query.data?.filter(hasGauge).filter((gauge) => gauge.isAliveGauge);
    }, [query.data]),
  };
};

export const useBaseAssetWithInfoNoNative = () => {
  const query = useBaseAssetWithInfo();
  return {
    ...query,
    data: useMemo(() => {
      return query.data?.filter((option) => {
        return option.address !== NATIVE_TOKEN.address;
      });
    }, [query.data]),
  };
};
