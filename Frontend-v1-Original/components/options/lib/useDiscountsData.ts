import {
  useOAggMaxLpDiscount,
  useOAggMinLpDiscount,
} from "../../../lib/wagmiGen";

/**
 * Hook gets the min and max discounts for LP of the option token.
 * @notice Wagmi generated hooks return so-called Asian discounts,
 * which are the opposite of western discount term.
 * @returns {(minLpDiscount: number, maxLpDiscount: number)}
 */
export function useDiscountsData() {
  const { data: maxLpDiscount } = useOAggMinLpDiscount({
    select: (data) => Number(data),
  });
  const { data: minLpDiscount } = useOAggMaxLpDiscount({
    select: (data) => Number(data),
  });
  return {
    minLpDiscount: minLpDiscount ?? 0,
    maxLpDiscount: maxLpDiscount ?? 100,
  };
}
