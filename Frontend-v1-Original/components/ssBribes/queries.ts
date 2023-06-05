import { useQuery } from "@tanstack/react-query";

import viemClient from "../../stores/connectors/viem";
import { CONTRACTS, QUERY_KEYS } from "../../stores/constants/constants";

const autoBribesAddresses = [
  "0x0CD1b0fAB074727D7504c9Dc23f131598cFE5427",
  "0xd855dbbb8ca20b6df9459eea613d7645c8f8ad93",
  "0xb53350884016E9b398F9F43c4B1C62d87D809DA7",
  "0x01790Da7Df49e620694ff2f10382C01D6ef33179",
] as const;

const getAutoBribes = async () => {
  const autoBribesMap = new Map<
    `0x${string}`,
    { name: string; bribed: boolean }
  >();
  for (const address of autoBribesAddresses) {
    const autoBribe = {
      address,
      abi: CONTRACTS.AUTO_BRIBE_ABI,
    } as const;

    const [bribeName, nextWeekSeconds] = await viemClient.multicall({
      allowFailure: false,
      contracts: [
        {
          ...autoBribe,
          functionName: "bribeName",
        },
        {
          ...autoBribe,
          functionName: "nextWeek",
        },
      ],
    });
    const nextWeekMs = Number(nextWeekSeconds) * 1000;

    const bribed = Date.now() < nextWeekMs;
    autoBribesMap.set(address, {
      name: bribeName.split("_").join("-").toUpperCase(),
      bribed,
    });
  }
  return autoBribesMap;
};

export const useAutoBribes = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.AUTO_BRIBES],
    queryFn: getAutoBribes,
  });
};
