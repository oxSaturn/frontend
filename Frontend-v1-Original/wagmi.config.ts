import { defineConfig } from "@wagmi/cli";
import { react } from "@wagmi/cli/plugins";
import { erc20ABI } from "wagmi";

import { PRO_OPTIONS } from "./stores/constants/constants";

export default defineConfig({
  out: "./lib/wagmiGen.ts",
  contracts: [
    {
      name: "ERC20",
      abi: erc20ABI,
    },
    {
      name: "OptionToken",
      abi: PRO_OPTIONS.optionTokenABI,
      address: PRO_OPTIONS.oAGG.tokenAddress,
    },
    {
      name: "MaxxingGauge",
      abi: PRO_OPTIONS.maxxingGaugeABI,
      address: PRO_OPTIONS.oAGG.gaugeAddress,
    },
  ],
  plugins: [react()],
});
