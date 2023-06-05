import BigNumber from "bignumber.js";
import { pulsechain } from "wagmi/chains";

import * as contracts from "./contracts";
import * as actions from "./actions";

const config = {
  [pulsechain.id]: {
    scan: "https://tuber.build/",
    contracts: contracts,
    nativeETH: {
      address: contracts.ETH_ADDRESS,
      decimals: contracts.ETH_DECIMALS,
      logoURI: contracts.ETH_LOGO,
      name: contracts.ETH_NAME,
      symbol: contracts.ETH_SYMBOL,
      chainId: 7700,
    },
    wNativeAddress: contracts.WETH_ADDRESS,
    wNativeABI: contracts.WETH_ABI,
  },
};

export const ETHERSCAN_URL = config[pulsechain.id].scan;

export const CONTRACTS = config[pulsechain.id].contracts;
export const ACTIONS = actions;

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1).toFixed(0);
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const NATIVE_TOKEN = config[pulsechain.id].nativeETH;
export const W_NATIVE_ADDRESS = config[pulsechain.id].wNativeAddress;
export const W_NATIVE_ABI = config[pulsechain.id].wNativeABI;

export const PAIR_DECIMALS = 18;
