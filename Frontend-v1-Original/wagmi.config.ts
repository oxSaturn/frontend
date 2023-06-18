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
      address: "0x385B28A706FEd830E89Fe9293f66764C62F92f6c",
    },
    {
      name: "AggMaxxing",
      abi: aggMaxxingABI,
      address: "0x45298B51915fbC1Fa30573B67f25d7Efe072a129",
    },
  ],
  plugins: [react()],
});
