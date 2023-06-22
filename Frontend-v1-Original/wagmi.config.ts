import { defineConfig } from "@wagmi/cli";
import { react } from "@wagmi/cli/plugins";
import { erc20ABI } from "wagmi";

import { airdropClaimABI, oFlowABI } from "./stores/abis/abis";
import { PRO_OPTIONS } from "./stores/constants/constants";

export default defineConfig({
  out: "./lib/wagmiGen.ts",
  contracts: [
    {
      name: "WPLS",
      abi: erc20ABI,
      address: "0xA1077a294dDE1B09bB078844df40758a5D0f9a27",
    },
    {
      name: "oFLOW",
      abi: oFlowABI,
      address: "0x1Fc0A9f06B6E85F023944e74F70693Ac03fDC621",
    },
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
      address: PRO_OPTIONS.oFLOW.tokenAddress,
    },
    {
      name: "MaxxingGauge",
      abi: PRO_OPTIONS.maxxingGaugeABI,
      address: PRO_OPTIONS.oFLOW.gaugeAddress,
    },
  ],
  plugins: [react()],
});
