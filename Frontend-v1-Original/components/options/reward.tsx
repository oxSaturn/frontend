import { useMemo } from "react";
import { useAccount, useWaitForTransaction } from "wagmi";

import { formatCurrency } from "../../utils/utils";
import {
  useMaxxingGaugeGetReward,
  usePrepareMaxxingGaugeGetReward,
} from "../../lib/wagmiGen";

import { useGaugeRewards } from "./lib";

export function Reward() {
  const { address } = useAccount();

  const {
    data: earnedRewards,
    isLoading: isLoadingGaugeRewards,
    isRefetching: isRefetchingGaugeRewards,
    isFetching: isFetchingGaugeRewards,
  } = useGaugeRewards();
  const earnedTokenAddresses = useMemo(() => {
    return earnedRewards?.map((reward) => reward.address);
  }, [earnedRewards]);

  const { config: getRewardConfig } = usePrepareMaxxingGaugeGetReward({
    args: [address!, earnedTokenAddresses!],
    enabled:
      !!address && earnedTokenAddresses && earnedTokenAddresses.length > 0,
  });
  const {
    write: getReward,
    isLoading: isWritingGetReward,
    data: getRewardTx,
  } = useMaxxingGaugeGetReward(getRewardConfig);
  const { isFetching: waitingGetRewardReceipt } = useWaitForTransaction({
    hash: getRewardTx?.hash,
  });

  return (
    <div className="flex w-96 min-w-[384px] flex-col border border-primary p-5 font-sono text-lime-50 md:w-[512px] md:min-w-[512px]">
      <div className="flex items-center justify-between">
        <div>Earned</div>
        {isLoadingGaugeRewards && <div>Loading...</div>}
        {isRefetchingGaugeRewards && <div>Updating...</div>}
      </div>
      {earnedRewards &&
        earnedRewards.map((earnedReward) => (
          <div
            className="flex items-center justify-between"
            key={earnedReward.address}
          >
            {formatCurrency(earnedReward.earnedAmount)} {earnedReward.symbol}
          </div>
        ))}
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
