import { useQuery } from "@tanstack/react-query";

import { NATIVE_TOKEN, QUERY_KEYS } from "../../stores/constants/constants";
import { BaseAsset, Pair } from "../../stores/types/types";
import { useBaseAssetWithInfo, usePairs } from "../../lib/global/queries";

const getSwapAssets = (
  baseAssets: BaseAsset[] | undefined,
  pairs: Pair[] | undefined
) => {
  if (!baseAssets || !pairs) throw new Error("Need base assets and pairs");

  const set = new Set<string>();
  set.add(NATIVE_TOKEN.address.toLowerCase());
  pairs.forEach((pair) => {
    set.add(pair.token0.address.toLowerCase());
    set.add(pair.token1.address.toLowerCase());
  });
  const baseAssetsWeSwap = baseAssets.filter((asset) =>
    set.has(asset.address.toLowerCase())
  );
  return [...baseAssetsWeSwap];
};

export const useSwapAssets = () => {
  const { data: baseAssetsWithInfo } = useBaseAssetWithInfo();
  const { data: pairs } = usePairs();
  return useQuery({
    queryKey: [QUERY_KEYS.SWAP_ASSETS, baseAssetsWithInfo, pairs],
    queryFn: () => getSwapAssets(baseAssetsWithInfo, pairs),
    enabled: !!baseAssetsWithInfo && !!pairs,
  });
};
