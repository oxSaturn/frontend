import { defineConfig } from "@wagmi/cli";
import { react } from "@wagmi/cli/plugins";
import { erc20ABI } from "wagmi";

import { airdropClaimABI, stakeFvmABI } from "./stores/abis/abis";
import { PRO_OPTIONS } from "./stores/constants/constants";
import { flowConvertorABI } from "./stores/abis/flowConvertorABI";
import { STAKING_ADDRESS } from "./stores/constants/contracts";

export default defineConfig({
  out: "./lib/wagmiGen.ts",
  contracts: [
    {
      name: "AirdropClaim",
      abi: airdropClaimABI,
      address: "0xCEE59eb1E4e28F50D90Bf4897ca1a84d6552AA21",
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
      name: "StakeFvm",
      abi: stakeFvmABI,
      address: STAKING_ADDRESS,
    },
  ],
  plugins: [react()],
});
