import { useQuery } from "@tanstack/react-query";

import viemClient from "../../stores/connectors/viem";
import { CONTRACTS, QUERY_KEYS } from "../../stores/constants/constants";

const autoBribesAddresses = [
  "0x1fc94f96fdd3Fc51E39575161BD6ed920c03fFA0",
  "0x5318FfE879e6027fD009beA6837E21F40EEf3903",
  "0xb091b7816112d870609Ca1c6E64bD140c189BA34",
  "0x4bC90701a5f3e72A5Fe2686C62Da24B20ca1cfB6",
  "0x0CD1b0fAB074727D7504c9Dc23f131598cFE5427",
  // not deposited
  // "0x8dcf1a8086e700eab31936af234b2d1212f257db",
  // "0xd2b0933EaD44592A7867f00DC1D3Dcdfe3806b83",
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
