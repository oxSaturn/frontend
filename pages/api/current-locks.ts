import { NextApiRequest, NextApiResponse } from "next";
import dayjs from "dayjs";
import { createPublicClient, http } from "viem";
import { fantom } from "viem/chains";

import { PRO_OPTIONS } from "../../stores/constants/constants";

const GOV_TOKEN_GAUGE_ADDRESS = "0xa3643a5d5b672a267199227cd3e95ed0b41dbd52";

const FROM_BLOCK = 64965262;
const RPC_STEP = 10_000;

const rpc = http("https://rpc.fantom.network/");

const client = createPublicClient({
  chain: fantom,
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
        address: PRO_OPTIONS.oFVM.tokenAddress,
        event: {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "sender",
              type: "address",
            },
            {
              indexed: true,
              internalType: "address",
              name: "recipient",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "paymentAmount",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "lpAmount",
              type: "uint256",
            },
          ],
          name: "ExerciseLp",
          type: "event",
        },
        fromBlock: from,
        toBlock: to,
      });
      return events;
    })
  );

  const logs = _logs.flat();

  const data: {
    sender: `0x${string}` | undefined;
  }[] = [];

  for (const event of logs) {
    data.push({
      sender: event.args.sender,
    });
  }

  const addys = new Set(data.map((d) => d.sender!));

  const lockends = await client.multicall({
    allowFailure: false,
    contracts: [...addys].map((d) => ({
      address: GOV_TOKEN_GAUGE_ADDRESS,
      abi: PRO_OPTIONS.maxxingGaugeABI,
      functionName: "lockEnd",
      args: [d!],
    })),
  });

  const average =
    lockends
      .map((lockEnd) => dayjs.unix(Number(lockEnd)).diff(dayjs(), "day"))
      .reduce((acc, curr) => {
        if (curr < 0) return acc;
        return acc + curr;
      }, 0) / lockends.length;

  rs.status(200).json(average.toFixed());
}
