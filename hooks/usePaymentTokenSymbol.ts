import { useErc20Symbol, useOptionTokenPaymentToken } from "../lib/wagmiGen";
import { PRO_OPTIONS } from "../stores/constants/constants";
import { GOV_TOKEN_SYMBOL } from "../stores/constants/contracts";

export function usePaymentTokenSymbol() {
  const { data: paymentTokenAddress } = useOptionTokenPaymentToken({
    address: PRO_OPTIONS[`o${GOV_TOKEN_SYMBOL}`].tokenAddress,
  });

  const { data: paymentTokenSymbol } = useErc20Symbol({
    address: paymentTokenAddress,
    enabled: !!paymentTokenAddress,
  });

  return paymentTokenSymbol;
}
