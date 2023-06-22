import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";

import {
  useMaxxingGaugeBalanceOf,
  useMaxxingGaugeBalanceWithLock,
  useMaxxingGaugeLockEnd,
  useMaxxingGaugeStake,
} from "../../../lib/wagmiGen";

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
