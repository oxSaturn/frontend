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

export function useTokenData(lpDiscount?: number) {
  const { address } = useAccount();
  const { data: optionTokenSymbol } = useOptionTokenSymbol();
  const { data: paymentTokenAddress } = useOptionTokenPaymentToken();
  const { data: underlyingTokenAddress } = useOptionTokenUnderlyingToken();
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
    args: [address!],
    enabled: !!address,
    select: (data) => formatEther(data),
  });

  const { data: optionPrice } = useOptionTokenGetTimeWeightedAveragePrice({
    args: [parseEther("1")],
    select: (data) => formatEther(data),
  });

  const { data: discountedPrice } = useOptionTokenGetDiscountedPrice({
    args: [parseEther("1")],
    select: (data) => formatEther(data),
  });
  const { data: discountedLpPrice } = useOptionTokenGetLpDiscountedPrice({
    args: [
      parseEther("1"),
      lpDiscount === undefined ? 100n : BigInt(100 - lpDiscount),
    ],
    select: (data) => formatEther(data),
    enabled: !!lpDiscount,
    cacheTime: 0,
  });
  const { data: discountedVePrice } = useOptionTokenGetVeDiscountedPrice({
    args: [parseEther("1")],
    select: (data) => formatEther(data),
  });
  return {
    optionTokenSymbol: optionTokenSymbol ?? "oFVM",
    paymentTokenSymbol: paymentTokenSymbol ?? "WFTM",
    paymentTokenDecimals: paymentTokenDecimals ?? 18,
    underlyingTokenSymbol: underlyingTokenSymbol ?? "FVM",
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
