import { parseEther } from "viem";
import { create } from "zustand";

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
