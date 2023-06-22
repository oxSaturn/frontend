import BigNumber from "bignumber.js";
import { pulsechain } from "wagmi/chains";

import { maxxingGaugeABI, optionTokenABI } from "../abis/abis";

import * as contracts from "./contracts";
import * as queryKeys from "./queryKeys";

const config = {
  [pulsechain.id]: {
    scan: "https://scan.pulsechain.com/",
    contracts: contracts,
    nativeETH: {
      address: contracts.ETH_ADDRESS,
      decimals: contracts.ETH_DECIMALS,
      logoURI: contracts.ETH_LOGO,
      name: contracts.ETH_NAME,
      symbol: contracts.ETH_SYMBOL,
      chainId: 7700,
      local: false,
      balance: "0",
    },
    wNativeAddress: contracts.WETH_ADDRESS,
    wNativeSymbol: contracts.WETH_SYMBOL,
    wNativeABI: contracts.WETH_ABI,
  },
};

export const ETHERSCAN_URL = config[pulsechain.id].scan;

export const CONTRACTS = config[pulsechain.id].contracts;
export const PRO_OPTIONS = {
  optionTokenABI: optionTokenABI,
  maxxingGaugeABI: maxxingGaugeABI,
  oAGG: {
    tokenAddress: "0x37A95c04450785Fb59c35dFd58c9897e9D9A4232",
    gaugeAddress: "0xeEbE0be893fa3F98A045969BacC13846d1bc795A",
    paymentTokenAddress: "0x9f823d534954fc119e31257b3ddba0db9e2ff4ed",
  },
} as const;

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1).toFixed(0);
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const NATIVE_TOKEN = config[pulsechain.id].nativeETH;
export const W_NATIVE_ADDRESS = config[pulsechain.id].wNativeAddress;
export const W_NATIVE_SYMBOL = config[pulsechain.id].wNativeSymbol;
export const W_NATIVE_ABI = config[pulsechain.id].wNativeABI;

export const PAIR_DECIMALS = 18;
export const QUERY_KEYS = queryKeys;
