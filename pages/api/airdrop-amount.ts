import { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, formatEther, http } from "viem";
import { fantom } from "viem/chains";

import { CONTRACTS } from "../../stores/constants/constants";

const FROM_BLOCK = 66450156;
const BOOSTED_FACTOR = 1.01;
const BOOSTED_LOADED = 5_263.157895;
const AIRDROP_SUPPLY = 90_000;
const RPC_STEP = 1_024;

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

  const toBlock = await client.getBlockNumber();

  const ranges: bigint[][] = [];

  for (let i = FROM_BLOCK; i <= Number(toBlock); i += RPC_STEP) {
    const rangeEnd = Math.min(i + RPC_STEP - 1, Number(toBlock));
    ranges.push([BigInt(i), BigInt(rangeEnd)]);
  }

  const _logs = await Promise.all(
    ranges.map(async ([from, to]) => {
      const events = await client.getLogs({
        address: CONTRACTS.VE_BOOSTER_ADRRESS,
        fromBlock: from,
        toBlock: to,
        event: {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "_timestamp",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "_totalLocked",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "address",
              name: "_locker",
              type: "address",
            },
          ],
          name: "Boosted",
          type: "event",
        },
      });
      return events;
    })
  );

  const logs = _logs.flat();
  const data = [];

  for (const event of logs) {
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
    return acc + Number(curr.formattedAmount);
  }, 0);

  const boostedAmount = totalLocked / BOOSTED_FACTOR;

  const eligible = (boostedAmount / BOOSTED_LOADED) * AIRDROP_SUPPLY;

  rs.status(200).json(eligible);
}
