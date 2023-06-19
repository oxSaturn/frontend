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
      address: "0x037F5312c09594b2eE1B05ADB8c91A355d682bb2",
    },
    {
      name: "AggMaxxing",
      abi: aggMaxxingABI,
      address: "0x7f64768f8234983364314ED782435870Be57300f",
    },
  ],
  plugins: [react()],
});
