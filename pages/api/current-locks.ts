import { NextApiRequest, NextApiResponse } from "next";
import dayjs from "dayjs";
import { createPublicClient, http } from "viem";

import { PRO_OPTIONS, chainToConnect } from "../../stores/constants/constants";

const FROM_BLOCK = 64965262; // gov option token deployment
const RPC_STEP = 10_000;

const rpc = http("https://rpc.fantom.network/");

const client = createPublicClient({
  chain: chainToConnect,
  transport: rpc,
  batch: {
    multicall: true,
  },
});

export default async function handler(
  req: NextApiRequest,
  rs: NextApiResponse
) {
  const {
    gaugeAddress,
    optionTokenAddress,
  }: {
    gaugeAddress: `0x${string}`;
    optionTokenAddress: `0x${string}`;
  } = JSON.parse(req.body);

  const toBlock = await client.getBlockNumber();

  const ranges: bigint[][] = [];

  for (let i = FROM_BLOCK; i <= Number(toBlock); i += RPC_STEP) {
    const rangeEnd = Math.min(i + RPC_STEP - 1, Number(toBlock));
    ranges.push([BigInt(i), BigInt(rangeEnd)]);
  }

  const _logs = await Promise.all(
    ranges.map(async ([from, to]) => {
      const events = await client.getLogs({
        address: optionTokenAddress,
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
      address: gaugeAddress,
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
