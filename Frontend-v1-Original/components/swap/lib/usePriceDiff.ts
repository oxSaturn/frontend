import { useMemo } from "react";

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
