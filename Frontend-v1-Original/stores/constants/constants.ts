import BigNumber from "bignumber.js";
import { fantom } from "wagmi/chains";

import { maxxingGaugeABI, optionTokenABI } from "../abis/abis";

import * as contracts from "./contracts";
import * as queryKeys from "./queryKeys";

const config = {
  [fantom.id]: {
    scan: "https://ftmscan.com/",
    contracts: contracts,
    nativeETH: {
      address: contracts.ETH_ADDRESS,
      decimals: contracts.ETH_DECIMALS,
      logoURI: contracts.ETH_LOGO,
      name: contracts.ETH_NAME,
      symbol: contracts.ETH_SYMBOL,
      chainId: fantom.id,
      local: false,
      balance: "0",
    },
    wNativeAddress: contracts.WETH_ADDRESS,
    wNativeSymbol: contracts.WETH_SYMBOL,
    wNativeABI: contracts.WETH_ABI,
  },
};

export const ETHERSCAN_URL = config[fantom.id].scan;

export const CONTRACTS = config[fantom.id].contracts;
export const PRO_OPTIONS = {
  optionTokenABI: optionTokenABI,
  maxxingGaugeABI: maxxingGaugeABI,
  oFVM: {
    tokenAddress: "0xfEFBC02930D389E624B56053E345Cd848729BF93",
  },
} as const;

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1).toFixed(0);
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const NATIVE_TOKEN = config[fantom.id].nativeETH;
export const W_NATIVE_ADDRESS = config[fantom.id].wNativeAddress;
export const W_NATIVE_SYMBOL = config[fantom.id].wNativeSymbol;
export const W_NATIVE_ABI = config[fantom.id].wNativeABI;

export const PAIR_DECIMALS = 18;
export const QUERY_KEYS = queryKeys;
