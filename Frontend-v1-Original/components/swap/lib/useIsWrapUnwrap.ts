import { BaseAsset } from "../../../stores/types/types";

export function useIsWrapUnwrap({
  fromAssetValue,
  toAssetValue,
}: {
  fromAssetValue: BaseAsset | null;
  toAssetValue: BaseAsset | null;
}) {
  const isWrapUnwrap =
    (fromAssetValue?.symbol === "WCANTO" && toAssetValue?.symbol === "CANTO") ||
    (fromAssetValue?.symbol === "CANTO" && toAssetValue?.symbol === "WCANTO") ||
    (fromAssetValue?.symbol === "CANTO" && toAssetValue?.symbol === "CANTOE") ||
    (fromAssetValue?.symbol === "CANTOE" && toAssetValue?.symbol === "CANTO")
      ? true
      : false;
  const isWrap = fromAssetValue?.symbol === "CANTO";
  return {
    isWrapUnwrap,
    isWrap,
  };
}
