import { parseUnits } from "viem";
import { create } from "zustand";

import { PRO_OPTIONS } from "../../../stores/constants/constants";

type OptionToken = Exclude<
  keyof typeof PRO_OPTIONS,
  "optionTokenABI" | "maxxingGaugeABI"
>;

export const INPUT = {
  OPTION: "0",
  PAYMENT: "1",
} as const;

export type INPUT_TYPE = (typeof INPUT)[keyof typeof INPUT];

interface UseInputs {
  optionToken: OptionToken;
  option: string;
  payment: string;
  activeInput: INPUT_TYPE;
  setOptionToken: (_optionToken: OptionToken) => void;
  setOption: (_option: string) => void;
  setPayment: (_payment: string) => void;
  setActiveInput: (_activeInput: INPUT_TYPE) => void;
}

export const useInputs = create<UseInputs>((set) => ({
  optionToken: "oBVM",
  option: "",
  payment: "",
  activeInput: INPUT.OPTION,
  setOptionToken: (optionToken) => set({ optionToken }),
  setOption: (option) => set({ option }),
  setPayment: (payment) => set({ payment }),
  setActiveInput: (activeInput) => set({ activeInput }),
}));

export const isValidInput = (input: string, decimals = 18) => {
  if (input !== "" && !isNaN(+input) && parseFloat(input) !== 0) {
    try {
      const parsed = parseUnits(input, decimals);
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
