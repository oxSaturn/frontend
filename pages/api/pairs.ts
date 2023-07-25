import type { NextApiRequest, NextApiResponse } from "next";

import { Aprs, Pair, RouteAsset } from "../../stores/types/types";

const fuckMultiPairAddress = "0x90102FbbB9226bBD286Da3003ADD03D4178D896e";
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

    const withParsedAprs = resJson.data.map((pair) => {
      if (pair.aprs) {
        const parsed = JSON.parse(pair.aprs as unknown as string) as Exclude<
          Aprs,
          null
        >;
        const filtered = parsed.filter((apr) => {
          if ("min_apr" in apr) {
            if (apr.symbol !== "oFVM") {
              return apr.min_apr > 0;
            } else {
              return true;
            }
          } else {
            if (apr.symbol !== "FVM") {
              return apr.apr > 0;
            } else {
              return true;
            }
          }
        });

        // When gauge emits options and has been boosted with more options we want to summarise min and max apr values
        const map = new Map<string, Exclude<Aprs, null>[number]>();
        filtered.forEach((apr) => {
          if ("min_apr" in apr) {
            if (map.has(apr.symbol)) {
              const current = map.get(apr.symbol) as Extract<
                Exclude<Aprs, null>[number],
                { min_apr: number }
              >;
              map.set(apr.symbol, {
                ...current,
                min_apr: current.min_apr + apr.min_apr,
                max_apr: current.max_apr + apr.max_apr,
              });
            } else {
              map.set(apr.symbol, apr);
            }
          } else {
            map.set(apr.symbol, apr);
          }
        });
        const mapAsArr = [...map.values()];

        const pairAprs = mapAsArr.length > 0 ? mapAsArr : null;
        pair.aprs = pairAprs;
      }
      return pair;
    });
    const parsedAprsData = { data: withParsedAprs };

    const noScamPairs = parsedAprsData.data.filter((pair) => {
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
      tbv += pair.gauge?.median_tbv ?? 0;
    }

    const censoredPairs = noScamPairs.map((pair) => {
      if (pair.address.toLowerCase() === fuckMultiPairAddress.toLowerCase()) {
        return {
          ...pair,
          symbol: "vAMM-WFTM/FMULTI",
        };
      }
      return pair;
    });

    res.status(200).json({
      data: censoredPairs,
      prices: [...tokenPricesMap.entries()],
      tvl,
      tbv,
    });
  } catch (e) {
    res.status(200).json({ data: [] });
  }
}

const knownScamPairs = ["0x2b774c36f9657148138fdfd63fb28c314746e002"] as const;
