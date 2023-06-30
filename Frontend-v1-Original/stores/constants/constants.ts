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
  oFLOW: {
    tokenAddress: "0x767D9ad09e4E148e0Ae23Ea1F2dB04e5F0Cd2EdA",
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
