import { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, formatEther, http } from "viem";
import { fantom } from "viem/chains";

import { CONTRACTS } from "../../stores/constants/constants";
import { veBoosterABI } from "../../stores/abis/veBoosterABI";

const FROM_BLOCK = 66450156n;
const BOOSTED_FACTOR = 0.01;
const BOOSTED_LOADED = 5_263.157895;
const AIRDROP_SUPPLY = 90_000;

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
  const { address }: { address: `0x${string}` } = JSON.parse(req.body);

  const filter = await client.createContractEventFilter({
    address: CONTRACTS.VE_BOOSTER_ADRRESS,
    abi: veBoosterABI,
    fromBlock: FROM_BLOCK,
    toBlock: "latest",
    eventName: "Boosted",
  });

  const events = await client.getFilterLogs({ filter });

  const data = [];

  for (const event of events) {
    data.push({
      ...event.args,
      formattedAmount: formatEther(event.args._totalLocked ?? 0n),
    });
  }

  const filtered = data.filter(
    (d) => d._locker?.toLowerCase() === address.toLowerCase()
  );

  if (filtered.length === 0) {
    rs.status(200).json(0);
    return;
  }

  const totalLocked = filtered.reduce((acc, curr) => {
    return acc + Number(+curr.formattedAmount);
  }, 0);

  const boostedAmount = totalLocked * BOOSTED_FACTOR;

  const eligible = (boostedAmount / BOOSTED_LOADED) * AIRDROP_SUPPLY;

  rs.status(200).json(eligible);
}
