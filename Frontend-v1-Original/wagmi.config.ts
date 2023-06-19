import { defineConfig } from "@wagmi/cli";
import { react } from "@wagmi/cli/plugins";
import { erc20ABI } from "wagmi";

import { oAggABI, aggMaxxingABI } from "./stores/abis/abis";

export default defineConfig({
  out: "./lib/wagmiGen.ts",
  contracts: [
    {
      name: "ERC20",
      abi: erc20ABI,
    },
    {
      name: "oAGG",
      abi: oAggABI,
      address: "0x1bbd91715EBC03C9f073072eA2319ebF698917dE",
    },
    {
      name: "AggMaxxing",
      abi: aggMaxxingABI,
      address: "0x8189B5F1C389d715eBbF6beBb41c5C6Dfd6F664a",
    },
  ],
  plugins: [react()],
});

