import {
  createPublicClient,
  http,
  webSocket,
  fallback,
  ContractFunctionConfig,
  MulticallParameters,
} from "viem";
import { canto } from "viem/chains";
import { createConfig, configureChains } from "wagmi";
import { jsonRpcProvider } from "@wagmi/core/providers/jsonRpc";
import { getDefaultWallets } from "@rainbow-me/rainbowkit";

import { CONTRACTS } from "../constants/constants";

// invalid chain id for signer error thrown by chandrastation for eth_getTransactionReceipt method
// neobase sends back empty data when can't fetch, this breaks the fallback
const dexvaults = http("https://canto.dexvaults.com");
const dexvaultsWS = webSocket("wss://canto.dexvaults/ws");
const plexnode = http("https://mainnode.plexnode.org:8545");
const nodestake = http("https://jsonrpc.canto.nodestake.top");
const slingshot = http("https://canto.slingshot.finance");
// const chandrastation = http("https://canto.evm.chandrastation.com/");
// const neobase = http("https://canto.neobase.one");

// used in store for reading blockchain
const client = createPublicClient({
  chain: canto,
  transport: fallback(
    [dexvaults, dexvaultsWS, plexnode, nodestake, slingshot],
    {
      rank: {
        interval: 30_000,
      },
    }
  ),
});

// rainbow kit set up
const { chains, publicClient } = configureChains(
  [canto],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: "https://canto.dexvaults.com",
        webSocket: "wss://canto.dexvaults/ws",
      }),
    }),
    jsonRpcProvider({
      rpc: () => ({
        http: "https://mainnode.plexnode.org:8545",
      }),
    }),
    jsonRpcProvider({
      rpc: () => ({
        http: "https://jsonrpc.canto.nodestake.top",
      }),
    }),
    jsonRpcProvider({
      rpc: () => ({
        http: "https://canto.slingshot.finance",
      }),
    }),
  ]
);
const { connectors } = getDefaultWallets({
  appName: "Velocimeter DEX",
  projectId: "aa9bd3a3710b5c6ac981c2d222a90d49",
  chains,
});

// config for wagmi provider
export const config = createConfig({
  autoConnect: true,
  publicClient,
  connectors,
});

/**
 * Function to chunk an array into smaller arrays
 * @param array array to chunk
 * @param chunkSize size of each chunk, defaults to 100
 * @returns array of arrays of chunkSize
 */
export function chunkArray<T>(array: T[], chunkSize = 100): T[][] {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    result.push(chunk);
  }
  return result;
}

/**
 * Function to call multicall in chunks
 * @param chunks array of arrays of contracts
 * @returns flattened result of multicall for all chunks
 */
export async function multicallChunks<
  TContracts extends ContractFunctionConfig[],
  TAllowFailure extends boolean = true
>(chunks: MulticallParameters<TContracts, TAllowFailure>["contracts"][]) {
  /* multicall can only handle 100 contracts at a time (approximately)
  so we chunk the array and call multicall multiple times
  we can call multicall in parallel
  (velodrome has 550 pairs. for bribes it will make 550*3=1650 calls, means 1650/100=16 chunks, which is 16 multicall calls.)
  */
  const promises = await Promise.all(
    chunks.map(async (chunk) => {
      const chunkResult = await client.multicall({
        allowFailure: false,
        multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
        contracts: chunk,
      });
      return chunkResult;
    })
  );
  return promises.flat();
}

export { chains };
export default client;
