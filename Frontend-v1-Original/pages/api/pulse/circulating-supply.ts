import type { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, http, formatUnits } from "viem";
import { pulsechain } from "viem/chains";
import Cors from "cors";

import { CONTRACTS } from "../../../stores/constants/constants";

const cors = Cors({
  methods: ["GET"],
});

const pulsechainRpc = http("https://rpc.pulsechain.com");

const publicClient = createPublicClient({
  chain: pulsechain,
  transport: pulsechainRpc,
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
    flowInRewardsDistributor,
    flowInAirdropClaim,
    flowInMintTank,
  ] = await publicClient.multicall({
    allowFailure: false,
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
        args: [CONTRACTS.VE_DIST_ADDRESS],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: ["0x3339ab188839C31a9763352A5a0B7Fb05876BC44"],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: ["0xbB7bbd0496c23B7704213D6dbbe5C39eF8584E45"],
      },
    ],
  });

  const circulatingSupply = formatUnits(
    totalSupply -
      lockedSupply -
      flowInMinter -
      flowInAirdropClaim -
      flowInRewardsDistributor -
      flowInMintTank,
    CONTRACTS.GOV_TOKEN_DECIMALS
  );

  res.setHeader("Cache-Control", "max-age=0, s-maxage=900");

  res.status(200).json(parseFloat(circulatingSupply));
}
