import { useQuery } from "@tanstack/react-query";

import viemClient from "../../stores/connectors/viem";
import { CONTRACTS } from "../../stores/constants/constants";

const autoBribesAddresses = [
  "0xb066870D748a6Caf901eAE881DC96C2a9B004179",
  "0x0BF10Dd051856FFf28Df0b033108C7513c3E637e",
] as const;

const getAutoBribes = async () => {
  const autoBribesMap = new Map<`0x${string}`, boolean>();
  for (const address of autoBribesAddresses) {
    const autoBribe = {
      address,
      abi: CONTRACTS.AUTO_BRIBE_ABI,
    } as const;

    const nextWeekSeconds = await viemClient.readContract({
      ...autoBribe,
      functionName: "nextWeek",
    });
    const nextWeekMs = Number(nextWeekSeconds) * 1000;

    const bribed = Date.now() >= nextWeekMs;
    autoBribesMap.set(address, bribed);
  }
  return autoBribesMap;
};

export const useAutoBribes = () => {
  return useQuery({
    queryKey: ["autoBribes"],
    queryFn: getAutoBribes,
  });
};
