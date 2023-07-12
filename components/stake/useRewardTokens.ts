import { erc20ABI, useAccount, useContractReads } from "wagmi";

import { useStakeFvmRewardsListLength } from "../../lib/wagmiGen";
import { STAKING_ADDRESS } from "../../stores/constants/contracts";
import { stakeFvmABI } from "../../stores/abis/stakeFvmABI";

export function useRewardTokens() {
  const { address } = useAccount();
  const { data: rewardsListLength } = useStakeFvmRewardsListLength({
    select: (data) => Number(data),
  });

  const { data: tokenAddresses } = useContractReads({
    enabled: rewardsListLength !== undefined && rewardsListLength > 0,
    allowFailure: false,
    contracts: [...Array(rewardsListLength!).keys()].map((i) => {
      return {
        address: STAKING_ADDRESS,
        abi: stakeFvmABI,
        functionName: "rewards",
        args: [BigInt(i)],
      } as const; // see why we need to cast here https://github.com/wagmi-dev/wagmi/issues/2342
    }),
  });

  // read token symbol
  const { data: tokenInfos } = useContractReads({
    enabled: tokenAddresses !== undefined && tokenAddresses.length > 0,
    allowFailure: false,
    contracts: tokenAddresses!.map((token) => {
      return {
        address: token,
        abi: erc20ABI,
        functionName: "symbol",
      } as const;
    }),
  });

  // read token decimals
  const { data: tokenDecimals } = useContractReads({
    enabled: tokenAddresses !== undefined && tokenAddresses.length > 0,
    allowFailure: false,
    contracts: tokenAddresses!.map((token) => {
      return {
        address: token,
        abi: erc20ABI,
        functionName: "decimals",
      } as const;
    }),
  });

  const { data, isFetching, refetch } = useContractReads({
    enabled:
      tokenAddresses !== undefined &&
      tokenAddresses.length > 0 &&
      address !== undefined,
    allowFailure: false,
    contracts: tokenAddresses!.map((token) => {
      return {
        address: STAKING_ADDRESS,
        abi: stakeFvmABI,
        functionName: "earned",
        args: [token, address!],
      } as const;
    }),
  });

  return {
    data: data?.map((amount, i) => {
      return {
        address: tokenAddresses![i],
        symbol: tokenInfos![i],
        decimals: tokenDecimals![i],
        amount: amount,
      };
    }),
    isFetching,
    refetch,
  };
}
