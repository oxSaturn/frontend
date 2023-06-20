import {
  useOAggSymbol,
  useOAggPaymentToken,
  useErc20Symbol,
  useOAggUnderlyingToken,
} from "../../../lib/wagmiGen";

export function useTokenData() {
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
  return {
    optionTokenSymbol: optionTokenSymbol ?? "oFLOW",
    paymentTokenSymbol: paymentTokenSymbol ?? "WPLS",
    underlyingTokenSymbol: underlyingTokenSymbol ?? "FLOW",
  };
}
