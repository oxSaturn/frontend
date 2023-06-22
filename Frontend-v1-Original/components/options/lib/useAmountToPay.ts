import { formatEther, formatUnits, parseEther } from "viem";

import {
  useOptionTokenGetDiscountedPrice,
  useOptionTokenGetPaymentTokenAmountForExerciseLp,
} from "../../../lib/wagmiGen";

import { INPUT, isValidInput, useInputs } from "./useInputs";
import { useTokenData } from "./useTokenData";

export function useAmountToPayLiquid() {
  const { option, payment, activeInput, setOption, setPayment } = useInputs();
  const maxPayment = (parseFloat(payment) * 1.01).toString();

  const { paymentTokenDecimals } = useTokenData();

  const { isFetching: isFetchingPaymentForOption } =
    useOptionTokenGetDiscountedPrice({
      args: [isValidInput(option) ? parseEther(option as `${number}`) : 0n],
      enabled: activeInput === INPUT.OPTION && isValidInput(option),
      onSuccess: (amountPaymentForOption) => {
        if (isValidInput(option) && activeInput === INPUT.OPTION) {
          setPayment(formatUnits(amountPaymentForOption, paymentTokenDecimals));
        }
      },
    });

  const { isFetching: isFetchingOptionDiscountedPrice } =
    useOptionTokenGetDiscountedPrice({
      args: [parseEther("1")],
      enabled:
        activeInput === INPUT.PAYMENT &&
        isValidInput(payment, paymentTokenDecimals) &&
        isValidInput(maxPayment, paymentTokenDecimals),
      scopeKey: `oneOptionPrice-${INPUT.PAYMENT}-${payment}`,
      onSuccess: (oneOptionPrice) => {
        if (
          isValidInput(payment, paymentTokenDecimals) &&
          isValidInput(maxPayment, paymentTokenDecimals) &&
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
  const { paymentTokenDecimals } = useTokenData();
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
        setPayment(
          formatUnits(paymentAmount + addLiquidityAmount, paymentTokenDecimals)
        );
      }
    },
    cacheTime: 0,
  });

  return {
    isFetching: isFetchingPaymentTokenAmountForOption,
    paymentAmount: paymentAndAddLiquidityAmounts
      ? formatUnits(paymentAndAddLiquidityAmounts[0], paymentTokenDecimals)
      : undefined,
    addLiquidityAmount: paymentAndAddLiquidityAmounts
      ? formatUnits(paymentAndAddLiquidityAmounts[1], paymentTokenDecimals)
      : undefined,
  };
}
