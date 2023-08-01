import { useMemo, useState } from "react";
import {
  useAccount,
  useNetwork,
  useSwitchNetwork,
  useWaitForTransaction,
} from "wagmi";
import { base } from "wagmi/chains";
import { formatEther, parseEther } from "viem";
import * as Switch from "@radix-ui/react-switch";
import * as Separator from "@radix-ui/react-separator";
import dayjs from "dayjs";

import { LoadingSVG } from "../common/LoadingSVG";

import { formatCurrency } from "../../utils/utils";
import {
  useMaxxingGaugeDeposit,
  useMaxxingGaugeWithdraw,
  useErc20Allowance,
  useErc20Approve,
  usePrepareMaxxingGaugeDeposit,
  usePrepareMaxxingGaugeWithdraw,
  usePrepareErc20Approve,
  useOptionTokenGauge,
} from "../../lib/wagmiGen";
import { PRO_OPTIONS, W_NATIVE_SYMBOL } from "../../stores/constants/constants";
import { GOV_TOKEN_SYMBOL } from "../../stores/constants/contracts";

import {
  isValidInput,
  useStakeData,
  useGaugeApr,
  useTokenData,
  useInputs,
} from "./lib";
import { useTotalRewardedAmount } from "./lib/useTotalRewardedAmount";
import { useCurrentLocksAverage } from "./lib/useCurrentLocksAverage";

const ACTION = {
  STAKE: "STAKE",
  WITHDRAW: "WITHDRAW",
} as const;

export function Stake() {
  const { optionToken } = useInputs();
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({
    chainId: base.id,
  });

  const [amount, setAmount] = useState("");
  const [action, setAction] = useState<(typeof ACTION)[keyof typeof ACTION]>(
    ACTION.STAKE
  );

  const { paymentTokenSymbol } = useTokenData();
  const {
    pair,
    refetch: refetchStakedData,
    pooledBalance,
    stakedBalance,
    stakedBalanceWithoutLock,
    stakedWithoutLockValue,
    stakedBalanceWithLock,
    stakedWithLockValue,
    stakedLockEnd,
    totalStakedValue,
    paymentTokenBalanceToDistribute,
    paymentTokenToDistributeValue,
  } = useStakeData();

  const { data: tokenAprs } = useGaugeApr();

  const { data: totalRewardedAmount, isLoading: isLoadingTotalRewardedAmount } =
    useTotalRewardedAmount();

  const { data: averageLocks, isLoading: isLoadingLocksData } =
    useCurrentLocksAverage();

  const { data: gaugeAddress } = useOptionTokenGauge({
    address: PRO_OPTIONS[optionToken].tokenAddress,
  });
  const {
    data: isApprovalNeeded,
    refetch: refetchAllowance,
    isFetching: isFetchingAllowance,
  } = useErc20Allowance({
    address: pair,
    args: [address!, gaugeAddress!],
    enabled: !!address && !!gaugeAddress,
    select: (allowance) => {
      const formattedAllowance = formatEther(allowance);
      if (!amount) return false;
      return parseFloat(formattedAllowance) < parseFloat(amount);
    },
  });

  const { config: approveConfig } = usePrepareErc20Approve({
    address: pair,
    args: [
      gaugeAddress!,
      isValidInput(amount) ? parseEther(amount as `${number}`) : 0n,
    ],
    enabled:
      !!pair &&
      !!address &&
      !!gaugeAddress &&
      isApprovalNeeded &&
      isValidInput(amount),
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

  const { config: depositConfig } = usePrepareMaxxingGaugeDeposit({
    address: gaugeAddress,
    args: [isValidInput(amount) ? parseEther(amount as `${number}`) : 0n, 0n],
    enabled:
      !!address &&
      !isApprovalNeeded &&
      isValidInput(amount) &&
      action === ACTION.STAKE,
  });
  const {
    write: deposit,
    data: txDepositResponse,
    isLoading: writingDeposit,
  } = useMaxxingGaugeDeposit({
    ...depositConfig,
  });
  const { isFetching: waitingDepositReceipt } = useWaitForTransaction({
    hash: txDepositResponse?.hash,
    onSuccess: () => {
      refetchStakedData();
      refetchAllowance();
    },
  });

  const { config: withdrawConfig } = usePrepareMaxxingGaugeWithdraw({
    address: gaugeAddress,
    args: [isValidInput(amount) ? parseEther(amount as `${number}`) : 0n],
    enabled: !!address && isValidInput(amount) && action === ACTION.WITHDRAW,
  });
  const {
    write: withdraw,
    data: txWithdrawResponse,
    isLoading: writingWithdraw,
  } = useMaxxingGaugeWithdraw({
    ...withdrawConfig,
  });
  const { isFetching: waitingWithdrawReceipt } = useWaitForTransaction({
    hash: txWithdrawResponse?.hash,
    onSuccess: () => {
      refetchStakedData();
    },
  });

  const setMax = () => {
    if (action === ACTION.STAKE) {
      if (pooledBalance && pooledBalance.value > 0n) {
        setAmount(pooledBalance.formatted);
      }
    } else {
      if (
        stakedBalanceWithoutLock &&
        parseFloat(stakedBalanceWithoutLock) > 0
      ) {
        setAmount(stakedBalanceWithoutLock);
      }
    }
  };

  const pickWithdrawAmount = (type: "locked" | "notLocked" | "all") => {
    if (action === ACTION.STAKE) return;
    if (type === "all") {
      setAmount(stakedBalance ?? "0");
      return;
    }
    if (type === "notLocked") {
      if (
        stakedBalanceWithoutLock &&
        parseFloat(stakedBalanceWithoutLock) > 0
      ) {
        setAmount(stakedBalanceWithoutLock);
      }
    } else if (type === "locked") {
      if (stakedBalanceWithLock && parseFloat(stakedBalanceWithLock) > 0) {
        setAmount(stakedBalanceWithLock);
      }
    }
  };

  const handleSwitch = () => {
    setAction((prevAction) =>
      prevAction === ACTION.STAKE ? ACTION.WITHDRAW : ACTION.STAKE
    );
    setAmount("");
  };

  const insufficientAmount =
    action === ACTION.STAKE
      ? pooledBalance &&
        parseFloat(amount) > parseFloat(pooledBalance.formatted)
      : stakedBalance && parseFloat(amount) > parseFloat(stakedBalance);

  const isLockExpired = useMemo(() => {
    return stakedLockEnd && stakedLockEnd < dayjs().unix() ? true : false;
  }, [stakedLockEnd]);

  return (
    <>
      <div className="flex w-96 min-w-[384px] flex-col rounded-md border border-cyan/50 p-5 font-sono text-lime-50 backdrop-blur-sm md:w-[512px] md:min-w-[512px]">
        <h2 className="mb-5 flex cursor-pointer items-center text-xl">
          <label
            className="pr-[15px] leading-none text-white"
            htmlFor="airplane-mode"
          >
            Stake
          </label>
          <Switch.Root
            className="relative h-[25px] w-[42px] cursor-default rounded-full bg-black shadow-[0_2px_10px] shadow-black outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[state=checked]:bg-black"
            id="airplane-mode"
            checked={action === ACTION.WITHDRAW}
            onCheckedChange={handleSwitch}
          >
            <Switch.Thumb className="block h-[21px] w-[21px] translate-x-0.5 rounded-full bg-white shadow-[0_2px_2px] shadow-black transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[19px]" />
          </Switch.Root>
          <label
            className="pl-[15px] leading-none text-white"
            htmlFor="airplane-mode"
          >
            Withdraw
          </label>
        </h2>
        <div className="flex items-center justify-between">
          <div>Total staked</div>
          <div>${formatCurrency(totalStakedValue)}</div>
        </div>
        {optionToken === `o${GOV_TOKEN_SYMBOL}` && (
          <div className="flex items-center justify-between">
            <div>{W_NATIVE_SYMBOL} rewards claimed</div>
            <div>
              {isLoadingTotalRewardedAmount ? (
                <LoadingSVG className="animate-spin h-5 w-5 ml-1" />
              ) : (
                `$${formatCurrency(totalRewardedAmount)}`
              )}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>{paymentTokenSymbol} reward left</div>
          <div>
            {paymentTokenToDistributeValue === undefined
              ? formatCurrency(paymentTokenBalanceToDistribute ?? 0)
              : `$${formatCurrency(paymentTokenToDistributeValue)}`}
          </div>
        </div>
        {optionToken === `o${GOV_TOKEN_SYMBOL}` && (
          <div className="flex items-center justify-between">
            <div>Average lock time</div>
            <div>
              {isLoadingLocksData ? (
                <LoadingSVG className="animate-spin h-5 w-5 ml-1" />
              ) : (
                `${averageLocks ?? "-"}d`
              )}
            </div>
          </div>
        )}
        <div className="flex items-start justify-between">
          <div>APR</div>
          <div className="flex flex-col">
            {tokenAprs && tokenAprs.length > 0 ? (
              tokenAprs.map((token) => (
                <div
                  key={token.address}
                  className="flex items-center justify-end gap-2"
                >
                  <div>
                    {typeof token.aprRange !== "undefined"
                      ? `${formatCurrency(
                          token.aprRange[0]
                        )} - ${formatCurrency(token.aprRange[1])}%`
                      : `
                  ${formatCurrency(token.apr)}%
                  `}
                  </div>
                  {token.symbol}
                  <img
                    src={token.logoUrl ?? "/tokens/unknown-logo.png"}
                    title={token.symbol}
                    alt={`${token.symbol} logo`}
                    className="block h-5 w-5 rounded-full"
                  />
                </div>
              ))
            ) : (
              <div>0.00</div>
            )}
          </div>
        </div>
        <Separator.Root className="bg-secondary radix-orientation-horizontal:h-px radix-orientation-horizontal:w-full my-[15px]" />
        <div className="flex items-center justify-between">
          <div>Staked without lock</div>
          <div
            className={`${
              action === ACTION.WITHDRAW && "cursor-pointer underline"
            }`}
            onClick={() =>
              pickWithdrawAmount(isLockExpired ? "all" : "notLocked")
            }
          >
            $
            {formatCurrency(
              isLockExpired
                ? (stakedWithLockValue ?? 0) + (stakedWithoutLockValue ?? 0)
                : stakedWithoutLockValue
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>Staked with lock</div>
          <div>
            ${formatCurrency(isLockExpired ? 0 : stakedWithLockValue ?? 0)}
          </div>
        </div>
        {!isLockExpired && stakedLockEnd ? (
          <div className="flex items-center justify-between">
            <div>Lock end</div>
            <div>{dayjs.unix(stakedLockEnd).format("YYYY-MM-DD HH:mm:ss")}</div>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <div>Pooled balance</div>
          <div
            className={`${
              action === ACTION.STAKE && "cursor-pointer underline"
            }`}
            onClick={() => setMax()}
          >
            {pooledBalance?.formatted}
          </div>
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
              className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-cyan p-5 text-center font-medium text-black transition-colors hover:bg-cyan/80 focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
              onClick={() => switchNetwork?.()}
            >
              Switch to base
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
                waitingDepositReceipt ||
                writingWithdraw ||
                waitingWithdrawReceipt ||
                (isApprovalNeeded && action === ACTION.STAKE
                  ? !approve
                  : action === ACTION.WITHDRAW
                  ? !withdraw
                  : !deposit)
              }
              onClick={
                isApprovalNeeded && action === ACTION.STAKE
                  ? () => approve?.()
                  : action === ACTION.WITHDRAW
                  ? () => withdraw?.()
                  : () => deposit?.()
              }
              className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-cyan p-5 text-center font-medium text-black transition-colors hover:bg-cyan/80 focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
            >
              {writingApprove ||
              isFetchingAllowance ||
              waitingApprovalReceipt ||
              writingDeposit ||
              waitingDepositReceipt ||
              writingWithdraw ||
              waitingWithdrawReceipt
                ? "Loading..."
                : isApprovalNeeded && action === ACTION.STAKE
                ? "Approve"
                : action === ACTION.WITHDRAW
                ? "Withdraw"
                : "Stake"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
