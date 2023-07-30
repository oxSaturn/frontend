/**
 * Fetches all LP tokens from Canto and fetches their underlying tokens' info from Coingecko
 * and writes to `tokens.json`
 * @example node scripts/fetch-tokens.mjs
 */
import fs from "node:fs";
import path from "node:path";

import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const client = createPublicClient({
  chain: base,
  transport: http(),
});
const pairFactoryAddress = "0x472f3c3c9608fe0ae8d702f3f8a2d12c410c881a";
const abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "allPairs",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "allPairsLength",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
const pairsLength = await client.readContract({
  address: pairFactoryAddress,
  abi,
  functionName: "allPairsLength",
});
const pairs = await client.multicall({
  contracts: Array.from({ length: Number(pairsLength) }, (_, i) => ({
    address: pairFactoryAddress,
    abi,
    functionName: "allPairs",
    args: [i],
  })),
});
const lpTokens = pairs.map(({ result }) => result);
let tokens = await client.multicall({
  contracts: lpTokens
    .map((address) => [
      {
        address,
        abi: [
          {
            constant: true,
            inputs: [],
            name: "token0",
            outputs: [
              {
                internalType: "address",
                name: "",
                type: "address",
              },
            ],
            payable: false,
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "token0",
      },
      {
        address,
        abi: [
          {
            constant: true,
            inputs: [],
            name: "token1",
            outputs: [
              {
                internalType: "address",
                name: "",
                type: "address",
              },
            ],
            payable: false,
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "token1",
      },
    ])
    .flat(),
});
tokens = [...new Set(tokens.map((token) => token.result))];
// now we have a list of token addresses
// Public API has a rate limit of 10-30 calls/minute, and doesn't come with API key
// https://api.coingecko.com/api/v3/coins/canto/contract/0x7264610A66EcA758A8ce95CF11Ff5741E1fd0455
// e.g., {"status":{"error_code":429,"error_message":"You've exceeded the Rate Limit. Please visit https://www.coingecko.com/en/api/pricing to subscribe to our API plans for higher rate limits."}}
async function fetchTokenInfo(token) {
  // we'll fetch api from coingecko
  const json = await fetch(
    `https://api.coingecko.com/api/v3/coins/base/contract/${token}`
  ).then((res) => res.json());
  if (json.status?.error_code === 429) {
    // we've exceeded the rate limit, so we'll wait for 61 seconds, note that it's not that acurate in my test
    console.log("Rate limit exceeded, waiting for 61 seconds...");
    return new Promise((resolve) =>
      setTimeout(() => resolve(fetchTokenInfo(token)), 61000)
    );
  }
  if (json.error === "coin not found") {
    // this token is not on coingecko
    return null;
  }
  return json;
}
let json = {};
while (tokens.length) {
  let token = tokens.pop();
  token = token.toLowerCase();
  const info = await fetchTokenInfo(token);
  if (info) {
    const { id, links, name, symbol } = info;
    json[token] = {
      id,
      homepage: links.homepage?.[0],
      name,
      symbol,
    };
  } else {
    json[token] = null;
  }
}
// write to file
fs.writeFileSync(
  path.join(process.cwd(), "tokens.json"),
  JSON.stringify(json, null, 2)
);
