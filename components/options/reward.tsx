import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, useWaitForTransaction } from "wagmi";

import { formatCurrency } from "../../utils/utils";
import { QUERY_KEYS, PRO_OPTIONS } from "../../stores/constants/constants";
import {
  useMaxxingGaugeGetReward,
  useOptionTokenGauge,
  usePrepareMaxxingGaugeGetReward,
} from "../../lib/wagmiGen";

import { useGaugeRewards, useTokenData, useInputs } from "./lib";

export function Reward() {
  const { optionToken } = useInputs();

  const queryClient = useQueryClient();
  const { address } = useAccount();

  const {
    data: earnedRewards,
    isLoading: isLoadingGaugeRewards,
    isRefetching: isRefetchingGaugeRewards,
    isFetching: isFetchingGaugeRewards,
    refetch: refetchEarnedReward,
  } = useGaugeRewards();
  const earnedTokenAddresses = useMemo(() => {
    return earnedRewards?.map((reward) => reward.address);
  }, [earnedRewards]);

  const { refetchBalances } = useTokenData();

  const { data: gaugeAddress } = useOptionTokenGauge({
    address: PRO_OPTIONS[optionToken].tokenAddress,
  });
  const { config: getRewardConfig } = usePrepareMaxxingGaugeGetReward({
    address: gaugeAddress,
    args: [address!, earnedTokenAddresses!],
    enabled:
      !!address && !!earnedTokenAddresses && earnedTokenAddresses.length > 0,
  });
  const {
    write: getReward,
    isLoading: isWritingGetReward,
    data: getRewardTx,
  } = useMaxxingGaugeGetReward(getRewardConfig);
  const { isFetching: waitingGetRewardReceipt } = useWaitForTransaction({
    hash: getRewardTx?.hash,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
      refetchEarnedReward();
      refetchBalances();
    },
  });

  return (
    <div className="flex w-96 min-w-[384px] flex-col rounded-md border border-cyan/50 p-5 font-sono text-lime-50 backdrop-blur-sm md:w-[512px] md:min-w-[512px]">
      <div className="relative mb-5 flex items-center justify-between">
        <h2 className="text-xl">Earned</h2>
        {isLoadingGaugeRewards && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm">
            Loading...
          </div>
        )}
        {isRefetchingGaugeRewards && (
          <div
            className="
          absolute
          right-0
          top-1/2
          -translate-y-1/2
          text-sm
        "
          >
            Updating...
          </div>
        )}
      </div>
      {earnedRewards && earnedRewards.length > 0 && (
        <div className="space-y-1">
          {earnedRewards.map((earnedReward) => (
            <div
              className="flex items-center justify-between space-y-2"
              key={earnedReward.address}
            >
              {formatCurrency(
                earnedReward.earnedAmount,
                earnedReward.symbol === "WETH" ? 6 : undefined
              )}{" "}
              {earnedReward.symbol}
            </div>
          ))}
        </div>
      )}
      {earnedRewards && earnedRewards.length === 0 && (
        <div className="flex items-center justify-between">
          Nothing earned yet
        </div>
      )}
      <div className="block h-3"></div>
      <div>
        <button
          disabled={
            isFetchingGaugeRewards ||
            isWritingGetReward ||
            waitingGetRewardReceipt ||
            !getReward
          }
          onClick={() => getReward?.()}
          className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-cyan p-5 text-center font-medium text-black transition-colors hover:bg-cyan/80 focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
        >
          {isWritingGetReward || waitingGetRewardReceipt
            ? "Claiming..."
            : "Claim Rewards"}
        </button>
      </div>
    </div>
  );
}
