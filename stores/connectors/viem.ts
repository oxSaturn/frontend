import {
  createPublicClient,
  http,
  ContractFunctionConfig,
  MulticallParameters,
  fallback,
} from "viem";
import { createConfig, configureChains } from "wagmi";
import { jsonRpcProvider } from "@wagmi/core/providers/jsonRpc";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  walletConnectWallet,
  rabbyWallet,
  metaMaskWallet,
} from "@rainbow-me/rainbowkit/wallets";

import { chainToConnect } from "../constants/constants";

const publicNodeRpc = http("https://mainnet.base.org");
const blockPiRpc = http("https://base.blockpi.network/v1/rpc/public");
const blastRpc = http("https://base-mainnet.public.blastapi.io");
const devAccessRpc = http("https://developer-access-mainnet.base.org");

// used in store for reading blockchain
const client = createPublicClient({
  chain: chainToConnect,
  transport: fallback([publicNodeRpc, devAccessRpc, blockPiRpc, blastRpc]),
  batch: {
    multicall: true,
  },
});

// rainbow kit set up
const { chains, publicClient } = configureChains(
  [chainToConnect],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: "https://mainnet.base.org",
      }),
    }),
    jsonRpcProvider({
      rpc: () => ({
        http: "https://base.blockpi.network/v1/rpc/public",
      }),
    }),
    jsonRpcProvider({
      rpc: () => ({
        http: "https://base-mainnet.public.blastapi.io",
      }),
    }),
    jsonRpcProvider({
      rpc: () => ({
        http: "https://developer-access-mainnet.base.org",
      }),
    }),
  ]
);

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;
// we don't really have NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID under testing environment
let wallets = [rabbyWallet({ chains })];
if (projectId) {
  wallets = [
    ...wallets,
    metaMaskWallet({ projectId, chains }),
    walletConnectWallet({
      projectId,
      chains,
    }),
  ];
}
const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets,
  },
]);

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
  TAllowFailure extends boolean = true,
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
        contracts: chunk,
      });
      return chunkResult;
    })
  );
  return promises.flat();
}

export { chains };
export default client;
