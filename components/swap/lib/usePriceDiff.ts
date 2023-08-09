import { useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";

import { BaseAsset, QuoteSwapResponse } from "../../../stores/types/types";
import { WETH_ADDRESS } from "../../../stores/constants/contracts";
import {
  NATIVE_TOKEN,
  W_NATIVE_ADDRESS,
} from "../../../stores/constants/constants";

export function usePriceDiff({
  fromAmountValueUsd,
  toAmountValueUsd,
}: {
  fromAmountValueUsd: string;
  toAmountValueUsd: string;
}) {
  return useMemo(() => {
    if (
      fromAmountValueUsd &&
      fromAmountValueUsd === "" &&
      toAmountValueUsd &&
      toAmountValueUsd === ""
    )
      return "";
    if (
      parseFloat(fromAmountValueUsd) === 0 ||
      parseFloat(toAmountValueUsd) === 0
    )
      return "";
    if (parseFloat(fromAmountValueUsd) === parseFloat(toAmountValueUsd)) return;
    if (parseFloat(fromAmountValueUsd) === parseFloat(toAmountValueUsd)) return;
    fromAmountValueUsd &&
      fromAmountValueUsd !== "" &&
      toAmountValueUsd &&
      toAmountValueUsd !== "";

    const increase =
      ((parseFloat(toAmountValueUsd) - parseFloat(fromAmountValueUsd)) /
        parseFloat(fromAmountValueUsd)) *
      100;
    const decrease =
      ((parseFloat(fromAmountValueUsd) - parseFloat(toAmountValueUsd)) /
        parseFloat(fromAmountValueUsd)) *
      100;
    const diff =
      parseFloat(fromAmountValueUsd) > parseFloat(toAmountValueUsd)
        ? -1 * decrease
        : increase;
    return diff.toFixed(2);
  }, [fromAmountValueUsd, toAmountValueUsd]);
}

export function usePriceImpact({
  quote,
  fromAssetValue,
  toAssetValue,
}: {
  quote: QuoteSwapResponse | undefined | null;
  fromAssetValue: BaseAsset | null;
  toAssetValue: BaseAsset | null;
}) {
  const [priceImpact, setPriceImpact] = useState<number>();
  let fromAssetAddress = fromAssetValue?.address.toLowerCase();
  if (fromAssetAddress === NATIVE_TOKEN.address.toLowerCase()) {
    fromAssetAddress = W_NATIVE_ADDRESS.toLowerCase();
  }
  let toAssetAddress = toAssetValue?.address.toLowerCase();
  if (toAssetAddress === NATIVE_TOKEN.address.toLowerCase()) {
    toAssetAddress = W_NATIVE_ADDRESS.toLowerCase();
  }
  const fromPrice =
    !!fromAssetValue?.address && !!quote
      ? quote.maxReturn.tokens[fromAssetAddress as `0x${string}`].price *
        parseFloat(
          formatUnits(
            BigInt(quote.maxReturn.totalFrom),
            fromAssetValue.decimals
          )
        )
      : undefined;
  const toPrice =
    !!toAssetValue?.address && !!quote
      ? quote.maxReturn.tokens[toAssetAddress as `0x${string}`].price *
        parseFloat(
          formatUnits(BigInt(quote.maxReturn.totalTo), toAssetValue.decimals)
        )
      : undefined;

  useEffect(() => {
    if (fromPrice !== undefined && toPrice !== undefined) {
      setPriceImpact(
        fromPrice - toPrice > 0
          ? -1 * ((fromPrice - toPrice) / fromPrice) * 100
          : ((toPrice - fromPrice) / fromPrice) * 100
      );
    }
  }, [fromPrice, toPrice]);

  return priceImpact;
}
