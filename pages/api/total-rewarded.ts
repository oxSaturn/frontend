import { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, formatEther, http } from "viem";
import { base } from "wagmi/chains";

import { W_NATIVE_ADDRESS } from "../../stores/constants/constants";

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

const GOV_TOKEN_GAUGE_ADDRESS = "0x3f5129112754d4fbe7ab228c2d5e312b2bc79a06";

const FROM_BLOCK = 1963125;
const RPC_STEP = 10_000;

const rpc = http("https://mainnet.base.org");

const client = createPublicClient({
  chain: base,
  transport: rpc,
  batch: {
    multicall: true,
  },
});

export default async function handler(
  req: NextApiRequest,
  rs: NextApiResponse
) {
  const toBlock = await client.getBlockNumber();

  const ranges: bigint[][] = [];

  for (let i = FROM_BLOCK; i <= Number(toBlock); i += RPC_STEP) {
    const rangeEnd = Math.min(i + RPC_STEP - 1, Number(toBlock));
    ranges.push([BigInt(i), BigInt(rangeEnd)]);
  }

  const _logs = await Promise.all(
    ranges.map(async ([from, to]) => {
      const events = await client.getLogs({
        address: GOV_TOKEN_GAUGE_ADDRESS,
        event: {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "from",
              type: "address",
            },
            {
              indexed: true,
              internalType: "address",
              name: "reward",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
          ],
          name: "ClaimRewards",
          type: "event",
        },
        fromBlock: from,
        toBlock: to,
      });
      return events;
    })
  );

  const logs = _logs.flat();

  const totalPayed = logs.reduce((acc, curr) => {
    if (curr.args.reward?.toLowerCase() === W_NATIVE_ADDRESS?.toLowerCase()) {
      return acc + parseFloat(formatEther(curr.args.amount ?? 0n));
    }
    return acc;
  }, 0);

  const nativePrice = await getDefillamaPriceInStables(
    W_NATIVE_ADDRESS as `0x${string}`
  );

  rs.status(200).json(totalPayed * nativePrice);
}

async function getDefillamaPriceInStables(tokenAddy: `0x${string}`) {
  const chainName = "base";
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
