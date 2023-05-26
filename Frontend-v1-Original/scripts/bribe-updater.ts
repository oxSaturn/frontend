import { createPublicClient, http, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { canto } from "viem/chains";

import { voterABI } from "../stores/abis/voterABI";
import { bribeFactoryABI } from "../stores/abis/bribeFactoryABI";
import { VOTER_ADDRESS } from "../stores/constants/contractsCanto";
import { ZERO_ADDRESS } from "../stores/constants/constants";
import { bribeABI } from "../stores/abis/bribeABI";

const MULTICALL_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

const PAIR_FACTORY = "0xF80909DF0A01ff18e4D37BF682E40519B21Def46";
const PAIR_FACTORY_ABI = [
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
] as const;

const newBribeABI = [
  {
    inputs: [{ internalType: "address[]", name: "tokens", type: "address[]" }],
    name: "updateRewardAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const XX_WXBF = "0x1E9C436a3F51b08F7BfAF8410465fCbBf7A0ae1C";

const client = createPublicClient({
  chain: canto,
  transport: http("https://velocimeter.tr.zone/"),
});

const account = privateKeyToAccount("0xxx");
const wClient = createWalletClient({
  account,
  chain: canto,
  transport: http("https://velocimeter.tr.zone/"),
});

async function main() {
  const pairsLength = await client.readContract({
    address: PAIR_FACTORY,
    abi: PAIR_FACTORY_ABI,
    functionName: "allPairsLength",
  });

  const pairs = await client.multicall({
    multicallAddress: MULTICALL_ADDRESS,
    allowFailure: false,
    contracts: Array.from({ length: Number(pairsLength) }, (_, i) => ({
      address: PAIR_FACTORY,
      abi: PAIR_FACTORY_ABI,
      functionName: "allPairs",
      args: [i],
    })),
  });

  for (const pair of pairs) {
    const gauge = await client.readContract({
      address: VOTER_ADDRESS,
      abi: voterABI,
      functionName: "gauges",
      args: [pair as `0x${string}`],
    });

    if (gauge !== ZERO_ADDRESS) {
      const bribe = await client.readContract({
        address: VOTER_ADDRESS,
        abi: voterABI,
        functionName: "external_bribes",
        args: [gauge],
      });

      const bribeContract = await client.readContract({
        address: XX_WXBF,
        abi: bribeFactoryABI,
        functionName: "oldBribeToNew",
        args: [bribe],
      });

      const bribeTokensLenght = await client.readContract({
        address: bribeContract,
        abi: bribeABI,
        functionName: "rewardsListLength",
      });

      const bribeTokens = await client.multicall({
        multicallAddress: MULTICALL_ADDRESS,
        allowFailure: false,
        contracts: Array.from({ length: Number(bribeTokensLenght) }, (_, i) => {
          return {
            address: bribeContract,
            abi: bribeABI,
            functionName: "rewards",
            args: [BigInt(i)],
          };
        }),
      });

      await wClient.writeContract({
        address: bribeContract,
        abi: newBribeABI,
        functionName: "updateRewardAmount",
        args: [bribeTokens],
      });
    }
  }
}

main();
