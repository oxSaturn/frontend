import { defineConfig } from "@wagmi/cli";
import { react } from "@wagmi/cli/plugins";
import { erc20ABI } from "wagmi";

import { airdropClaimABI, veBoosterABI } from "./stores/abis/abis";
import { flowConvertorABI } from "./stores/abis/flowConvertorABI";
import { CONTRACTS, PRO_OPTIONS } from "./stores/constants";

export default defineConfig({
  out: "./lib/wagmiGen.ts",
  contracts: [
    {
      name: "AirdropClaim",
      abi: airdropClaimABI,
      address: "0xC5d4E462b96cC73283EB452B15147c17Af413313",
    },
    {
      name: "ERC20",
      abi: erc20ABI,
    },
    {
      name: "OptionToken",
      abi: PRO_OPTIONS.optionTokenABI,
    },
    {
      name: "MaxxingGauge",
      abi: PRO_OPTIONS.maxxingGaugeABI,
    },
    {
      name: "Convertor",
      abi: flowConvertorABI,
    },
    {
      name: "veBooster",
      abi: veBoosterABI,
      address: CONTRACTS.VE_BOOSTER_ADRRESS,
    },
  ],
  plugins: [react()],
});
