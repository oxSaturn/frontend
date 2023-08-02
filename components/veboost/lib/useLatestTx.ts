import { getPublicClient } from "@wagmi/core";
import { formatEther } from "viem";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { CONTRACTS } from "../../../stores/constants/constants";

interface Tx {
  hash: `0x${string}` | null;
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
      version: 1,
      latestTxs: [],
      addTx: (tx: Tx) => {
        if (get().latestTxs.length < 6) {
          const newTxs = [...get().latestTxs];
          newTxs.unshift(tx);
          set(() => ({ latestTxs: newTxs }));
        } else {
          const newTxs = [...get().latestTxs];
          newTxs.pop();
          newTxs.unshift(tx);
          set(() => ({ latestTxs: newTxs }));
        }
      },
      updateLatestTxs: async () => {
        const client = getPublicClient();
        const latestBlock = await client.getBlockNumber();
        // most of providers are limit block range to 10k
        const range = latestBlock - 10_000n;
        const logs = await client.getLogs({
          address: CONTRACTS.VE_BOOSTER_ADRRESS,
          event: {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: "uint256",
                name: "_timestamp",
                type: "uint256",
              },
              {
                indexed: false,
                internalType: "uint256",
                name: "_totalLocked",
                type: "uint256",
              },
              {
                indexed: false,
                internalType: "address",
                name: "_locker",
                type: "address",
              },
            ],
            name: "Boosted",
            type: "event",
          },
          fromBlock: range,
          toBlock: latestBlock,
        });
        if (logs.length === 0) return;
        const sliced = logs.length > 6 ? logs.slice(-6) : logs;
        const latestTxs = sliced.reverse().map((log) => ({
          hash: log.transactionHash,
          amount: formatEther(log.args._totalLocked ?? 0n),
          timestamp: log.args._timestamp?.toString(),
        }));
        set(() => ({ latestTxs }));
      },
    }),
    {
      name: "latestTxs",
      version: 1,
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state.updateLatestTxs();
          }
        };
      },
    }
  )
);
