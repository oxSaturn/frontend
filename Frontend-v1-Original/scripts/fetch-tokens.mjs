/**
 * Fetches all LP tokens from Canto and fetches their info from Coingecko
 * and writes to `lp-tokens.json`
 * @example node scripts/fetch-tokens.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createPublicClient, http } from "viem";
import { canto } from "viem/chains";
const client = createPublicClient({
  chain: canto,
  transport: http(),
});
const pairFactoryAddress = "0xF80909DF0A01ff18e4D37BF682E40519B21Def46";
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
const multicallAddress = "0xcA11bde05977b3631167028862bE2a173976CA11";
const pairs = await client.multicall({
  multicallAddress,
  contracts: Array.from({ length: Number(pairsLength) }, (_, i) => ({
    address: pairFactoryAddress,
    abi,
    functionName: "allPairs",
    args: [i],
  })),
});
const lpTokens = pairs.map(({ result }) => result);
let tokens = await client.multicall({
  multicallAddress,
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
    `https://api.coingecko.com/api/v3/coins/canto/contract/${token}`
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
      links,
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
