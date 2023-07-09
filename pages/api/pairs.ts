import type { NextApiRequest, NextApiResponse } from "next";

import { Pair, RouteAsset } from "../../stores/types/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const data = await fetch(`${process.env.API}/api/v1/pairs`);

    const resJson = (await data.json()) as { data: Pair[] };

    const tokenPricesMap = new Map<string, number>();
    let tvl = 0;
    let tbv = 0;

    const noScamPairs = resJson.data.filter((pair) => {
      return !knownScamPairs.some(
        (scamPairAddress) =>
          scamPairAddress.toLowerCase() === pair.address.toLowerCase()
      );
    });

    for (const pair of noScamPairs) {
      if (!tokenPricesMap.has(pair.token0.address.toLowerCase())) {
        tokenPricesMap.set(
          pair.token0.address.toLowerCase(),
          (pair.token0 as RouteAsset).price
        );
      }
      if (!tokenPricesMap.has(pair.token1.address.toLowerCase())) {
        tokenPricesMap.set(
          pair.token1.address.toLowerCase(),
          (pair.token1 as RouteAsset).price
        );
      }
      tvl += pair.tvl;
      tbv += pair.gauge?.tbv ?? 0;
    }

    res.status(200).json({
      data: noScamPairs,
      prices: [...tokenPricesMap.entries()],
      tvl,
      tbv,
    });
  } catch (e) {
    res.status(200).json({ data: [] });
  }
}

const knownScamPairs = ["0x2b774c36f9657148138fdfd63fb28c314746e002"] as const;
