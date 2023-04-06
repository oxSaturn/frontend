import type { NextApiRequest, NextApiResponse } from "next";
import {
  createPublicClient,
  http,
  fallback,
  formatUnits,
  formatEther,
  parseUnits,
  parseEther,
} from "viem";
import { canto } from "viem/chains";
import { CONTRACTS } from "../../stores/constants/constants";
import {
  Bribe,
  GovToken,
  Pair,
  VeDistReward,
  VeToken,
  VestNFT,
  hasGauge,
} from "../../stores/types/types";

const dexvaults = http("https://canto.dexvaults.com");
const plexnode = http("https://mainnode.plexnode.org:8545");
const nodestake = http("https://jsonrpc.canto.nodestake.top");
const slingshot = http("https://canto.slingshot.finance");
const chandrastation = http("https://canto.evm.chandrastation.com/");

const publicClient = createPublicClient({
  chain: canto,
  transport: fallback(
    [dexvaults, plexnode, nodestake, slingshot, chandrastation],
    {
      rank: {
        interval: 10_000,
      },
    }
  ),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    account,
    pairs,
    tokenID,
    veToken,
    govToken,
    vestNFTs,
  }: {
    account: { address: `0x${string}` };
    pairs: Pair[];
    tokenID: string;
    veToken: VeToken;
    govToken: GovToken;
    vestNFTs: VestNFT[];
  } = JSON.parse(req.body);

  try {
    const filteredPairs = [...pairs.filter(hasGauge)];

    const filteredPairs2 = [...pairs.filter(hasGauge)];

    let veDistReward: VeDistReward[] = [];

    let filteredBribes: Pair[] = []; // Pair with rewardType set to "Bribe"

    if (tokenID && vestNFTs.length > 0) {
      const bribesEarned = await Promise.all(
        filteredPairs.map(async (pair) => {
          let bribesEarned: Bribe[] = [];

          for (const bribe of pair.gauge.bribes) {
            const earned = await publicClient.readContract({
              address: pair.gauge.wrapped_bribe_address,
              abi: CONTRACTS.BRIBE_ABI,
              functionName: "earned",
              args: [bribe.token.address, BigInt(tokenID)],
            });

            bribe.earned = formatUnits(earned, bribe.token.decimals);
            bribesEarned.push(bribe);
          }

          pair.gauge.bribesEarned = bribesEarned;

          return pair;
        })
      );

      filteredBribes = bribesEarned
        .filter((pair) => {
          if (
            pair.gauge &&
            pair.gauge.bribesEarned &&
            pair.gauge.bribesEarned.length > 0
          ) {
            let shouldReturn = false;

            for (let i = 0; i < pair.gauge.bribesEarned.length; i++) {
              if (
                pair.gauge.bribesEarned[i].earned &&
                parseUnits(
                  pair.gauge.bribesEarned[i].earned as `${number}`,
                  pair.gauge.bribes[i].token.decimals
                ) > 0
              ) {
                shouldReturn = true;
              }
            }

            return shouldReturn;
          }

          return false;
        })
        .map((pair) => {
          pair.rewardType = "Bribe";
          return pair;
        });

      const veDistEarned = await publicClient.readContract({
        address: CONTRACTS.VE_DIST_ADDRESS,
        abi: CONTRACTS.VE_DIST_ABI,
        functionName: "claimable",
        args: [BigInt(tokenID)],
      });

      let theNFT = vestNFTs.filter((vestNFT) => {
        return vestNFT.id == tokenID;
      });

      if (veDistEarned > 0) {
        veDistReward.push({
          token: theNFT[0],
          lockToken: veToken,
          rewardToken: govToken,
          earned: formatUnits(veDistEarned, govToken.decimals),
          rewardType: "Distribution",
        });
      }
    }

    const rewardsEarned = await Promise.all(
      filteredPairs2.map(async (pair) => {
        const earned = await publicClient.readContract({
          address: pair.gauge.address,
          abi: CONTRACTS.GAUGE_ABI,
          functionName: "earned",
          args: [CONTRACTS.GOV_TOKEN_ADDRESS, account.address],
        });

        pair.gauge.rewardsEarned = formatEther(earned);
        return pair;
      })
    );

    const filteredRewards: Pair[] = []; // Pair with rewardType set to "Reward"
    for (let j = 0; j < rewardsEarned.length; j++) {
      let pair = Object.assign({}, rewardsEarned[j]);
      if (
        pair.gauge &&
        pair.gauge.rewardsEarned &&
        parseEther(pair.gauge.rewardsEarned as `${number}`) > 0
      ) {
        pair.rewardType = "Reward";
        filteredRewards.push(pair);
      }
    }

    const rewards = {
      bribes: filteredBribes,
      rewards: filteredRewards,
      veDist: veDistReward,
    };

    res.status(200).json({ rewards });
  } catch (e) {
    res.status(400);
  }
}
