import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, useWaitForTransaction } from "wagmi";

import { formatCurrency } from "../../utils/utils";
import { QUERY_KEYS } from "../../stores/constants/constants";
import {
  useMaxxingGaugeGetReward,
  usePrepareMaxxingGaugeGetReward,
} from "../../lib/wagmiGen";

import { useGaugeRewards, useTokenData } from "./lib";

export function Reward() {
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

  const { underlyingTokenSymbol } = useTokenData();

  const { config: getRewardConfig } = usePrepareMaxxingGaugeGetReward({
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
    },
  });

  return (
    <div className="flex w-96 min-w-[384px] flex-col border border-primary p-5 font-sono text-lime-50 md:w-[512px] md:min-w-[512px]">
      <div className="flex items-center justify-between">
        <div>Earned</div>
        {isLoadingGaugeRewards && <div>Loading...</div>}
        {isRefetchingGaugeRewards && <div>Updating...</div>}
      </div>
      {earnedRewards &&
        earnedRewards.length > 0 &&
        earnedRewards.map((earnedReward) => (
          <div
            className="flex items-center justify-between"
            key={earnedReward.address}
          >
            {formatCurrency(earnedReward.earnedAmount)}{" "}
            {earnedReward.symbol === underlyingTokenSymbol
              ? `o${underlyingTokenSymbol}`
              : earnedReward.symbol}
          </div>
        ))}
      {earnedRewards && earnedRewards.length === 0 && (
        <div className="flex items-center justify-between">
          Nothing earned yet
        </div>
      )}
      <button
        disabled={
          isFetchingGaugeRewards ||
          isWritingGetReward ||
          waitingGetRewardReceipt ||
          !getReward
        }
        onClick={() => getReward?.()}
        className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium text-black transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
      >
        {isWritingGetReward || waitingGetRewardReceipt
          ? "Loading..."
          : "Claim Rewards"}
      </button>
    </div>
  );
}
