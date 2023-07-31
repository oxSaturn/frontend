import { NextApiRequest, NextApiResponse } from "next";
import dayjs from "dayjs";
import { createPublicClient, http } from "viem";
import { fantom } from "viem/chains";

import { PRO_OPTIONS } from "../../stores/constants/constants";

const GOV_TOKEN_GAUGE_ADDRESS = "0xa3643a5d5b672a267199227cd3e95ed0b41dbd52";

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
    address: PRO_OPTIONS.oFVM.tokenAddress,
    abi: PRO_OPTIONS.optionTokenABI,
    fromBlock: 64965262n,
    toBlock: "latest",
  });

  const events = await client.getFilterLogs({ filter });

  const data: {
    sender: `0x${string}` | undefined;
  }[] = [];

  for (const event of events) {
    if (event.eventName === "ExerciseLp") {
      data.push({
        sender: (
          event.args as {
            sender?: `0x${string}` | undefined;
            recipient?: `0x${string}` | undefined;
            amount?: bigint | undefined;
            paymentAmount?: bigint | undefined;
          }
        ).sender,
      });
    }
  }

  const addys = new Set(data.map((d) => d.sender!));

  const res = await Promise.all(
    [...addys].map(async (d) => {
      const lockEnd = await client.readContract({
        address: GOV_TOKEN_GAUGE_ADDRESS,
        abi: PRO_OPTIONS.maxxingGaugeABI,
        functionName: "lockEnd",
        args: [d!],
      });

      return {
        sender: d,
        lockTime: dayjs.unix(Number(lockEnd)).diff(dayjs(), "day"),
      };
    })
  );

  const average =
    res.reduce((acc, curr) => {
      if (curr.lockTime < 0) return acc;
      return acc + curr.lockTime;
    }, 0) / res.length;

  const sortedLockTimes = res
    .map((r) => {
      if (r.lockTime < 0) return 0;
      return r.lockTime;
    })
    .sort((a, b) => a - b);
  const midpoint = Math.floor(sortedLockTimes.length / 2);
  const median =
    sortedLockTimes.length % 2 === 1
      ? sortedLockTimes[midpoint]
      : (sortedLockTimes[midpoint - 1] + sortedLockTimes[midpoint]) / 2;

  rs.status(200).json({ median: median.toFixed(), average: average.toFixed() });
}
