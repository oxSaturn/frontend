import BigNumber from "bignumber.js";

import * as contractsTestnet from "./contractsGoerli";
import * as contractsCanto from "./contractsCanto";
import * as contracts from "./contracts";
import * as queryKeys from "./queryKeys";

let network: "7700" | "42161" | "421613" = "7700";

if (process.env.NEXT_PUBLIC_CHAINID === "42161") {
  network = "42161";
} else if (process.env.NEXT_PUBLIC_CHAINID === "421613") {
  network = "421613";
}

const config = {
  "7700": {
    scan: "https://tuber.build/",
    contracts: contractsCanto,
    nativeETH: {
      address: contractsCanto.CANTO_ADDRESS,
      decimals: contractsCanto.CANTO_DECIMALS,
      logoURI: contractsCanto.CANTO_LOGO,
      name: contractsCanto.CANTO_NAME,
      symbol: contractsCanto.CANTO_SYMBOL,
      chainId: 7700,
      local: false,
      balance: "0",
    },
    wNativeAddress: contractsCanto.WCANTO_ADDRESS,
    wNativeABI: contractsCanto.WCANTO_ABI,
  },
  "421613": {
    scan: "https://goerli.arbiscan.io/",
    contracts: contractsTestnet,
    nativeETH: {
      address: contractsTestnet.ETH_ADDRESS,
      decimals: contractsTestnet.ETH_DECIMALS,
      logoURI: contractsTestnet.ETH_LOGO,
      name: contractsTestnet.ETH_NAME,
      symbol: contractsTestnet.ETH_SYMBOL,
      chainId: 421613,
      local: false,
      balance: "0",
    },
    wNativeAddress: contractsTestnet.WETH_ADDRESS,
    wNativeABI: contractsTestnet.WETH_ABI,
  },
  "42161": {
    scan: "https://arbiscan.io/",
    contracts: contracts,
    nativeETH: {
      address: contracts.ETH_ADDRESS,
      decimals: contracts.ETH_DECIMALS,
      logoURI: contracts.ETH_LOGO,
      name: contracts.ETH_NAME,
      symbol: contracts.ETH_SYMBOL,
      chainId: 42161,
      local: false,
      balance: "0",
    },
    wNativeAddress: contractsTestnet.WETH_ADDRESS,
    wNativeABI: contractsTestnet.WETH_ABI,
  },
};

export const PRO_OPTIONS = {
  oAGG: {
    token: "0x29f9BF5e35Eb456b8b39580e66Aea73D5a988b04",
    gauge: "0xD43Ca05886068D20a3757B8bD4380a635911Dbf0",
  },
} as const;

export const ETHERSCAN_URL = config[network].scan;

export const CONTRACTS = config[network].contracts;
export const QUERY_KEYS = queryKeys;

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1).toFixed(0);
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const NATIVE_TOKEN = config[network].nativeETH;
export const W_NATIVE_ADDRESS = config[network].wNativeAddress;
export const W_NATIVE_ABI = config[network].wNativeABI;

export const PAIR_DECIMALS = 18;
