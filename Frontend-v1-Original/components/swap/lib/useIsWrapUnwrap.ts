import {
  NATIVE_TOKEN,
  W_NATIVE_SYMBOL,
} from "../../../stores/constants/constants";
import { BaseAsset } from "../../../stores/types/types";

export function useIsWrapUnwrap({
  fromAssetValue,
  toAssetValue,
}: {
  fromAssetValue: BaseAsset | null;
  toAssetValue: BaseAsset | null;
}) {
  const isWrapUnwrap =
    (fromAssetValue?.symbol === W_NATIVE_SYMBOL &&
      toAssetValue?.symbol === NATIVE_TOKEN.symbol) ||
    (fromAssetValue?.symbol === NATIVE_TOKEN.symbol &&
      toAssetValue?.symbol === W_NATIVE_SYMBOL)
      ? true
      : false;
  const isWrap = fromAssetValue?.symbol === NATIVE_TOKEN.symbol;
  return {
    isWrapUnwrap,
    isWrap,
  };
}
