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
      address: "0xFc1C15E43abAeAB86571582D2A36BEB32324a1a8",
    },
    {
      name: "AggMaxxing",
      abi: aggMaxxingABI,
      address: "0xc98Ac135209dC7a99a4269Bd6Adc711F68A283a2",
    },
  ],
  plugins: [react()],
});
