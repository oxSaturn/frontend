import { formatEther, parseEther } from "viem";
import { pulsechain } from "wagmi/chains";
import { create } from "zustand";

import { useOAggGetDiscountedPrice } from "../../../lib/wagmiGen";

export const INPUT = {
  OPTION: "0",
  PAYMENT: "1",
} as const;

export type INPUT_TYPE = (typeof INPUT)[keyof typeof INPUT];

interface UseInputs {
  option: string;
  payment: string;
  activeInput: INPUT_TYPE;
  setOption: (_oFlow: string) => void;
  setPayment: (_WPLS: string) => void;
  setActiveInput: (_activeInput: INPUT_TYPE) => void;
}

export const useInputs = create<UseInputs>((set) => ({
  option: "",
  payment: "",
  activeInput: INPUT.OPTION,
  setOption: (option) => set({ option }),
  setPayment: (payment) => set({ payment }),
  setActiveInput: (activeInput) => set({ activeInput }),
}));

export function useAmountToPay() {
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

export const isValidInput = (input: string) => {
  if (input !== "" && !isNaN(+input) && parseFloat(input) !== 0) {
    try {
      const parsed = parseEther(input as `${number}`);
      if (parsed === 0n) {
        return false;
      }
    } catch (e) {
      return false;
    }
    return true;
  }
  return false;
};
