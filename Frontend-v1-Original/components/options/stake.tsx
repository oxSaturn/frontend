import { useState } from "react";
import {
  useAccount,
  useBalance,
  useNetwork,
  useSwitchNetwork,
  useWaitForTransaction,
} from "wagmi";
import { canto } from "wagmi/chains";
import { formatEther, parseEther } from "viem";

import { PRO_OPTIONS } from "../../stores/constants/constants";
import { formatCurrency } from "../../utils/utils";
import {
  useAggMaxxingBalanceOf,
  useAggMaxxingDeposit,
  useAggMaxxingStake,
  useErc20Allowance,
  useErc20Approve,
  usePrepareAggMaxxingDeposit,
  usePrepareErc20Approve,
} from "../../lib/wagmiGen";

import { isValidInput } from "./lib/useAmountToPay";

export function Stake() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({
    chainId: canto.id,
  });

  const [amount, setAmount] = useState("");

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

  const {
    data: isApprovalNeeded,
    refetch: refetchAllowance,
    isFetching: isFetchingAllowance,
  } = useErc20Allowance({
    address: pair,
    args: [address!, PRO_OPTIONS.oAGG.gauge],
    enabled: !!address,
    select: (allowance) => {
      const formattedAllowance = formatEther(allowance);
      if (!amount) return;
      return parseFloat(formattedAllowance) < parseFloat(amount);
    },
  });

  const { config: approveConfig } = usePrepareErc20Approve({
    address: pair,
    args: [
      PRO_OPTIONS.oAGG.gauge,
      isValidInput(amount) ? parseEther(amount as `${number}`) : 0n,
    ],
    enabled: !!pair && !!address && isApprovalNeeded && isValidInput(amount),
  });
  const {
    write: approve,
    data: txApproveResponse,
    isLoading: writingApprove,
  } = useErc20Approve({
    ...approveConfig,
  });
  const { isFetching: waitingApprovalReceipt } = useWaitForTransaction({
    hash: txApproveResponse?.hash,
    onSuccess: () => {
      refetchAllowance();
    },
  });

  const { config: depositConfig } = usePrepareAggMaxxingDeposit({
    args: [isValidInput(amount) ? parseEther(amount as `${number}`) : 0n, 0n],
    enabled: !!address && !isApprovalNeeded && isValidInput(amount),
  });
  const {
    write: deposit,
    data: txDepositResponse,
    isLoading: writingDeposit,
  } = useAggMaxxingDeposit({
    ...depositConfig,
  });
  const { isFetching: waitingDepositReceipt } = useWaitForTransaction({
    hash: txDepositResponse?.hash,
    onSuccess: () => {
      refetchPooledBalance();
      refetchStakedBalance();
    },
  });

  const setMax = () => {
    if (pooledBalance && pooledBalance.value > 0n) {
      setAmount(pooledBalance.formatted);
    }
  };

  const insufficientAmount =
    pooledBalance && parseFloat(amount) > parseFloat(pooledBalance.formatted);

  return (
    <>
      <div className="mt-20 flex w-96 min-w-[384px] flex-col border border-primary p-5 font-sono text-lime-50 md:w-[512px] md:min-w-[512px]">
        <div className="flex items-center justify-between">
          <div>Pooled balance</div>
          <div>{formatCurrency(pooledBalance?.formatted)}</div>
        </div>
        <div className="flex items-center justify-between">
          <div>Staked balance</div>
          <div>{formatCurrency(stakedBalance)}</div>
        </div>
        <div className="my-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="w-full border border-[rgb(46,45,45)]">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full border-none bg-transparent p-4 text-left text-base focus:outline focus:outline-1 ${
                  (!isValidInput(amount) && amount !== "") || insufficientAmount
                    ? "text-error focus:outline-error focus-visible:outline-error"
                    : "focus:outline-secondary focus-visible:outline-secondary"
                }`}
                placeholder="0.00"
              />
            </div>
            <button className="p-4" onClick={() => setMax()}>
              MAX
            </button>
          </div>
          {chain?.unsupported ? (
            <button
              className="text-extendedBlack flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
              onClick={() => switchNetwork?.()}
            >
              Switch to Canto
            </button>
          ) : (
            <button
              disabled={
                !isValidInput(amount) ||
                insufficientAmount ||
                isFetchingAllowance ||
                writingApprove ||
                waitingApprovalReceipt ||
                writingDeposit ||
                waitingDepositReceipt
              }
              onClick={
                isApprovalNeeded
                  ? () => approve?.()
                  : false
                  ? () => {} // withdraw
                  : () => deposit?.()
              }
              className="text-extendedBlack flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
            >
              {writingApprove ||
              isFetchingAllowance ||
              waitingApprovalReceipt ||
              writingDeposit ||
              waitingDepositReceipt
                ? "Loading..."
                : isApprovalNeeded
                ? "Approve"
                : false
                ? "Withdraw"
                : "Stake"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
