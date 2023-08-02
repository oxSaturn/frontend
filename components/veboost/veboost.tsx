import { useAccount, useBalance, useWaitForTransaction } from "wagmi";
import { formatEther, parseUnits } from "viem";
import { useState } from "react";
import { InfoOutlined } from "@mui/icons-material";
import dayjs from "dayjs";

import { LoadingSVG } from "../common/LoadingSVG";
import { Tooltip } from "../common/radixTooltip";

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
  useVeBoosterBoostedEvent,
} from "../../lib/wagmiGen";
import { formatCurrency } from "../../utils/utils";
import {
  GOV_TOKEN_SYMBOL,
  VE_BOOSTER_ADRRESS,
} from "../../stores/constants/contracts";

import { W_NATIVE_SYMBOL } from "../../stores/constants/constants";

import { useLatestTxs } from "./lib/useLatestTx";
import { useEligibleAirdropAmount } from "./lib/useEligibleAirdropAmount";
import {
  AIRDROP_SUPPLY,
  BOOSTED_LOADED,
  calculateAirdropAmount,
} from "./lib/calculateAirdropAmount";
import { useAirdropValues } from "./lib/useAirdropValues";

export function VeBoost() {
  const { address } = useAccount();

  const [amount, setAmount] = useState("");
  const { latestTxs, addTx } = useLatestTxs();

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

  const { data: boostedTotal, isFetching: isFetchingBoostedTotal } =
    useVeBoosterGetExpectedAmount({
      args: [parseUnits(amount, decimals!)],
      enabled: !!amount && !!decimals,
      select: (boostedTotal) => formatEther(boostedTotal),
    });

  const { data: balanceInBooster } = useVeBoosterBalanceOfFlow({
    watch: true,
    select: (balance) => formatEther(balance),
  });

  const { data: paymentBalance, refetch: refetchPaymentBalance } = useBalance({
    address: address!,
    token: paymentToken,
    enabled: !!paymentToken && !!address,
  });

  const {
    data: eligibleAmount,
    isLoading: isLoadingEligibleAmount,
    refetch: refetchEligibleAirdropAmount,
  } = useEligibleAirdropAmount();
  const { data: airdropValues } = useAirdropValues();

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
    isLoading: isWritingBuy,
  } = useVeBoosterBoostedBuyAndVeLock(boostedBillConfig);

  const { isFetching: waitingBuyReceipt } = useWaitForTransaction({
    hash: boostedBuyTx?.hash,
    onSuccess: () => {
      setAmount("");
      refetchPaymentBalance();
      refetchAllowance();
      refetchEligibleAirdropAmount();
    },
  });

  useVeBoosterBoostedEvent({
    listener: (events) => {
      if (events.length > 0)
        events.forEach((event) => {
          addTx({
            hash: event.transactionHash,
            amount: formatEther(event.args._totalLocked ?? 0n),
            timestamp: event.args._timestamp?.toString(),
          });
        });
    },
  });

  const boostedAmount =
    boostedTotal && matchRate
      ? parseFloat(boostedTotal) -
        parseFloat(boostedTotal) / (1 + parseFloat(matchRate) / 100)
      : 0;
  const eligibleIfBuy = calculateAirdropAmount(boostedTotal);
  const eligibleDisplay = eligibleIfBuy + (eligibleAmount ?? 0);

  return (
    <div className="font-sono">
      <h1 className="text-3xl text-center">
        Buy ve{GOV_TOKEN_SYMBOL} with {symbol} and get {matchRate}% boost
      </h1>
      <div className="flex flex-wrap items-stretch justify-center gap-5">
        <div className="flex w-96 min-w-[384px] flex-col gap-2 rounded-md p-5 text-lime-50 md:w-[512px] md:min-w-[512px]">
          <div className="space-y-5">
            <div className="bg-green-900 space-y-3 p-5 border border-cyan-900/70 rounded-md">
              <div className="flex justify-between">
                <h2 className="text-2xl text-white">
                  Buy boosted ve{GOV_TOKEN_SYMBOL}
                </h2>
                <Tooltip
                  content={`This transaction will take the amount of ${W_NATIVE_SYMBOL} chosen and use it to market buy ${GOV_TOKEN_SYMBOL}, then match it with ${GOV_TOKEN_SYMBOL} at the rate displayed, and lock all of that in a new ve${GOV_TOKEN_SYMBOL} NFT into your wallet.`}
                >
                  <InfoOutlined />
                </Tooltip>
              </div>
              <div className="flex justify-between">
                <span>AIRDROP AMOUNT</span>
                <span>
                  {isLoadingEligibleAmount ? (
                    <LoadingSVG className="animate-spin h-5 w-5 ml-1" />
                  ) : (
                    formatCurrency(eligibleDisplay)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Current boost</span>
                <span>{formatCurrency(matchRate)} %</span>
              </div>
              <div className="flex justify-between">
                <span>Booster balance</span>
                <span>
                  {formatCurrency(balanceInBooster)} {GOV_TOKEN_SYMBOL}
                </span>
              </div>
              <div
                className={`flex justify-between ${
                  isFetchingBoostedTotal && "animate-pulse"
                }`}
              >
                <span>Boosted ve{GOV_TOKEN_SYMBOL} amount</span>
                <span>{formatCurrency(boostedAmount)}</span>
              </div>
              <div
                className={`flex justify-between ${
                  isFetchingBoostedTotal && "animate-pulse"
                }`}
              >
                <span>Total ve{GOV_TOKEN_SYMBOL} amount</span>
                <span>{formatCurrency(boostedTotal)}</span>
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
                    waitingBuyReceipt || isWritingBuy ? (
                      <button
                        className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-cyan p-5 text-center font-medium text-black transition-colors hover:bg-cyan/80 focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
                        disabled
                      >
                        Buying ve{GOV_TOKEN_SYMBOL}{" "}
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
              <div className="space-y-1">
                <h2 className="text-2xl text-white">Latest boosted buys</h2>
                {latestTxs.length > 0 &&
                  latestTxs.map((tx) => (
                    <div key={tx.hash} className="flex justify-between">
                      <span>
                        {formatCurrency(tx.amount)} ve{GOV_TOKEN_SYMBOL}
                      </span>
                      <span>
                        {dayjs.unix(parseInt(tx.timestamp ?? "0")).fromNow()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-96 min-w-[384px] flex-col gap-2 rounded-md p-5 font-sono text-lime-50 md:w-[512px] md:min-w-[512px]">
          <div className="bg-green-900 space-y-3 p-5 border border-cyan-900/70 rounded-md">
            <h2 className="mb-5 text-xl">Airdrop Explainer</h2>
            <p>
              For every 1 ve{GOV_TOKEN_SYMBOL} you got boosted, you will get an
              airdrop of option tokens on Base and Mantle Velocimeter instances.
            </p>
            <p>
              Your eligible amount so far is{" "}
              {isLoadingEligibleAmount ? (
                <LoadingSVG className="animate-spin h-2 w-2 inline" />
              ) : (
                `${formatCurrency(eligibleDisplay)}`
              )}{" "}
              on each Base and Mantle.
            </p>
            <div>
              <p>Your airdrop current value:</p>
              <ul>
                <li className="w-full flex justify-between">
                  on Base{" "}
                  <span className="tracking-tighter">
                    $
                    {formatCurrency(
                      (airdropValues?.baseMinValue ?? 0) * eligibleDisplay,
                      0
                    )}
                    -
                    {formatCurrency(
                      (airdropValues?.baseMaxValue ?? 0) * eligibleDisplay,
                      0
                    )}
                  </span>
                </li>
                <li className="w-full flex justify-between">
                  on Mantle{" "}
                  <span className="tracking-tighter">
                    $
                    {formatCurrency(
                      (airdropValues?.mantleMinValue ?? 0) * eligibleDisplay,
                      0
                    )}
                    -
                    {formatCurrency(
                      (airdropValues?.mantleMaxValue ?? 0) * eligibleDisplay,
                      0
                    )}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <p>Current prices of Velocimeter:</p>
              <ul>
                <li className="w-full flex justify-between">
                  BVM{" "}
                  <span className="tracking-tighter">
                    {airdropValues
                      ? `$${formatCurrency(airdropValues.basePrice)}`
                      : "loading..."}
                  </span>
                </li>
                <li className="w-full flex justify-between">
                  MVM{" "}
                  <span className="tracking-tighter">
                    {airdropValues
                      ? `$${formatCurrency(airdropValues.mantlePrice)}`
                      : "loading..."}
                  </span>
                </li>
              </ul>
            </div>
            <br />
            <code className="flex-none min-w-full text-xs leading-none">
              airdrop_amount = boosted_amount / {BOOSTED_LOADED} *{" "}
              {AIRDROP_SUPPLY}
            </code>
            <br />
          </div>
        </div>
      </div>
    </div>
  );
}
