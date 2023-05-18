import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

import {
  getBaseAssetsWithInfo,
  getPairs,
  usePairsData,
} from "../../lib/global/queries";
import { NATIVE_TOKEN, QUERY_KEYS } from "../../stores/constants/constants";
import { hasGauge } from "../../stores/types/types";

export const useGauges = () => {
  const { data: pairsData } = usePairsData();
  return useQuery({
    queryKey: [QUERY_KEYS.GAUGES, pairsData],
    queryFn: () => getPairs(pairsData),
    enabled: !!pairsData,
    select: (pairs) =>
      pairs.filter(hasGauge).filter((gauge) => gauge.isAliveGauge),
  });
};

export const useBaseAssetWithInfoNoNative = () => {
  const { address } = useAccount();
  return useQuery({
    queryKey: [QUERY_KEYS.BASE_ASSET_INFO_NO_NATIVE, address],
    queryFn: () => getBaseAssetsWithInfo(address),
    select: (baseAssets) => {
      return baseAssets.filter((option) => {
        return option.address !== NATIVE_TOKEN.address;
      });
    },
  });
};
