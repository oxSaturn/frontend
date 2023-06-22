import { formatEther, parseEther } from "viem";

import {
  useOptionTokenGetDiscountedPrice,
  useOptionTokenGetPaymentTokenAmountForExerciseLp,
} from "../../../lib/wagmiGen";

import { INPUT, isValidInput, useInputs } from "./useInputs";

export function useAmountToPayLiquid() {
  const { option, payment, activeInput, setOption, setPayment } = useInputs();
  const maxPayment = (parseFloat(payment) * 1.01).toString();

  const { isFetching: isFetchingPaymentForOption } =
    useOptionTokenGetDiscountedPrice({
      args: [isValidInput(option) ? parseEther(option as `${number}`) : 0n],
      enabled: activeInput === INPUT.OPTION && isValidInput(option),
      onSuccess: (amountPaymentForOption) => {
        if (isValidInput(option) && activeInput === INPUT.OPTION) {
          setPayment(formatEther(amountPaymentForOption));
        }
      },
    });

  const { isFetching: isFetchingOptionDiscountedPrice } =
    useOptionTokenGetDiscountedPrice({
      args: [parseEther("1")],
      enabled:
        activeInput === INPUT.PAYMENT &&
        isValidInput(payment) &&
        isValidInput(maxPayment),
      scopeKey: `oneOptionPrice-${INPUT.PAYMENT}-${payment}`,
      onSuccess: (oneOptionPrice) => {
        if (
          isValidInput(payment) &&
          isValidInput(maxPayment) &&
          activeInput === INPUT.PAYMENT
        ) {
          const amountOptionForPayment =
            parseFloat(payment) / parseFloat(formatEther(oneOptionPrice));
          setOption(amountOptionForPayment.toString());
        }
      },
    });

  return {
    isFetching: isFetchingPaymentForOption || isFetchingOptionDiscountedPrice,
  };
}

export function useAmountToPayLP(lpDiscount: number) {
  const { option, activeInput, setPayment } = useInputs();

  const {
    isFetching: isFetchingPaymentTokenAmountForOption,
    data: paymentAndAddLiquidityAmounts,
  } = useOptionTokenGetPaymentTokenAmountForExerciseLp({
    args: [
      isValidInput(option) ? parseEther(option as `${number}`) : 0n,
      BigInt(100 - lpDiscount),
    ],
    enabled: activeInput === INPUT.OPTION && isValidInput(option),
    onSuccess: ([paymentAmount, addLiquidityAmount]) => {
      if (isValidInput(option) && activeInput === INPUT.OPTION) {
        setPayment(formatEther(paymentAmount + addLiquidityAmount));
      }
    },
    cacheTime: 0,
  });

  return {
    isFetching: isFetchingPaymentTokenAmountForOption,
    paymentAmount: paymentAndAddLiquidityAmounts
      ? formatEther(paymentAndAddLiquidityAmounts[0])
      : undefined,
    addLiquidityAmount: paymentAndAddLiquidityAmounts
      ? formatEther(paymentAndAddLiquidityAmounts[1])
      : undefined,
  };
}
