import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";

import {
  useAggMaxxingBalanceOf,
  useAggMaxxingBalanceWithLock,
  useAggMaxxingLockEnd,
  useAggMaxxingStake,
} from "../../../lib/wagmiGen";

export function useStakeData() {
  const { address } = useAccount();

  const { data: pair } = useAggMaxxingStake();
  const { data: pooledBalance, refetch: refetchPooledBalance } = useBalance({
    address,
    token: pair,
  });

  const { data: stakedBalance, refetch: refetchStakedBalance } =
    useAggMaxxingBalanceOf({
      args: [address!],
      enabled: !!address,
      select: (data) => formatEther(data),
    });

  const { data: stakedBalanceWithLock, refetch: refetchStakedBalanceWithLock } =
    useAggMaxxingBalanceWithLock({
      args: [address!],
      enabled: !!address,
      select: (data) => formatEther(data),
    });

  const { data: stakedLockEnd } = useAggMaxxingLockEnd({
    args: [address!],
    enabled:
      !!address &&
      !!stakedBalanceWithLock &&
      parseFloat(stakedBalanceWithLock) > 0,
    select: (data) => Number(data),
  });
  return {
    pair,
    pooledBalance,
    stakedBalance,
    stakedBalanceWithLock,
    stakedLockEnd,
    refetch: () => {
      refetchPooledBalance();
      refetchStakedBalance();
      refetchStakedBalanceWithLock();
    },
  };
}
