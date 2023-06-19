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
      address: "0xCd4169Bc507B5d3BCf249Ea694e303060f16604B",
    },
    {
      name: "AggMaxxing",
      abi: aggMaxxingABI,
      address: "0xEA6B142a52ce629bDabb1eD7caBa877C7416DdB9",
    },
  ],
  plugins: [react()],
});
