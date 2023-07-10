import { defineConfig } from "@wagmi/cli";
import { react } from "@wagmi/cli/plugins";
import { erc20ABI } from "wagmi";

import { airdropClaimABI } from "./stores/abis/abis";
import { PRO_OPTIONS } from "./stores/constants/constants";
import { flowConvertorABI } from "./stores/abis/flowConvertorABI";

export default defineConfig({
  out: "./lib/wagmiGen.ts",
  contracts: [
    {
      name: "AirdropClaim",
      abi: airdropClaimABI,
      address: "0x3339ab188839C31a9763352A5a0B7Fb05876BC44",
    },
    {
      name: "ERC20",
      abi: erc20ABI,
    },
    {
      name: "OptionToken",
      abi: PRO_OPTIONS.optionTokenABI,
      address: PRO_OPTIONS.oFVM.tokenAddress,
    },
    {
      name: "MaxxingGauge",
      abi: PRO_OPTIONS.maxxingGaugeABI,
    },
    {
      name: "Convertor",
      abi: flowConvertorABI,
    },
  ],
  plugins: [react()],
});
