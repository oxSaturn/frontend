import {
  useOptionTokenMaxLpDiscount,
  useOptionTokenMinLpDiscount,
} from "../../../lib/wagmiGen";

/**
 * Hook gets the min and max discounts for LP of the option token.
 * @notice Wagmi generated hooks return so-called Asian discounts,
 * which are the opposite of western discount term.
 * @returns {(minLpDiscount: number, maxLpDiscount: number)}
 */
export function useDiscountsData() {
  const { data: minLpDiscount } = useOptionTokenMinLpDiscount({
    select: (data) => Number(100n - data),
  });
  const { data: maxLpDiscount } = useOptionTokenMaxLpDiscount({
    select: (data) => Number(100n - data),
  });
  return {
    minLpDiscount: minLpDiscount ?? 0,
    maxLpDiscount: maxLpDiscount ?? 100,
  };
}
