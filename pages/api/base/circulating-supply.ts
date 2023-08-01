import type { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, http, formatUnits } from "viem";
import { base } from "viem/chains";
import Cors from "cors";

import { CONTRACTS } from "../../../stores/constants/constants";

const cors = Cors({
  methods: ["GET"],
});

const publicClient = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org/"),
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
    flowInOptionToken1,
    flowInAirdropClaim,
    flowInMintTank,
    flowInMsig,
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
        args: [CONTRACTS.OPTION_TOKEN_ADDRESS],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.AIRDROP_CLAIM],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.MINT_TANK],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.MSIG_ADDRESS],
      },
    ],
  });
  const pairs = await publicClient.readContract({
    abi: CONTRACTS.FACTORY_ABI,
    address: CONTRACTS.FACTORY_ADDRESS,
    functionName: "allPairsLength",
  });
  const pairAddressesCall = Array.from({ length: Number(pairs) }, (_, i) => {
    return {
      abi: CONTRACTS.FACTORY_ABI,
      address: CONTRACTS.FACTORY_ADDRESS,
      functionName: "allPairs",
      args: [BigInt(i)],
    } as const;
  });
  const pairAddresses = await publicClient.multicall({
    allowFailure: false,
    contracts: pairAddressesCall,
  });

  const gaugesCall = pairAddresses.map(
    (pairAddress) =>
      ({
        abi: CONTRACTS.VOTER_ABI,
        address: CONTRACTS.VOTER_ADDRESS,
        functionName: "gauges",
        args: [pairAddress],
      }) as const
  );
  const gaugeAddresses = await publicClient.multicall({
    allowFailure: false,
    contracts: gaugesCall,
  });
  const gaugeBalances = await publicClient.multicall({
    allowFailure: false,
    contracts: gaugeAddresses.map((gaugeAddress) => ({
      ...flowContract,
      functionName: "balanceOf",
      args: [gaugeAddress],
    })),
  });
  const gaugeBalancesSum = (gaugeBalances as bigint[]).reduce(
    (acc, balance) => acc + balance,
    0n
  );
  const circulatingSupply = formatUnits(
    totalSupply -
      lockedSupply -
      flowInMinter -
      flowInAirdropClaim -
      flowInRewardsDistributor -
      flowInMintTank -
      flowInMsig -
      gaugeBalancesSum -
      flowInOptionToken1,
    CONTRACTS.GOV_TOKEN_DECIMALS
  );

  res.setHeader("Cache-Control", "max-age=0, s-maxage=900");

  res.status(200).json(parseFloat(circulatingSupply));
}
