import { useBalance, useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";

import {
  useOAggSymbol,
  useOAggPaymentToken,
  useOAggBalanceOf,
  useOAggGetDiscountedPrice,
  useOAggUnderlyingToken,
  useOAggGetTimeWeightedAveragePrice,
  useErc20Symbol,
} from "../../../lib/wagmiGen";
import { PRO_OPTIONS } from "../../../stores/constants/constants";

export function useTokenData() {
  const { address } = useAccount();
  const { data: optionTokenSymbol } = useOAggSymbol();
  const { data: paymentTokenAddress } = useOAggPaymentToken();
  const { data: underlyingTokenAddress } = useOAggUnderlyingToken();
  const { data: paymentTokenSymbol } = useErc20Symbol({
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
    token: PRO_OPTIONS.oAGG.paymentTokenAddress,
  });

  const {
    data: optionBalance,
    refetch: refetchOptionBalance,
    isFetching: isFetchingOptionBalance,
  } = useOAggBalanceOf({
    args: [address!],
    enabled: !!address,
    select: (data) => formatEther(data),
  });

  const { data: optionPrice } = useOAggGetTimeWeightedAveragePrice({
    args: [parseEther("1")],
    select: (data) => formatEther(data),
  });

  const { data: discountedPrice } = useOAggGetDiscountedPrice({
    args: [parseEther("1")],
    select: (data) => formatEther(data),
  });
  return {
    optionTokenSymbol: optionTokenSymbol ?? "oFLOW",
    paymentTokenSymbol: paymentTokenSymbol ?? "WPLS",
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
