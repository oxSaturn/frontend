import BigNumber from "bignumber.js";
import type { NextApiRequest, NextApiResponse } from "next";

import { NATIVE_TOKEN, chainToConnect } from "../../stores/constants/constants";
import { QuoteSwapPayload, QuoteSwapResponse } from "../../stores/types/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    options: { fromAsset, toAsset, fromAmount, slippage },
    address,
  }: QuoteSwapPayload = JSON.parse(req.body);

  const sendFromAmount = BigNumber(fromAmount)
    .times(10 ** fromAsset.decimals)
    .toFixed();

  if (fromAsset.address === NATIVE_TOKEN.address) {
    fromAsset.address = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  }
  if (toAsset.address === NATIVE_TOKEN.address) {
    toAsset.address = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  }

  try {
    const quote = await fetch(
      `https://router.firebird.finance/aggregator/v1/route?chainId=${chainToConnect.id}&from=${fromAsset.address}&to=${toAsset.address}&amount=${sendFromAmount}&slippage=${slippage}&receiver=${address}&source=velocimeter&dexes=velocimeter`,
      {
        method: "GET",
        headers: {
          "API-KEY": process.env.FIREBIRD_API_KEY!,
        },
      }
    );

    const resJson = (await quote.json()) as QuoteSwapResponse;

    resJson.maxReturn.paths.forEach((path) => {
      path.swaps.forEach((swap) => {
        if (swap.dex !== "velocimeter") {
          res.status(500).json({ error: "Invalid DEX" });
        }
      });
    });

    res.status(200).json(resJson);
  } catch (e) {
    res.status(400);
  }
}
