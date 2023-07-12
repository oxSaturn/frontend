import { useQuery } from "@tanstack/react-query";
import { useContractReads } from "wagmi";
import { formatUnits } from "viem";

import {
  useOptionTokenDiscount,
  useOptionTokenVeDiscount,
} from "../../../lib/wagmiGen";
import { useTokenPrices } from "../../header/lib/queries";
import { CONTRACTS } from "../../../stores/constants/constants";
import { stakeFvmABI } from "../../../stores/abis/stakeFvmABI";

import { useRewardTokens } from "./useRewardTokens";
import { useTotalStaked } from "./useTotalStaked";

export function useApr() {
  const { data: tokenPrices } = useTokenPrices();
  const { data: tvl } = useTotalStaked();
  const { data: rewardTokens } = useRewardTokens();
  const { data: rewardRates } = useContractReads({
    enabled: !!rewardTokens && rewardTokens.length > 0,
    allowFailure: false,
    contracts: rewardTokens?.map(
      (token) =>
        ({
          address: CONTRACTS.STAKING_ADDRESS,
          abi: stakeFvmABI,
          functionName: "rewardRate",
          args: [token.address],
        } as const)
    ),
    select: (data) =>
      data.map((rewardRate, i) =>
        formatUnits(rewardRate, rewardTokens![i].decimals)
      ),
  });
  const { data: left } = useContractReads({
    enabled: !!rewardTokens && rewardTokens.length > 0,
    allowFailure: false,
    contracts: rewardTokens?.map(
      (token) =>
        ({
          address: CONTRACTS.STAKING_ADDRESS,
          abi: stakeFvmABI,
          functionName: "left",
          args: [token.address],
        } as const)
    ),
    select: (data) =>
      data.map((left, i) => formatUnits(left, rewardTokens![i].decimals)),
  });
  const { data: discount } = useOptionTokenDiscount({
    select: (asianDiscount) => (100n - asianDiscount).toString(),
  });
  const { data: veDiscount } = useOptionTokenVeDiscount({
    select: (asianDiscount) => (100n - asianDiscount).toString(),
  });

  return useQuery({
    queryKey: [
      "FVM-STAKE-APR",
      tokenPrices,
      rewardTokens,
      rewardRates,
      left,
      tvl,
      discount,
      veDiscount,
    ],
    queryFn: async () => {
      if (
        !rewardTokens ||
        !rewardRates ||
        tvl === undefined ||
        !left ||
        !discount ||
        !veDiscount ||
        rewardTokens.length !== rewardRates.length ||
        rewardTokens.length !== left.length ||
        !tokenPrices
      ) {
        throw new Error("Missing data");
      }
      const rewards = rewardRates?.map((rewardRate, i) => {
        return Number(left[i]) === 0 ? 0 : +rewardRate * 86400;
      });
      const govPrice =
        tokenPrices.get(CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase()) ?? 0;
      const minPrice = (govPrice * Number(discount)) / 100;
      const maxPrice = (govPrice * Number(veDiscount)) / 100;
      const aprs = rewards.map((reward) => {
        const minApr = ((reward * minPrice) / tvl) * 100 * 365;
        const maxApr = ((reward * maxPrice) / tvl) * 100 * 365;
        return { minApr, maxApr };
      });
      return aprs.map((apr, i) => ({
        minApr: apr.minApr.toFixed(),
        maxApr: apr.maxApr.toFixed(),
        ...rewardTokens[i],
      }));
    },
    enabled:
      !!rewardTokens &&
      rewardTokens.length > 0 &&
      tvl !== undefined &&
      !!left &&
      !!discount &&
      !!veDiscount &&
      !!rewardRates &&
      !!tokenPrices,
    keepPreviousData: true,
  });
}
