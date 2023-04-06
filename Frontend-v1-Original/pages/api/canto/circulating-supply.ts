import type { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, http, fallback, formatUnits } from "viem";
import { canto } from "viem/chains";
import { CONTRACTS, NATIVE_TOKEN } from "../../../stores/constants/constants";
import Cors from "cors";

const cors = Cors({
  methods: ["GET"],
});

const dexvaults = http("https://canto.dexvaults.com");
const plexnode = http("https://mainnode.plexnode.org:8545");
const nodestake = http("https://jsonrpc.canto.nodestake.top");
const slingshot = http("https://canto.slingshot.finance");
const neobase = http("https://canto.neobase.one");

const publicClient = createPublicClient({
  chain: canto,
  transport: fallback([dexvaults, plexnode, nodestake, slingshot, neobase], {
    rank: {
      interval: 30_000,
    },
  }),
});

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  const flowContract = {
    abi: CONTRACTS.GOV_TOKEN_ABI,
    address: CONTRACTS.GOV_TOKEN_ADDRESS,
  } as const;

  const [
    totalSupply,
    lockedSupply,
    flowInMinter,
    flowInMsig,
    flowInRewardsDistributor,
    flowInTimelockerController,
  ] = await publicClient.multicall({
    allowFailure: false,
    multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
    contracts: [
      {
        ...flowContract,
        functionName: "totalSupply",
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.VE_TOKEN_ADDRESS],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.MINTER_ADDRESS],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.MSIG_ADDRESS],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.VE_DIST_ADDRESS],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: ["0xd0cC9738866cd82B237A14c92ac60577602d6c18"],
      },
    ],
  });

  const circulatingSupply = formatUnits(
    totalSupply -
      lockedSupply -
      flowInMinter -
      flowInMsig -
      flowInRewardsDistributor -
      flowInTimelockerController,
    NATIVE_TOKEN.decimals
  );

  res.setHeader("Cache-Control", "max-age=0, s-maxage=900");

  res.status(200).json(parseFloat(circulatingSupply));
}
