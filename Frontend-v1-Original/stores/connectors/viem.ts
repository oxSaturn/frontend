import {
  createPublicClient,
  http,
  ContractFunctionConfig,
  MulticallParameters,
  fallback,
} from "viem";
import { fantom } from "wagmi/chains";
import { createConfig, configureChains } from "wagmi";
import { jsonRpcProvider } from "@wagmi/core/providers/jsonRpc";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  walletConnectWallet,
  rabbyWallet,
  metaMaskWallet,
} from "@rainbow-me/rainbowkit/wallets";

const publicNodeRpc = http("https://fantom.publicnode.com");
const blastApiRpc = http("https://fantom-mainnet.public.blastapi.io");
const OneRpc = http("https://1rpc.io/ftm");
const ftmToolsRpc = http("https://rpc.ftm.tools");
const blockPiRpc = http("https://fantom.blockpi.network/v1/rpc/public");
const ankrRpc = http("https://rpc.ankr.com/fantom");

// used in store for reading blockchain
const client = createPublicClient({
  chain: fantom,
  transport: fallback([
    publicNodeRpc,
    blastApiRpc,
    OneRpc,
    ftmToolsRpc,
    blockPiRpc,
    ankrRpc,
  ]),
});

// rainbow kit set up
const { chains, publicClient } = configureChains(
  [fantom],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: "https://fantom.publicnode.com",
      }),
    }),
    jsonRpcProvider({
      rpc: () => ({
        http: "https://fantom-mainnet.public.blastapi.io",
      }),
    }),
    jsonRpcProvider({
      rpc: () => ({
        http: "https://1rpc.io/ftm",
      }),
    }),
    jsonRpcProvider({
      rpc: () => ({
        http: "https://rpc.ftm.tools",
      }),
    }),
    jsonRpcProvider({
      rpc: () => ({
        http: "https://fantom.blockpi.network/v1/rpc/public",
      }),
    }),
    jsonRpcProvider({
      rpc: () => ({
        http: "https://rpc.ankr.com/fantom",
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
        contracts: chunk,
      });
      return chunkResult;
    })
  );
  return promises.flat();
}

export { chains };
export default client;
