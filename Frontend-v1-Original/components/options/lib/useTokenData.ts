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
} from "../../../lib/wagmiGen";

export function useTokenData() {
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
  return {
    optionTokenSymbol: optionTokenSymbol ?? "oFLOW",
    paymentTokenSymbol: paymentTokenSymbol ?? "WPLS",
    paymentTokenDecimals: paymentTokenDecimals ?? 18,
    underlyingTokenSymbol: underlyingTokenSymbol ?? "FLOW",
    paymentBalance,
    optionBalance,
    optionPrice,
    discountedPrice,
    refetchBalances: () => {
      refetchPaymentBalance();
      refetchOptionBalance();
    },
    isFetchingBalances: isFetchingPaymentBalance || isFetchingOptionBalance,
  };
}
