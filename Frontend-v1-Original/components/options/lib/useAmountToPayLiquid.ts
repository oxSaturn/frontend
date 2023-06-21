import { formatEther, parseEther } from "viem";
import { pulsechain } from "wagmi/chains";

import { useOAggGetDiscountedPrice } from "../../../lib/wagmiGen";

import { INPUT, isValidInput, useInputs } from "./useInputs";

export function useAmountToPayLiquid() {
  const { option, payment, activeInput, setOption, setPayment } = useInputs();
  const maxPaymentSCanto = (parseFloat(payment) * 1.01).toString();

  const { isFetching: isFetchingSCantoForOBlotr } = useOAggGetDiscountedPrice({
    chainId: pulsechain.id,
    args: [isValidInput(option) ? parseEther(option as `${number}`) : 0n],
    enabled: activeInput === INPUT.OPTION && isValidInput(option),
    onSuccess: (amountSCantoForOBlotr) => {
      if (
        amountSCantoForOBlotr &&
        isValidInput(option) &&
        activeInput === INPUT.OPTION
      ) {
        setPayment(formatEther(amountSCantoForOBlotr));
      }
    },
  });

  const { isFetching: isFetchingOBlotrDiscountedPrice } =
    useOAggGetDiscountedPrice({
      chainId: pulsechain.id,
      args: [parseEther("1")],
      enabled:
        activeInput === INPUT.PAYMENT &&
        isValidInput(payment) &&
        isValidInput(maxPaymentSCanto),
      scopeKey: `oneOBlotrPrice-${INPUT.PAYMENT}-${payment}`,
      onSuccess: (oneOBlotrPrice) => {
        if (
          oneOBlotrPrice &&
          isValidInput(payment) &&
          isValidInput(maxPaymentSCanto) &&
          activeInput === INPUT.PAYMENT
        ) {
          const amountOBlotrForSCanto =
            parseFloat(payment) / parseFloat(formatEther(oneOBlotrPrice));
          setOption(amountOBlotrForSCanto.toString());
        }
      },
    });

  return {
    isFetching: isFetchingSCantoForOBlotr || isFetchingOBlotrDiscountedPrice,
  };
}
