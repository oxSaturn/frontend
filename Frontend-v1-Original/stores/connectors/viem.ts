import {
  createPublicClient,
  http,
  webSocket,
  fallback,
  ContractFunctionConfig,
  MulticallParameters,
} from "viem";
import { canto } from "viem/chains";
import { CONTRACTS } from "../constants/constants";

const dexvaults = http("https://canto.dexvaults.com");
const dexvaultsWS = webSocket("wss://canto.dexvaults/ws");
const plexnode = http("https://mainnode.plexnode.org:8545");
const nodestake = http("https://jsonrpc.canto.nodestake.top");
const slingshot = http("https://canto.slingshot.finance");
const chandrastation = http("https://canto.evm.chandrastation.com/");
// going to remove neobase because it sends back empty data when can't fetch, this breaks the fallback
// const neobase = http("https://canto.neobase.one");

const client = createPublicClient({
  chain: canto,
  transport: fallback(
    [dexvaults, dexvaultsWS, plexnode, nodestake, slingshot, chandrastation],
    {
      rank: {
        interval: 30_000,
      },
    }
  ),
});

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    result.push(chunk);
  }
  return result;
}

export async function multicallChunks<
  TContracts extends ContractFunctionConfig[],
  TAllowFailure extends boolean = true
>(chunks: MulticallParameters<TContracts, TAllowFailure>["contracts"][]) {
  let result = [];

  if (chunks.length === 1) {
    const chunkResult = await client.multicall({
      allowFailure: false,
      multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
      contracts: chunks[0],
    });
    return chunkResult;
  }

  for (const chunk of chunks) {
    const chunkResult = await client.multicall({
      allowFailure: false,
      multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
      contracts: chunk,
    });
    result.push(chunkResult);
  }
  return result.flat();
}

export default client;
