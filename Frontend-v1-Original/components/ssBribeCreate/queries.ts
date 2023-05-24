import {
  useBaseAssetWithInfo,
  usePairsWithGauges,
} from "../../lib/global/queries";
import { NATIVE_TOKEN } from "../../stores/constants/constants";
import { BaseAsset, Pair, hasGauge } from "../../stores/types/types";

export const useGauges = () => {
  return usePairsWithGauges(getOnlyGauges);
};

export const useBaseAssetWithInfoNoNative = () => {
  return useBaseAssetWithInfo(getBaseAssetsWithoutNative);
};

const getOnlyGauges = (pairsWithGauges: Pair[]) => {
  return pairsWithGauges.filter(hasGauge).filter((gauge) => gauge.isAliveGauge);
};

const getBaseAssetsWithoutNative = (baseAssetsWithInfo: BaseAsset[]) => {
  return baseAssetsWithInfo.filter(
    (baseAsset) => baseAsset.address !== NATIVE_TOKEN.address
  );
};
