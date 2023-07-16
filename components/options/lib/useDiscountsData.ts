import {
  useOptionTokenDiscount,
  useOptionTokenMaxLpDiscount,
  useOptionTokenMinLpDiscount,
  useOptionTokenVeDiscount,
} from "../../../lib/wagmiGen";
import { PRO_OPTIONS } from "../../../stores/constants/constants";

import { useInputs } from "./useInputs";

/**
 * Hook gets the min and max discounts for LP of the option token.
 * @notice Wagmi generated hooks return so-called Asian discounts,
 * which are the opposite of western discount term.
 * @returns {(minLpDiscount: number, maxLpDiscount: number)}
 */
export function useDiscountsData() {
  const { optionToken } = useInputs();

  const { data: discount } = useOptionTokenDiscount({
    address: PRO_OPTIONS[optionToken].tokenAddress,
    select: (asianDiscount) => (100n - asianDiscount).toString(),
  });
  const { data: veDiscount } = useOptionTokenVeDiscount({
    address: PRO_OPTIONS[optionToken].tokenAddress,
    select: (asianDiscount) => (100n - asianDiscount).toString(),
  });
  const { data: minLpDiscount } = useOptionTokenMinLpDiscount({
    address: PRO_OPTIONS[optionToken].tokenAddress,
    select: (data) => Number(100n - data),
  });
  const { data: maxLpDiscount } = useOptionTokenMaxLpDiscount({
    address: PRO_OPTIONS[optionToken].tokenAddress,
    select: (data) => Number(100n - data),
  });
  return {
    minLpDiscount,
    maxLpDiscount,
    veDiscount,
    discount,
  };
}
