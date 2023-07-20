import { create } from "zustand";
interface VotingState {
  isVoting: boolean;
  setIsVoting: (_isVoting: boolean) => void;
}
export const useIsVoting = create<VotingState>()((set) => ({
  isVoting: false,
  setIsVoting: (isVoting) => set({ isVoting }),
}));
