import BigNumber from "bignumber.js";
import * as contractsTestnet from "./contractsGoerli";
import * as contractsCanto from "./contractsCanto";
import * as contracts from "./contracts";
import * as actions from "./actions";

import type { Contracts } from "../types/types";

let isCanto = process.env.NEXT_PUBLIC_CHAINID === "7700";
let isGoerli = process.env.NEXT_PUBLIC_CHAINID === "421613";
let scan = "https://arbiscan.io/";
let cont: Contracts = contracts;
let nativeETH = {
  address: cont.ETH_ADDRESS,
  decimals: cont.ETH_DECIMALS,
  logoURI: cont.ETH_LOGO,
  name: cont.ETH_NAME,
  symbol: cont.ETH_SYMBOL,
  chainId: 42161,
};
let wNativeAddress = cont.WETH_ADDRESS;

if (isGoerli) {
  scan = "https://goerli.arbiscan.io/";
  cont = contractsTestnet;
} else if (isCanto) {
  scan = "https://tuber.build/";
  cont = contractsCanto;
  nativeETH = {
    address: cont.CANTO_ADDRESS,
    decimals: cont.CANTO_DECIMALS,
    logoURI: cont.CANTO_LOGO,
    name: cont.CANTO_NAME,
    symbol: cont.CANTO_SYMBOL,
    chainId: 7700,
  };
  wNativeAddress = cont.WCANTO_ADDRESS;
}

export const ETHERSCAN_URL = scan;

export const CONTRACTS = cont;
export const ACTIONS = actions;

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1).toFixed(0);
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const NATIVE_TOKEN = nativeETH;
export const W_NATIVE_ADDRESS = wNativeAddress;

export const PAIR_DECIMALS = 18;
