import BigNumber from "bignumber.js";
import { v4 as uuidv4 } from "uuid";
import { stringToHex, keccak256 } from "viem";

export function formatCurrency(amount: any, decimals = 2) {
  if (!isNaN(amount)) {
    if (BigNumber(amount).gt(0) && BigNumber(amount).lt(0.01)) {
      return "< 0.01";
    }

    const formatter = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return formatter.format(amount);
  } else {
    return 0;
  }
}

export function formatAddress(address: `0x${string}`, length = "short") {
  if (address && length === "short") {
    const formattedAddress =
      address.substring(0, 6) +
      "..." +
      address.substring(address.length - 4, address.length);
    return formattedAddress;
  } else if (address && length === "long") {
    const formattedAddress =
      address.substring(0, 12) +
      "..." +
      address.substring(address.length - 8, address.length);
    return formattedAddress;
  } else {
    return null;
  }
}

export function getTXUUID() {
  return uuidv4();
}

export function getHexQueryKey(queryKey: any) {
  return keccak256(stringToHex(JSON.stringify(queryKey)));
}
