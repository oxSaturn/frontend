import { formatUnits, parseEther } from "viem";

import {
  useOptionTokenGetDiscountedPrice,
  useOptionTokenGetPaymentTokenAmountForExerciseLp,
  useOptionTokenGetVeDiscountedPrice,
} from "../../../lib/wagmiGen";
import { PRO_OPTIONS } from "../../../stores/constants/constants";

import { INPUT, isValidInput, useInputs } from "./useInputs";
import { useTokenData } from "./useTokenData";

export function useAmountToPayLiquid() {
  const { optionToken, option, payment, activeInput, setOption, setPayment } =
    useInputs();
  const maxPayment = (parseFloat(payment) * 1.01).toString();

  const { paymentTokenDecimals } = useTokenData();

  const { isFetching: isFetchingPaymentForOption } =
    useOptionTokenGetDiscountedPrice({
      address: PRO_OPTIONS[optionToken].tokenAddress,
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
      address: PRO_OPTIONS[optionToken].tokenAddress,
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
            parseFloat(payment) /
            parseFloat(formatUnits(oneOptionPrice, paymentTokenDecimals));
          setOption(amountOptionForPayment.toString());
        }
      },
    });

  return {
    isFetching: isFetchingPaymentForOption || isFetchingOptionDiscountedPrice,
  };
}

export function useAmountToPayVest() {
  const { optionToken, option, payment, activeInput, setOption, setPayment } =
    useInputs();
  const maxPayment = (parseFloat(payment) * 1.01).toString();

  const { paymentTokenDecimals } = useTokenData();

  const { isFetching: isFetchingPaymentForOption } =
    useOptionTokenGetVeDiscountedPrice({
      address: PRO_OPTIONS[optionToken].tokenAddress,
      args: [isValidInput(option) ? parseEther(option as `${number}`) : 0n],
      enabled: activeInput === INPUT.OPTION && isValidInput(option),
      onSuccess: (amountPaymentForOption) => {
        if (isValidInput(option) && activeInput === INPUT.OPTION) {
          setPayment(formatUnits(amountPaymentForOption, paymentTokenDecimals));
        }
      },
    });

  const { isFetching: isFetchingOptionDiscountedPrice } =
    useOptionTokenGetVeDiscountedPrice({
      address: PRO_OPTIONS[optionToken].tokenAddress,
      args: [parseEther("1")],
      enabled:
        activeInput === INPUT.PAYMENT &&
        isValidInput(payment, paymentTokenDecimals) &&
        isValidInput(maxPayment, paymentTokenDecimals),
      scopeKey: `oneOptionPriceVe-${INPUT.PAYMENT}-${payment}`,
      onSuccess: (oneOptionPrice) => {
        if (
          isValidInput(payment, paymentTokenDecimals) &&
          isValidInput(maxPayment, paymentTokenDecimals) &&
          activeInput === INPUT.PAYMENT
        ) {
          const amountOptionForPayment =
            parseFloat(payment) /
            parseFloat(formatUnits(oneOptionPrice, paymentTokenDecimals));
          setOption(amountOptionForPayment.toString());
        }
      },
    });

  return {
    isFetching: isFetchingPaymentForOption || isFetchingOptionDiscountedPrice,
  };
}

export function useAmountToPayLP(lpDiscount: number) {
  const { optionToken, option, activeInput, setPayment } = useInputs();
  const { paymentTokenDecimals } = useTokenData();
  const {
    isFetching: isFetchingPaymentTokenAmountForOption,
    data: paymentAndAddLiquidityAmounts,
  } = useOptionTokenGetPaymentTokenAmountForExerciseLp({
    address: PRO_OPTIONS[optionToken].tokenAddress,
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
