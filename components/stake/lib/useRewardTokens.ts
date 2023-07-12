import { erc20ABI, useAccount, useContractReads } from "wagmi";
import { formatUnits } from "viem";

import { useStakeFvmRewardsListLength } from "../../../lib/wagmiGen";
import { STAKING_ADDRESS } from "../../../stores/constants/contracts";
import { stakeFvmABI } from "../../../stores/abis/stakeFvmABI";

export function useRewardTokens() {
  const { address } = useAccount();
  const { data: rewardsListLength } = useStakeFvmRewardsListLength({
    select: (data) => Number(data),
  });

  const { data: tokenAddresses } = useContractReads({
    enabled: !!rewardsListLength,
    allowFailure: false,
    contracts: [...Array(rewardsListLength ?? 0).keys()].map((i) => {
      return {
        address: STAKING_ADDRESS,
        abi: stakeFvmABI,
        functionName: "rewards",
        args: [BigInt(i)],
      } as const;
    }),
  });

  const { data: tokenSymbols } = useContractReads({
    enabled: !!tokenAddresses && tokenAddresses.length > 0,
    allowFailure: false,
    contracts: tokenAddresses?.map((token) => {
      return {
        address: token,
        abi: erc20ABI,
        functionName: "symbol",
      } as const;
    }),
  });

  const { data: tokenDecimals } = useContractReads({
    enabled: !!tokenAddresses && tokenAddresses.length > 0,
    allowFailure: false,
    contracts: tokenAddresses?.map((token) => {
      return {
        address: token,
        abi: erc20ABI,
        functionName: "decimals",
      } as const;
    }),
  });

  const {
    data: earned,
    isFetching,
    refetch,
  } = useContractReads({
    enabled:
      !!tokenAddresses &&
      tokenAddresses.length > 0 &&
      !!address &&
      !!tokenDecimals &&
      tokenDecimals.length > 0,
    allowFailure: false,
    contracts: tokenAddresses?.map((token) => {
      return {
        address: STAKING_ADDRESS,
        abi: stakeFvmABI,
        functionName: "earned",
        args: [token, address!],
      } as const;
    }),
    select: (data) =>
      data.map((earnedAmount, i) =>
        formatUnits(earnedAmount, tokenDecimals![i])
      ),
  });

  return {
    data:
      !!earned && !!tokenAddresses && !!tokenSymbols && tokenDecimals
        ? earned.map((amount, i) => {
            return {
              address: tokenAddresses[i],
              symbol: tokenSymbols[i],
              decimals: tokenDecimals[i],
              amount: amount,
            };
          })
        : undefined,
    isFetching,
    refetch,
  };
}
