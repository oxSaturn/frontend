import BigNumber from "bignumber.js";
import { base } from "wagmi/chains";

import { maxxingGaugeABI, optionTokenABI } from "../abis/abis";

import * as contracts from "./contracts";
import * as queryKeys from "./queryKeys";

const config = {
  [base.id]: {
    scan: "https://basescan.org/",
    contracts: contracts,
    nativeETH: {
      address: contracts.ETH_ADDRESS,
      decimals: contracts.ETH_DECIMALS,
      logoURI: contracts.ETH_LOGO,
      name: contracts.ETH_NAME,
      symbol: contracts.ETH_SYMBOL,
      chainId: base.id,
      local: false,
      balance: "0",
    },
    wNativeAddress: contracts.WETH_ADDRESS,
    wNativeSymbol: contracts.WETH_SYMBOL,
    wNativeABI: contracts.WETH_ABI,
  },
};

export const EXPLORER_URL = config[base.id].scan;

export const CONTRACTS = config[base.id].contracts;
export const PRO_OPTIONS = {
  optionTokenABI: optionTokenABI,
  maxxingGaugeABI: maxxingGaugeABI,
  oBVM: {
    tokenAddress: "0x762eb51D2e779EeEc9B239FFB0B2eC8262848f3E",
  },
  oSMOOTH: {
    tokenAddress: "0x6c743ee9ef26b445d80f19cc783e89b43dcffa07",
  },
} as const;

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1).toFixed(0);
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const NATIVE_TOKEN = config[base.id].nativeETH;
export const W_NATIVE_ADDRESS = config[base.id].wNativeAddress;
export const W_NATIVE_SYMBOL = config[base.id].wNativeSymbol;
export const W_NATIVE_ABI = config[base.id].wNativeABI;

export const PAIR_DECIMALS = 18;
export const QUERY_KEYS = queryKeys;

export const MINTER_ROLE =
  "0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9";
