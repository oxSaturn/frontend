import BigNumber from "bignumber.js";
import * as contractsTestnet from "./contractsCantoTestnet";
import * as contracts from "./contracts";
import * as actions from "./actions";

let isTestnet = process.env.NEXT_PUBLIC_CHAINID == 740; // 740 is canto testnet

let scan = "https://evm.explorer.canto.io/";
let cont = contracts;

if (isTestnet) {
  scan = "https://testnet-explorer.canto.neobase.one/";
  cont = contractsTestnet;
}

export const ETHERSCAN_URL = scan;

export const CONTRACTS = cont;
export const ACTIONS = actions;

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1).toFixed(0);
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
