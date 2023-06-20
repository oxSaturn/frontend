import { defineConfig } from "@wagmi/cli";
import { react } from "@wagmi/cli/plugins";
import { erc20ABI } from "wagmi";

import { oAggABI, aggMaxxingABI } from "./stores/abis/abis";
import { PRO_OPTIONS } from "./stores/constants/constants";

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
      address: PRO_OPTIONS.oAGG.token,
    },
    {
      name: "AggMaxxing",
      abi: aggMaxxingABI,
      address: PRO_OPTIONS.oAGG.gauge,
    },
  ],
  plugins: [react()],
});
