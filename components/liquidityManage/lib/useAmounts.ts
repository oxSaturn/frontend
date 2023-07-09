import { create } from "zustand";

interface UseAmounts {
  amount0: string;
  amount1: string;
  setAmount0: (_amount: string) => void;
  setAmount1: (_amount: string) => void;
  activeInput: "0" | "1";
  setActiveInput: (_activeInput: "0" | "1") => void;
}

export const useAmounts = create<UseAmounts>()((set) => ({
  amount0: "",
  amount1: "",
  activeInput: "0",
  setAmount0: (amount0: string) => set({ amount0 }),
  setAmount1: (amount1: string) => set({ amount1 }),
  setActiveInput: (activeInput: "0" | "1") => set({ activeInput }),
}));
