import type { NextApiRequest, NextApiResponse } from "next";

import { RouteAsset } from "../../stores/types/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await fetch(`${process.env.API}/api/v1/configuration`);
    const routeAssetsCall = (await response.json()) as { data: RouteAsset[] };

    res.status(200).json(routeAssetsCall);
  } catch (e) {
    res.status(200).json({ data: [] });
  }
}
