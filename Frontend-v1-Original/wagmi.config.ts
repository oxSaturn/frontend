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
      address: "0x423EFf6cE113852166A92ac314f3eA0e4Dcf1944",
    },
    {
      name: "AggMaxxing",
      abi: aggMaxxingABI,
      address: "0x80AEDb1d9dDf502CCF08B949165214E017d22c54",
    },
  ],
  plugins: [react()],
});
