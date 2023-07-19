import { useAccount, useBalance, useWaitForTransaction } from "wagmi";
import { formatEther, parseUnits } from "viem";
import { useState } from "react";

import { LoadingSVG } from "../common/LoadingSVG";

import {
  useErc20Allowance,
  useErc20Approve,
  useErc20Decimals,
  useErc20Symbol,
  usePrepareErc20Approve,
  usePrepareVeBoosterBoostedBuyAndVeLock,
  useVeBoosterBoostedBuyAndVeLock,
  useVeBoosterMatchRate,
  useVeBoosterPaymentToken,
  useVeBoosterGetExpectedAmount,
  useVeBoosterBalanceOfFlow,
} from "../../lib/wagmiGen";
import { formatCurrency } from "../../utils/utils";
import { VE_BOOSTER_ADRRESS } from "../../stores/constants/contracts";

export function VeBoost() {
  const { address } = useAccount();

  const [amount, setAmount] = useState("");

  const { data: paymentToken } = useVeBoosterPaymentToken();
  const { data: matchRate } = useVeBoosterMatchRate({
    select: (rate) => rate.toString(),
  });

  const { data: symbol } = useErc20Symbol({
    address: paymentToken,
    enabled: !!paymentToken,
  });
  const { data: decimals } = useErc20Decimals({
    address: paymentToken,
    enabled: !!paymentToken,
  });

  const { data: boostedAmount, isFetching: isFetchingBoostedAmount } =
    useVeBoosterGetExpectedAmount({
      args: [parseUnits(amount, decimals!)],
      enabled: !!amount && !!decimals,
      select: (boostedAmount) => formatEther(boostedAmount),
    });

  const { data: balanceInBooster } = useVeBoosterBalanceOfFlow({
    select: (balance) => formatEther(balance),
  });

  const { data: paymentBalance, refetch: refetchPaymentBalance } = useBalance({
    address: address!,
    token: paymentToken,
    enabled: !!paymentToken && !!address,
  });

  const {
    data: isApprovalNeeded,
    isRefetching: isRefetchingAllowance,
    isFetching: isFetchingAllowance,
    refetch: refetchAllowance,
  } = useErc20Allowance({
    address: paymentToken,
    args: [address!, VE_BOOSTER_ADRRESS],
    enabled: !!address && !!paymentToken && decimals !== undefined,
    select: (allowance) => {
      return allowance < parseUnits(amount, decimals!);
    },
  });

  const { config: approveConfig } = usePrepareErc20Approve({
    address: paymentToken,
    args: [VE_BOOSTER_ADRRESS, parseUnits(amount, decimals!)],
    enabled:
      !!address &&
      !!paymentToken &&
      decimals !== undefined &&
      isApprovalNeeded &&
      !!amount,
  });

  const {
    write: approve,
    data: approveTx,
    isLoading: isWritingApprove,
  } = useErc20Approve(approveConfig);

  const { isFetching: waitingApproveReceipt } = useWaitForTransaction({
    hash: approveTx?.hash,
    onSuccess: () => {
      refetchAllowance();
    },
  });

  const { config: boostedBillConfig } = usePrepareVeBoosterBoostedBuyAndVeLock({
    args: [parseUnits(amount, decimals!), 0n],
    enabled:
      !!address && !!amount && !isApprovalNeeded && decimals !== undefined,
  });

  const {
    write: boostedBuy,
    data: boostedBuyTx,
    isLoading: isWritingStake,
  } = useVeBoosterBoostedBuyAndVeLock(boostedBillConfig);

  const { isFetching: waitingStakeReceipt } = useWaitForTransaction({
    hash: boostedBuyTx?.hash,
    onSuccess: () => {
      setAmount("");
      refetchPaymentBalance();
      refetchAllowance();
    },
  });

  return (
    <div className="mx-5 sm:mx-auto sm:max-w-lg space-y-10 font-sono">
      <h1 className="text-3xl">
        Buy veFVM with {symbol} and get {matchRate}% boost
      </h1>
      <div className="space-y-5">
        <div className="bg-green-900 space-y-3 p-5 border border-cyan-900/70 rounded-md">
          <h2 className="text-2xl text-white">Buy boosted veFVM</h2>
          <div className="flex justify-between">
            <span>Current boost</span>
            <span>{formatCurrency(matchRate)} %</span>
          </div>
          <div className="flex justify-between">
            <span>Booster balance</span>
            <span>{formatCurrency(balanceInBooster)} FVM</span>
          </div>
          <div className="flex justify-between">
            <span>{symbol ?? "WFTM"} balance</span>
            <span
              className="underline cursor-pointer"
              onClick={() => {
                if (paymentBalance) setAmount(paymentBalance?.formatted);
              }}
            >
              {formatCurrency(paymentBalance?.formatted)}
            </span>
          </div>
          <div
            className={`flex justify-between ${
              isFetchingBoostedAmount && "animate-pulse"
            }`}
          >
            <span>Boosted veFVM amount</span>
            <span>{formatCurrency(boostedAmount)}</span>
          </div>
          <div className="space-y-2">
            <input
              type="number"
              min={0}
              className="w-full px-2 py-2 text-white hover:ring-1 hover:ring-cyan focus:outline-none focus:ring-1 focus:ring-cyan border-cyan-900/50 border bg-transparent"
              placeholder="0.0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
              }}
            />
            <div>
              {isApprovalNeeded ? (
                waitingApproveReceipt || isWritingApprove ? (
                  <button
                    className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-cyan p-5 text-center font-medium text-black transition-colors hover:bg-cyan/80 focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
                    disabled
                  >
                    Approving {symbol}{" "}
                    <LoadingSVG className="animate-spin h-5 w-5 ml-1" />
                  </button>
                ) : isRefetchingAllowance ? (
                  <button
                    className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-cyan p-5 text-center font-medium text-black transition-colors hover:bg-cyan/80 focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
                    disabled
                  >
                    Approved
                  </button>
                ) : (
                  <button
                    className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-cyan p-5 text-center font-medium text-black transition-colors hover:bg-cyan/80 focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
                    onClick={approve}
                  >
                    Approve {symbol}
                  </button>
                )
              ) : null}

              {!isApprovalNeeded ? (
                waitingStakeReceipt || isWritingStake ? (
                  <button
                    className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-cyan p-5 text-center font-medium text-black transition-colors hover:bg-cyan/80 focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
                    disabled
                  >
                    Buying veFVM{" "}
                    <LoadingSVG className="animate-spin h-5 w-5 ml-1" />
                  </button>
                ) : (
                  <button
                    className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-cyan p-5 text-center font-medium text-black transition-colors hover:bg-cyan/80 focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
                    onClick={boostedBuy}
                    disabled={!boostedBuy || isFetchingAllowance}
                  >
                    Boosted Buy
                  </button>
                )
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
