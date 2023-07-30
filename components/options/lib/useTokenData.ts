import { useBalance, useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";

import {
  useOptionTokenSymbol,
  useOptionTokenPaymentToken,
  useOptionTokenBalanceOf,
  useOptionTokenGetDiscountedPrice,
  useOptionTokenUnderlyingToken,
  useOptionTokenGetTimeWeightedAveragePrice,
  useErc20Symbol,
  useErc20Decimals,
  useOptionTokenGetLpDiscountedPrice,
  useOptionTokenGetVeDiscountedPrice,
} from "../../../lib/wagmiGen";
import { PRO_OPTIONS } from "../../../stores/constants/constants";

import { useInputs } from "./useInputs";

export function useTokenData(lpDiscount?: number) {
  const { optionToken } = useInputs();
  const { address } = useAccount();
  const { data: optionTokenSymbol } = useOptionTokenSymbol({
    address: PRO_OPTIONS[optionToken].tokenAddress,
  });
  const { data: paymentTokenAddress } = useOptionTokenPaymentToken({
    address: PRO_OPTIONS[optionToken].tokenAddress,
  });
  const { data: underlyingTokenAddress } = useOptionTokenUnderlyingToken({
    address: PRO_OPTIONS[optionToken].tokenAddress,
  });
  const { data: paymentTokenSymbol } = useErc20Symbol({
    address: paymentTokenAddress,
    enabled: !!paymentTokenAddress,
  });
  const { data: paymentTokenDecimals } = useErc20Decimals({
    address: paymentTokenAddress,
    enabled: !!paymentTokenAddress,
  });
  const { data: underlyingTokenSymbol } = useErc20Symbol({
    address: underlyingTokenAddress,
    enabled: !!underlyingTokenAddress,
  });
  const {
    data: paymentBalance,
    isFetching: isFetchingPaymentBalance,
    refetch: refetchPaymentBalance,
  } = useBalance({
    address,
    token: paymentTokenAddress,
    enabled: !!paymentTokenAddress,
  });

  const {
    data: optionBalance,
    refetch: refetchOptionBalance,
    isFetching: isFetchingOptionBalance,
  } = useOptionTokenBalanceOf({
    address: PRO_OPTIONS[optionToken].tokenAddress,
    args: [address!],
    enabled: !!address,
    select: (data) => formatEther(data),
  });

  const { data: optionPrice } = useOptionTokenGetTimeWeightedAveragePrice({
    address: PRO_OPTIONS[optionToken].tokenAddress,
    args: [parseEther("1")],
    select: (data) => formatEther(data),
  });

  const { data: discountedPrice } = useOptionTokenGetDiscountedPrice({
    address: PRO_OPTIONS[optionToken].tokenAddress,
    args: [parseEther("1")],
    select: (data) => formatEther(data),
  });
  const { data: discountedLpPrice } = useOptionTokenGetLpDiscountedPrice({
    address: PRO_OPTIONS[optionToken].tokenAddress,
    args: [
      parseEther("1"),
      lpDiscount === undefined ? 100n : BigInt(100 - lpDiscount),
    ],
    select: (data) => formatEther(data),
    enabled: !!lpDiscount,
    cacheTime: 0,
  });
  const { data: discountedVePrice } = useOptionTokenGetVeDiscountedPrice({
    address: PRO_OPTIONS[optionToken].tokenAddress,
    args: [parseEther("1")],
    select: (data) => formatEther(data),
  });
  return {
    optionTokenSymbol: optionTokenSymbol ?? "oBVM",
    paymentTokenSymbol: paymentTokenSymbol ?? "WETH",
    paymentTokenDecimals: paymentTokenDecimals ?? 18,
    underlyingTokenSymbol: underlyingTokenSymbol ?? "BVM",
    paymentTokenAddress,
    paymentBalance,
    optionBalance,
    optionPrice,
    discountedPrice,
    discountedLpPrice,
    discountedVePrice,
    refetchBalances: () => {
      refetchPaymentBalance();
      refetchOptionBalance();
    },
    isFetchingBalances: isFetchingPaymentBalance || isFetchingOptionBalance,
  };
}
