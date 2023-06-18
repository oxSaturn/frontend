import { formatEther, parseEther } from "viem";
import { pulsechain } from "wagmi/chains";
import { create } from "zustand";

import { useOAggGetDiscountedPrice } from "../../../lib/wagmiGen";

export const INPUT = {
  OFLOW: "0",
  WPLS: "1",
} as const;

export type INPUT_TYPE = (typeof INPUT)[keyof typeof INPUT];

interface UseInputs {
  oFlow: string;
  WPLS: string;
  activeInput: INPUT_TYPE;
  setOFlow: (_oFlow: string) => void;
  setWpls: (_WPLS: string) => void;
  setActiveInput: (_activeInput: INPUT_TYPE) => void;
}

export const useInputs = create<UseInputs>((set) => ({
  oFlow: "",
  WPLS: "",
  activeInput: INPUT.OFLOW,
  setOFlow: (oFlow) => set({ oFlow }),
  setWpls: (WPLS) => set({ WPLS }),
  setActiveInput: (activeInput) => set({ activeInput }),
}));

export function useAmountToPay() {
  const { oFlow, WPLS, activeInput, setOFlow, setWpls } = useInputs();
  const maxPaymentSCanto = (parseFloat(WPLS) * 1.01).toString();

  const { isFetching: isFetchingSCantoForOBlotr } = useOAggGetDiscountedPrice({
    chainId: pulsechain.id,
    args: [isValidInput(oFlow) ? parseEther(oFlow as `${number}`) : 0n],
    enabled: activeInput === INPUT.OFLOW && isValidInput(oFlow),
    onSuccess: (amountSCantoForOBlotr) => {
      if (
        amountSCantoForOBlotr &&
        isValidInput(oFlow) &&
        activeInput === INPUT.OFLOW
      ) {
        setWpls(formatEther(amountSCantoForOBlotr));
      }
    },
  });

  const { isFetching: isFetchingOBlotrDiscountedPrice } =
    useOAggGetDiscountedPrice({
      chainId: pulsechain.id,
      args: [parseEther("1")],
      enabled:
        activeInput === INPUT.WPLS &&
        isValidInput(WPLS) &&
        isValidInput(maxPaymentSCanto),
      scopeKey: `oneOBlotrPrice-${INPUT.WPLS}-${WPLS}`,
      onSuccess: (oneOBlotrPrice) => {
        if (
          oneOBlotrPrice &&
          isValidInput(WPLS) &&
          isValidInput(maxPaymentSCanto) &&
          activeInput === INPUT.WPLS
        ) {
          const amountOBlotrForSCanto =
            parseFloat(WPLS) / parseFloat(formatEther(oneOBlotrPrice));
          setOFlow(amountOBlotrForSCanto.toString());
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
