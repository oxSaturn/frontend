import { useQuery } from "@tanstack/react-query";
import { useAccount, useBalance } from "wagmi";
import { formatEther, formatUnits } from "viem";

import {
  useMaxxingGaugeBalanceOf,
  useMaxxingGaugeBalanceWithLock,
  useMaxxingGaugeLeft,
  useMaxxingGaugeLockEnd,
  useMaxxingGaugeStake,
  useMaxxingGaugeTotalSupply,
  useOptionTokenGauge,
} from "../../../lib/wagmiGen";
import { useGetPair } from "../../liquidityManage/lib/queries";
import { Pair } from "../../../stores/types/types";
import { useTokenPrices } from "../../header/lib/queries";
import { PRO_OPTIONS } from "../../../stores/constants/constants";

import { useTokenData } from "./useTokenData";
import { useInputs } from "./useInputs";

export function useStakeData() {
  const { optionToken } = useInputs();
  const { address } = useAccount();
  const { data: gaugeAddress } = useOptionTokenGauge({
    address: PRO_OPTIONS[optionToken].tokenAddress,
  });

  const { data: pair } = useMaxxingGaugeStake({
    address: gaugeAddress,
  });
  const { data: pooledBalance, refetch: refetchPooledBalance } = useBalance({
    address,
    token: pair,
  });

  const { data: stakedBalance, refetch: refetchStakedBalance } =
    useMaxxingGaugeBalanceOf({
      address: gaugeAddress,
      args: [address!],
      enabled: !!address,
      select: (data) => formatEther(data),
    });

  const { data: stakedBalanceWithLock, refetch: refetchStakedBalanceWithLock } =
    useMaxxingGaugeBalanceWithLock({
      address: gaugeAddress,
      args: [address!],
      enabled: !!address,
      select: (data) => formatEther(data),
    });

  const { data: stakedLockEnd } = useMaxxingGaugeLockEnd({
    address: gaugeAddress,
    args: [address!],
    enabled:
      !!address &&
      !!stakedBalanceWithLock &&
      parseFloat(stakedBalanceWithLock) > 0,
    select: (data) => Number(data),
  });

  const { paymentTokenDecimals, paymentTokenAddress } = useTokenData();
  const { data: paymentTokenLeftInGauge } = useMaxxingGaugeLeft({
    address: gaugeAddress,
    args: [paymentTokenAddress!],
    enabled: !!paymentTokenAddress,
    select: (data) => formatUnits(data, paymentTokenDecimals),
  });
  const { data: paymentTokenBalanceInOption } = useBalance({
    address: PRO_OPTIONS[optionToken].tokenAddress,
    token: paymentTokenAddress,
    enabled: !!paymentTokenAddress,
  });

  const stakedBalanceWithoutLock =
    stakedBalance && stakedBalanceWithLock
      ? (
          parseFloat(stakedBalance) - parseFloat(stakedBalanceWithLock)
        ).toString()
      : undefined;

  const { data: gaugeTotalStakedData } = useTotalStaked(
    stakedBalanceWithoutLock,
    stakedBalanceWithLock
  );

  const paymentTokenBalanceToDistribute =
    paymentTokenBalanceInOption && paymentTokenLeftInGauge
      ? parseFloat(paymentTokenLeftInGauge) +
        parseFloat(paymentTokenBalanceInOption.formatted)
      : undefined;

  const { data: paymentTokenToDistributeValue } =
    usePaymentTokenToDistributeValue(paymentTokenBalanceToDistribute);

  return {
    ...gaugeTotalStakedData,
    pair,
    pooledBalance,
    stakedBalance,
    stakedBalanceWithoutLock,
    stakedBalanceWithLock,
    stakedLockEnd,
    paymentTokenBalanceToDistribute,
    paymentTokenToDistributeValue,
    refetch: () => {
      refetchPooledBalance();
      refetchStakedBalance();
      refetchStakedBalanceWithLock();
    },
  };
}

function usePaymentTokenToDistributeValue(
  paymentTokenBalanceToDistribute: number | undefined
) {
  const { paymentTokenAddress } = useTokenData();
  const { data: tokenPrices } = useTokenPrices();
  return useQuery({
    queryKey: [
      "paymentTokenBalanceToDistributeValue",
      tokenPrices,
      paymentTokenAddress,
      paymentTokenBalanceToDistribute,
    ],
    queryFn: () =>
      getPaymentTokenToDistributeValue(
        paymentTokenAddress,
        paymentTokenBalanceToDistribute,
        tokenPrices
      ),
    enabled:
      !!tokenPrices &&
      paymentTokenBalanceToDistribute !== undefined &&
      !!paymentTokenAddress,
    keepPreviousData: true,
    retry: false,
  });
}

export function useTotalStaked(
  stakedBalanceWithoutLock: string | undefined,
  stakedBalanceWithLock: string | undefined
) {
  const { optionToken } = useInputs();
  const { data: gaugeAddress } = useOptionTokenGauge({
    address: PRO_OPTIONS[optionToken].tokenAddress,
  });
  const { data: pair } = useMaxxingGaugeStake({
    address: gaugeAddress,
  });
  const { data: totalSupply } = useMaxxingGaugeTotalSupply({
    address: gaugeAddress,
    select: (data) => formatEther(data),
  });
  const { data: pairData } = useGetPair(pair, gaugeAddress);
  const { data: tokenPrices } = useTokenPrices();

  return useQuery({
    queryKey: [
      "totalStaked",
      tokenPrices,
      pair,
      totalSupply,
      pairData,
      stakedBalanceWithoutLock,
      stakedBalanceWithLock,
    ],
    queryFn: () =>
      getTotalStaked(
        pairData,
        totalSupply,
        tokenPrices,
        stakedBalanceWithoutLock,
        stakedBalanceWithLock
      ),
    enabled:
      !!pair &&
      !!totalSupply &&
      !!pairData &&
      !!tokenPrices &&
      !!stakedBalanceWithoutLock &&
      !!stakedBalanceWithLock,
    keepPreviousData: true,
  });
}

function getTotalStaked(
  pairData: Pair | undefined,
  totalSupply: string | undefined,
  tokenPrices: Map<string, number> | undefined,
  stakedWithoutLock: string | undefined,
  stakedWithLock: string | undefined
) {
  if (
    !pairData ||
    !totalSupply ||
    !tokenPrices ||
    !stakedWithoutLock ||
    !stakedWithLock
  ) {
    throw new Error("Total staked error");
  }

  const reserve0 =
    pairData.totalSupply > 0
      ? (pairData.reserve0 * parseFloat(totalSupply)) / pairData.totalSupply
      : 0;
  const reserve1 =
    pairData.totalSupply > 0
      ? (pairData.reserve1 * parseFloat(totalSupply)) / pairData.totalSupply
      : 0;

  const price0 = tokenPrices.get(pairData.token0.address.toLowerCase()) ?? 0;
  const price1 = tokenPrices.get(pairData.token1.address.toLowerCase()) ?? 0;

  const totalStakedValue = reserve0 * price0 + reserve1 * price1;
  const stakedWithoutLockValue =
    (+stakedWithoutLock / +totalSupply) *
    (reserve0 * price0 + reserve1 * price1);
  const stakedWithLockValue =
    (+stakedWithLock / +totalSupply) * (reserve0 * price0 + reserve1 * price1);

  return {
    reserve0,
    reserve1,
    totalStakedValue,
    stakedWithoutLockValue,
    stakedWithLockValue,
  };
}

function getPaymentTokenToDistributeValue(
  paymentTokenAddress: `0x${string}` | undefined,
  paymentTokenBalanceToDistribute: number | undefined,
  tokenPrices: Map<string, number> | undefined
) {
  if (
    paymentTokenBalanceToDistribute === undefined ||
    !tokenPrices ||
    !paymentTokenAddress
  ) {
    throw new Error("Payment token balance to distribute value error");
  }
  const price = tokenPrices.get(paymentTokenAddress.toLowerCase());
  if (!price) {
    throw new Error("Payment token price not found");
  }
  return paymentTokenBalanceToDistribute * price;
}
