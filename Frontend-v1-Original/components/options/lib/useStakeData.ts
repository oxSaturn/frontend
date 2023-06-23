import { useQuery } from "@tanstack/react-query";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";

import {
  useMaxxingGaugeBalanceOf,
  useMaxxingGaugeBalanceWithLock,
  useMaxxingGaugeLockEnd,
  useMaxxingGaugeStake,
  useMaxxingGaugeTotalSupply,
} from "../../../lib/wagmiGen";
import { useGetPair } from "../../liquidityManage/lib/queries";
import { Pair } from "../../../stores/types/types";
import { useTokenPrices } from "../../header/lib/queries";

export function useStakeData() {
  const { address } = useAccount();

  const { data: pair } = useMaxxingGaugeStake();
  const { data: pooledBalance, refetch: refetchPooledBalance } = useBalance({
    address,
    token: pair,
  });

  const { data: stakedBalance, refetch: refetchStakedBalance } =
    useMaxxingGaugeBalanceOf({
      args: [address!],
      enabled: !!address,
      select: (data) => formatEther(data),
    });

  const { data: stakedBalanceWithLock, refetch: refetchStakedBalanceWithLock } =
    useMaxxingGaugeBalanceWithLock({
      args: [address!],
      enabled: !!address,
      select: (data) => formatEther(data),
    });

  const { data: stakedLockEnd } = useMaxxingGaugeLockEnd({
    args: [address!],
    enabled:
      !!address &&
      !!stakedBalanceWithLock &&
      parseFloat(stakedBalanceWithLock) > 0,
    select: (data) => Number(data),
  });

  const stakedBalanceWithoutLock =
    stakedBalance && stakedBalanceWithLock
      ? parseFloat(stakedBalance) - parseFloat(stakedBalanceWithLock)
      : undefined;

  const { data: gaugeTotalStakedData } = useTotalStaked();

  return {
    ...gaugeTotalStakedData,
    pair,
    pooledBalance,
    stakedBalance,
    stakedBalanceWithoutLock: stakedBalanceWithoutLock?.toString(),
    stakedBalanceWithLock,
    stakedLockEnd,
    refetch: () => {
      refetchPooledBalance();
      refetchStakedBalance();
      refetchStakedBalanceWithLock();
    },
  };
}

export function useTotalStaked() {
  const { data: pair } = useMaxxingGaugeStake();
  const { data: totalSupply } = useMaxxingGaugeTotalSupply({
    select: (data) => formatEther(data),
  });
  const { data: pairData } = useGetPair(pair);
  const { data: tokenPrices } = useTokenPrices();

  return useQuery({
    queryKey: ["totalStaked", tokenPrices, pair, totalSupply, pairData],
    queryFn: () => getTotalStaked(pairData, totalSupply, tokenPrices),
    enabled: !!pair && !!totalSupply && !!pairData && !!tokenPrices,
  });
}

function getTotalStaked(
  pairData: Pair | undefined,
  totalSupply: string | undefined,
  tokenPrices: Map<string, number> | undefined
) {
  if (!pairData || !totalSupply) {
    throw new Error("Pair data or total supply is undefined");
  }

  const reserve0 =
    pairData.totalSupply > 0
      ? (pairData.reserve0 * parseFloat(totalSupply)) / pairData.totalSupply
      : 0;
  const reserve1 =
    pairData.totalSupply > 0
      ? (pairData.reserve1 * parseFloat(totalSupply)) / pairData.totalSupply
      : 0;

  const price0 = tokenPrices?.get(pairData.token0.address.toLowerCase()) ?? 0;
  const price1 = tokenPrices?.get(pairData.token1.address.toLowerCase()) ?? 0;

  const totalStakedValue = reserve0 * price0 + reserve1 * price1;

  return { reserve0, reserve1, totalStakedValue };
}
