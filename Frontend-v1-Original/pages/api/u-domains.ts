import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    address,
  }: {
    address: string;
  } = JSON.parse(req.body);

  let domain = "";

  try {
    const data = await fetch(
      `https://resolve.unstoppabledomains.com/reverse/${address.toLowerCase()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.UNSTOPPABLE_DOMAINS_API_KEY}`,
        },
      }
    );

    const resJson = await data.json();
    if (!resJson?.meta?.domain || resJson?.meta?.domain === "") {
      res.status(200).json({ domain });
    } else {
      domain = resJson?.meta?.domain as string;
      res.status(200).json({ domain });
    }
  } catch (e) {
    res.status(200).json({ domain });
  }
}
