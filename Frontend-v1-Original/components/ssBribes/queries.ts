import { useQuery } from "@tanstack/react-query";

import viemClient from "../../stores/connectors/viem";
import { CONTRACTS } from "../../stores/constants/constants";

const autoBribesAddresses = [
  "0x1fc94f96fdd3Fc51E39575161BD6ed920c03fFA0",
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
      multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
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

    const bribed = Date.now() >= nextWeekMs;
    autoBribesMap.set(address, { name: bribeName, bribed });
  }
  return autoBribesMap;
};

export const useAutoBribes = () => {
  return useQuery({
    queryKey: ["autoBribes"],
    queryFn: getAutoBribes,
  });
};
