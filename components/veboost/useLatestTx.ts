import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Tx {
  hash: `${string}` | null;
  amount: string;
  timestamp: string | undefined;
}

interface LatestTxsStore {
  latestTxs: Tx[];
  addTx: (_tx: Tx) => void;
  updateLatestTxs: () => void;
}

export const useLatestTxs = create<LatestTxsStore>()(
  persist(
    (set, get) => ({
      latestTxs: [],
      addTx: (_tx: Tx) => {
        if (get().latestTxs.length < 6) {
          set(() => ({ latestTxs: [...get().latestTxs, _tx] }));
        } else {
          const newTxs = [...get().latestTxs];
          newTxs.pop();
          newTxs.unshift(_tx);
          set(() => ({ latestTxs: newTxs }));
        }
      },
      updateLatestTxs: () => {},
    }),
    { name: "latestTxs" }
  )
);
