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
      address: "0x13661E41f6AFF14DE677bbD692601bE809a14F76",
    },
    {
      name: "AggMaxxing",
      abi: aggMaxxingABI,
      address: "0xE6BcBeD3EF839D6AC4EEfacc53bF0BAc0d4Bc384",
    },
  ],
  plugins: [react()],
});

