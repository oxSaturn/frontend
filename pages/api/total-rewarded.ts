import { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, formatEther, http } from "viem";
import { fantom } from "wagmi/chains";

import { CONTRACTS, W_NATIVE_ADDRESS } from "../../stores/constants/constants";

interface DefiLlamaTokenPrice {
  coins: {
    [key: string]: {
      decimals: number;
      price: number;
      symbol: string;
      timestamp: number;
      confidence: number;
    };
  };
}

const blockPiRpc = http("https://fantom.blockpi.network/v1/rpc/public");

const client = createPublicClient({
  chain: fantom,
  transport: blockPiRpc,
  batch: {
    multicall: true,
  },
});

export default async function handler(
  req: NextApiRequest,
  rs: NextApiResponse
) {
  const filter = await client.createContractEventFilter({
    address: "0xa3643a5d5b672a267199227cd3e95ed0b41dbd52",
    abi: CONTRACTS.GAUGE_ABI,
    fromBlock: 64965262n,
    toBlock: "latest",
    eventName: "ClaimRewards",
  });

  const events = await client.getFilterLogs({ filter });

  const totalPayed = events.reduce((acc, curr) => {
    if (curr.args.reward === "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83") {
      return acc + parseFloat(formatEther(curr.args.amount ?? 0n));
    }
    return acc;
  }, 0);

  const nativePrice = await getDefillamaPriceInStables(
    W_NATIVE_ADDRESS as `0x${string}`
  );
  console.log(totalPayed);
  console.log(nativePrice);

  rs.status(200).json(totalPayed * nativePrice);
}

async function getDefillamaPriceInStables(tokenAddy: `0x${string}`) {
  const chainName = "fantom";
  const chainToken = `${chainName}:${tokenAddy.toLowerCase()}`;

  const res = await fetch(
    `https://coins.llama.fi/prices/current/${chainToken}`
  );
  const json = (await res.json()) as DefiLlamaTokenPrice;
  const price = json.coins[chainToken]?.price;

  if (price > 0) {
    return price;
  }

  return 0;
}
