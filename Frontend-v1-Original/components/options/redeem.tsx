import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAccount,
  useSwitchNetwork,
  useNetwork,
  useWaitForTransaction,
} from "wagmi";
import { parseEther, parseUnits } from "viem";
import { pulsechain } from "viem/chains";
import { InfoOutlined, Check } from "@mui/icons-material";
import dayjs from "dayjs";

import * as Tooltip from "@radix-ui/react-tooltip";
import * as Tabs from "@radix-ui/react-tabs";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Separator from "@radix-ui/react-separator";

import { formatCurrency } from "../../utils/utils";
import { QUERY_KEYS } from "../../stores/constants/constants";

import {
  useOptionTokenExercise,
  usePrepareOptionTokenExercise,
  usePrepareOptionTokenExerciseLp,
  useOptionTokenExerciseLp,
  useOptionTokenGetLockDurationForLpDiscount,
  usePrepareOptionTokenExerciseVe,
  useOptionTokenExerciseVe,
} from "../../lib/wagmiGen";

import { Slider } from "./slider";
import {
  useAmountToPayLiquid,
  useAmountToPayVest,
  useAmountToPayLP,
  INPUT,
  INPUT_TYPE,
  useInputs,
  isValidInput,
  useTokenData,
  useNow,
  useDiscountsData,
  useDiscountTimer,
  useAllowance,
  useStakeData,
} from "./lib";

export function Redeem() {
  const { optionTokenSymbol, paymentTokenSymbol, underlyingTokenSymbol } =
    useTokenData();

  const [TABS] = useState({
    LP: `${paymentTokenSymbol}/${underlyingTokenSymbol} LP`,
    VEST: `ve${underlyingTokenSymbol}`,
    LIQUID: `${underlyingTokenSymbol}`,
  });
  const now = useNow();
  const [tab, setTab] = useState<(typeof TABS)[keyof typeof TABS]>(TABS.LP);

  const { setActiveInput, setOption, setPayment } = useInputs();

  const handleTabChange = (value: string) => {
    setOption("");
    setPayment("");
    setActiveInput(INPUT.OPTION);
    switch (value) {
      case TABS.LP:
        setTab(TABS.LP);
        break;
      case TABS.VEST:
        setTab(TABS.VEST);
        break;
      case TABS.LIQUID:
        setTab(TABS.LIQUID);
        break;
    }
  };

  return (
    <Tabs.Root
      className="flex w-96 min-w-[384px] flex-col border border-primary p-5 font-sono text-lime-50 md:w-[512px] md:min-w-[512px]"
      value={tab}
      onValueChange={handleTabChange}
    >
      <h1 className="mb-5 text-center text-xl">
        Redeem {optionTokenSymbol} Into
      </h1>
      <Tabs.List className="flex shrink-0" aria-label="Manage your account">
        {Object.values(TABS).map((tab) => (
          <Tabs.Trigger
            key={tab}
            value={tab}
            className="flex h-[45px] flex-1 cursor-pointer select-none items-center justify-center bg-primaryBg px-5 text-sm leading-none text-secondary outline-none hover:text-violet-100 radix-state-active:relative radix-state-active:text-cyan radix-state-active:shadow-[0_0_0_2px] radix-state-active:shadow-black"
          >
            {tab}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <Tabs.Content className="mt-3 grow" value={TABS.LP}>
        <RedeemLP now={now} />
      </Tabs.Content>
      <Tabs.Content className="mt-3 grow" value={TABS.VEST}>
        <RedeemVest now={now} />
      </Tabs.Content>
      <Tabs.Content className="mt-3 grow" value={TABS.LIQUID}>
        <RedeemLiquid now={now} />
      </Tabs.Content>
    </Tabs.Root>
  );
}

function RedeemLiquid({ now }: { now: number }) {
  const queryClient = useQueryClient();
  const {
    option,
    payment,
    activeInput,
    setActiveInput,
    setOption,
    setPayment,
  } = useInputs();
  const maxPayment = (parseFloat(payment) * 1.01).toString();

  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({
    chainId: pulsechain.id,
  });

  const { address } = useAccount();

  const {
    paymentBalance,
    optionBalance,
    optionPrice,
    discountedPrice,
    isFetchingBalances,
    refetchBalances,
    optionTokenSymbol,
    paymentTokenSymbol,
    paymentTokenDecimals,
    underlyingTokenSymbol,
  } = useTokenData();

  const { discount } = useDiscountsData();

  const { isFetching: isFetchingAmounts } = useAmountToPayLiquid();

  const {
    isApprovalNeeded,
    approve,
    isFetching: isFetchingAllowanceOrApproving,
  } = useAllowance();

  const { config: exerciseOptionConfig } = usePrepareOptionTokenExercise({
    args: [
      isValidInput(option) ? parseEther(option as `${number}`) : 0n,
      isValidInput(payment, paymentTokenDecimals) &&
      isValidInput(maxPayment, paymentTokenDecimals)
        ? parseUnits(maxPayment, paymentTokenDecimals)
        : 0n,
      address!,
      BigInt(now + 1e3 * 60 * 5),
    ],
    enabled:
      !!address &&
      isValidInput(payment, paymentTokenDecimals) &&
      isValidInput(maxPayment, paymentTokenDecimals) &&
      isValidInput(option) &&
      !isApprovalNeeded,
  });
  const {
    write: redeem,
    data: txResponse,
    isLoading: writingExercise,
  } = useOptionTokenExercise(exerciseOptionConfig);
  const { isFetching: waitingRedeemReceipt } = useWaitForTransaction({
    hash: txResponse?.hash,
    onSuccess() {
      refetchBalances();
      setOption("");
      setPayment("");
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
    },
  });

  const setMax = (input: INPUT_TYPE) => {
    if (input === INPUT.OPTION) {
      if (!optionBalance || parseFloat(optionBalance) === 0) return;
      setActiveInput(INPUT.OPTION);
      return setOption(optionBalance);
    } else if (input === INPUT.PAYMENT) {
      if (!paymentBalance || parseFloat(paymentBalance.formatted) === 0) return;
      setActiveInput(INPUT.PAYMENT);
      return setPayment(paymentBalance.formatted);
    }
  };

  const onOptionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveInput(INPUT.OPTION);
    setOption(e.target.value);
    if (e.target.value === "") setPayment("");
  };

  const onPaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveInput(INPUT.PAYMENT);
    setPayment(e.target.value);
    if (e.target.value === "") setOption("");
  };

  const areInputsEmpty = option === "";
  const insufficientOption =
    optionBalance && parseFloat(option) > parseFloat(optionBalance);
  const insufficientPayment =
    paymentBalance &&
    parseFloat(payment) > parseFloat(paymentBalance?.formatted);
  return (
    <>
      <div className="flex items-center justify-between">
        <div>{paymentTokenSymbol} balance</div>
        <div>
          {formatCurrency(paymentBalance?.formatted)} {paymentTokenSymbol}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>{optionTokenSymbol} balance</div>
        <div>
          {formatCurrency(optionBalance)} {optionTokenSymbol}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>Strike price</div>
        <div>
          {formatCurrency(discountedPrice)} {paymentTokenSymbol}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>{underlyingTokenSymbol} price</div>
        <div>
          {formatCurrency(optionPrice)} {paymentTokenSymbol}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>Discount</div>
        <div>{formatCurrency(discount)} %</div>
      </div>
      <div className="my-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div
            data-content={`${optionTokenSymbol} to redeem`}
            className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
              areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
            } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-[attr(data-content)]`}
          >
            <input
              value={option}
              onChange={onOptionInputChange}
              className={`w-full border-none bg-transparent p-4 text-left text-base focus:outline focus:outline-1 ${
                (!isValidInput(option) && option !== "") || insufficientOption
                  ? "text-error focus:outline-error focus-visible:outline-error"
                  : "focus:outline-secondary focus-visible:outline-secondary"
              }`}
              placeholder={`You redeem 0.00 ${optionTokenSymbol}`}
            />
          </div>
          <button className="p-4" onClick={() => setMax(INPUT.OPTION)}>
            MAX
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div
            data-content={`${paymentTokenSymbol} to pay`}
            className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
              areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
            } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-[attr(data-content)]`}
          >
            <input
              value={payment}
              onChange={onPaymentInputChange}
              className={`w-full border-none bg-transparent p-4 text-left text-base focus:outline focus:outline-1 ${
                (!isValidInput(payment, paymentTokenDecimals) &&
                  payment !== "") ||
                insufficientPayment
                  ? "text-error focus:outline-error focus-visible:outline-error"
                  : "focus:outline-secondary focus-visible:outline-secondary"
              }`}
              placeholder={`You pay 0.00 ${paymentTokenSymbol}`}
            />
          </div>
          <button className="p-4" onClick={() => setMax(INPUT.PAYMENT)}>
            MAX
          </button>
        </div>
        <div
          data-content={`${underlyingTokenSymbol} to receive`}
          className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
            areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
          } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-[attr(data-content)]`}
        >
          <input
            readOnly
            value={option}
            className="w-full border-none bg-transparent p-4 text-left text-base read-only:cursor-not-allowed focus:outline focus:outline-1 focus:outline-secondary focus-visible:outline-secondary"
            placeholder={`You get 0.00 ${underlyingTokenSymbol}`}
          />
        </div>
        {chain?.unsupported ? (
          <button
            className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium text-black transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
            onClick={() => switchNetwork?.()}
          >
            Switch to pulse
          </button>
        ) : (
          <>
            <button
              disabled={
                (activeInput === INPUT.OPTION && !isValidInput(option)) ||
                (activeInput === INPUT.PAYMENT &&
                  !isValidInput(payment, paymentTokenDecimals)) ||
                (isApprovalNeeded ? !approve : !redeem) ||
                isFetchingAmounts ||
                isFetchingBalances ||
                isFetchingAllowanceOrApproving ||
                writingExercise ||
                waitingRedeemReceipt
              }
              onClick={isApprovalNeeded ? () => approve?.() : () => redeem?.()}
              className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium text-black transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
            >
              {isFetchingAllowanceOrApproving ||
              waitingRedeemReceipt ||
              writingExercise ||
              isFetchingAmounts
                ? "Loading..."
                : isApprovalNeeded
                ? "Approve"
                : `Redeem into ${underlyingTokenSymbol}`}
            </button>
          </>
        )}
      </div>
      <Tooltip.Root>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            Max payment{" "}
            <Tooltip.Trigger>
              <InfoOutlined />
            </Tooltip.Trigger>
          </div>
          <div>
            {formatCurrency((parseFloat(payment) * 1.01).toString())}{" "}
            {paymentTokenSymbol}
          </div>
        </div>
        <Tooltip.Portal>
          <Tooltip.Content
            className="radix-state-delayed-open:radix-side-bottom:animate-slideUpAndFade radix-state-delayed-open:radix-side-left:animate-slideRightAndFade radix-state-delayed-open:radix-side-top:animate-slideDownAndFade select-none border border-accent bg-primaryBg px-4 py-2 leading-none text-secondary shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity] max-w-radix-tooltip-content-available-width radix-state-delayed-open:radix-side-right:animate-slideLeftAndFade"
            sideOffset={5}
          >
            We take into account 1% slippage
            <Tooltip.Arrow className="fill-accent" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </>
  );
}

function RedeemLP({ now }: { now: number }) {
  const queryClient = useQueryClient();
  const [increaseAccepted, setIncreaseAccepted] = useState(false);

  const {
    option,
    payment,
    activeInput,
    setActiveInput,
    setOption,
    setPayment,
  } = useInputs();
  const maxPayment = (parseFloat(payment) * 1.01).toString();

  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({
    chainId: pulsechain.id,
  });

  const { address } = useAccount();

  const { maxLpDiscount, minLpDiscount } = useDiscountsData();

  const [lpDiscount, setLpDiscount] = useState(100);

  useEffect(() => {
    if (maxLpDiscount) {
      setLpDiscount(maxLpDiscount);
    }
  }, [maxLpDiscount]);

  const {
    data: durationForDiscount,
    isFetching: isFetchingDurationForDiscount,
  } = useOptionTokenGetLockDurationForLpDiscount({
    args: [BigInt(100 - lpDiscount)],
    cacheTime: 0,
    select(data) {
      return Number(data);
    },
  });

  const { days, hours, minutes } = useDiscountTimer(durationForDiscount ?? 0);

  const {
    paymentBalance,
    optionBalance,
    optionPrice,
    discountedLpPrice,
    isFetchingBalances,
    refetchBalances,
    optionTokenSymbol,
    paymentTokenSymbol,
    paymentTokenDecimals,
    underlyingTokenSymbol,
  } = useTokenData(lpDiscount);
  const { refetch: refetchStakedData, stakedLockEnd } = useStakeData();
  const isSelectedDurationLessThanLockEnd =
    !!stakedLockEnd &&
    !!durationForDiscount &&
    stakedLockEnd > dayjs().second(durationForDiscount).unix();
  const isSelectedDurationMoreThanLockEnd =
    !!stakedLockEnd &&
    !!durationForDiscount &&
    stakedLockEnd < dayjs().second(durationForDiscount).unix();

  const {
    isFetching: isFetchingAmounts,
    paymentAmount,
    addLiquidityAmount,
  } = useAmountToPayLP(lpDiscount);
  const maxPaymentAmountForExercise = (
    parseFloat(paymentAmount ?? "0") * 1.01
  ).toString();

  const {
    isApprovalNeeded,
    approve,
    isFetching: isFetchingAllowanceOrApproving,
  } = useAllowance();

  const { config: exerciseLPOptionConfig } = usePrepareOptionTokenExerciseLp({
    args: [
      isValidInput(option) ? parseEther(option as `${number}`) : 0n,
      isValidInput(maxPaymentAmountForExercise, paymentTokenDecimals)
        ? parseUnits(maxPaymentAmountForExercise, paymentTokenDecimals)
        : 0n,
      address!,
      BigInt(100 - lpDiscount),
      BigInt(now + 1e3 * 60 * 5),
    ],
    enabled:
      !!address &&
      !!paymentAmount &&
      isValidInput(maxPaymentAmountForExercise, paymentTokenDecimals) &&
      isValidInput(option) &&
      !isApprovalNeeded,
  });
  const {
    write: redeemLP,
    data: txResponseLP,
    isLoading: writingExerciseLP,
  } = useOptionTokenExerciseLp(exerciseLPOptionConfig);

  const { isFetching: waitingRedeemReceipt } = useWaitForTransaction({
    hash: txResponseLP?.hash,
    onSuccess() {
      refetchBalances();
      setOption("");
      setPayment("");
      refetchStakedData();
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
    },
  });

  const setMax = (input: INPUT_TYPE) => {
    if (input === INPUT.OPTION) {
      if (!optionBalance || parseFloat(optionBalance) === 0) return;
      setActiveInput(INPUT.OPTION);
      return setOption(optionBalance);
    } else if (input === INPUT.PAYMENT) {
      if (!paymentBalance || parseFloat(paymentBalance.formatted) === 0) return;
      setActiveInput(INPUT.PAYMENT);
      return setPayment(paymentBalance.formatted);
    }
  };

  const onOptionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveInput(INPUT.OPTION);
    setOption(e.target.value);
    if (e.target.value === "") setPayment("");
  };

  const areInputsEmpty = option === "";
  const insufficientOption =
    optionBalance && parseFloat(option) > parseFloat(optionBalance);
  const insufficientPayment =
    paymentBalance &&
    parseFloat(payment) > parseFloat(paymentBalance?.formatted);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>{paymentTokenSymbol} balance</div>
        <div>
          {formatCurrency(paymentBalance?.formatted)} {paymentTokenSymbol}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>{optionTokenSymbol} balance</div>
        <div>
          {formatCurrency(optionBalance)} {optionTokenSymbol}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>Strike price</div>
        <div>
          {formatCurrency(discountedLpPrice)} {paymentTokenSymbol}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>{underlyingTokenSymbol} price</div>
        <div>
          {formatCurrency(optionPrice)} {paymentTokenSymbol}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>LP Discount</div>
        <div>{formatCurrency(lpDiscount)} %</div>
      </div>
      <div
        className={`flex items-center justify-between ${
          isFetchingDurationForDiscount && "animate-pulse"
        }`}
      >
        <div>LP lock duration for discount</div>
        <div>
          {days}d {hours}h {minutes}m
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span>{minLpDiscount}%(min)</span>
        <Slider
          value={[lpDiscount]}
          onValueChange={(e) => setLpDiscount(e[0])}
          min={minLpDiscount ?? 0}
          max={maxLpDiscount ?? 100}
          className="relative flex h-5 flex-grow touch-none select-none items-center"
        />
        <span>{maxLpDiscount}%(max)</span>
      </div>
      <div className="my-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div
            data-content={`${optionTokenSymbol} to redeem`}
            className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
              areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
            } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-[attr(data-content)]`}
          >
            <input
              value={option}
              onChange={onOptionInputChange}
              className={`w-full border-none bg-transparent p-4 text-left text-base focus:outline focus:outline-1 ${
                (!isValidInput(option) && option !== "") || insufficientOption
                  ? "text-error focus:outline-error focus-visible:outline-error"
                  : "focus:outline-secondary focus-visible:outline-secondary"
              }`}
              placeholder={`You redeem 0.00 ${optionTokenSymbol}`}
            />
          </div>
          <button className="p-4" onClick={() => setMax(INPUT.OPTION)}>
            MAX
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div
            data-content={`${paymentTokenSymbol} to pay`}
            className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
              areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
            } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-[attr(data-content)]`}
          >
            <input
              value={payment}
              readOnly
              className={`w-full border-none bg-transparent p-4 text-left text-base read-only:cursor-not-allowed focus:outline focus:outline-1 ${
                (!isValidInput(payment, paymentTokenDecimals) &&
                  payment !== "") ||
                insufficientPayment
                  ? "text-error focus:outline-error focus-visible:outline-error"
                  : "focus:outline-secondary focus-visible:outline-secondary"
              }`}
              placeholder={`You pay 0.00 ${paymentTokenSymbol}`}
            />
          </div>
        </div>
        <div
          data-content={`${underlyingTokenSymbol} to receive`}
          className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
            areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
          } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-[attr(data-content)]`}
        >
          <input
            readOnly
            value={option}
            className="w-full border-none bg-transparent p-4 text-left text-base read-only:cursor-not-allowed focus:outline focus:outline-1 focus:outline-secondary focus-visible:outline-secondary"
            placeholder={`You get 0.00 ${underlyingTokenSymbol}`}
          />
        </div>
        {isSelectedDurationLessThanLockEnd && (
          <div className="flex flex-col items-start justify-center text-warning">
            <div className="uppercase">WARNING</div>
            <div className="text-sm">
              You already have a staked position expires on{" "}
              {dayjs.unix(stakedLockEnd).format("YYYY-MM-DD HH[:]mm")}. You can
              only redeem with same lock or longer.
            </div>
          </div>
        )}
        {isSelectedDurationMoreThanLockEnd && (
          <div className="flex flex-col items-start justify-center text-warning">
            <div className="uppercase">WARNING</div>
            <div className="text-sm">
              You are going to increase your lock end from{" "}
              <span className="tracking-tighter">
                {dayjs.unix(stakedLockEnd).format("YYYY-MM-DD HH[:]mm")}
              </span>{" "}
              to{" "}
              <span className="tracking-tighter">
                {dayjs()
                  .second(durationForDiscount)
                  .format("YYYY-MM-DD HH[:]mm")}
              </span>
              .
            </div>
            <div className="my-3 flex items-center">
              <Checkbox.Root
                className="flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-[4px] border-2 border-solid border-secondary outline-none radix-state-checked:bg-secondary"
                checked={increaseAccepted}
                onCheckedChange={() =>
                  setIncreaseAccepted((prevChecked) => !prevChecked)
                }
                id="increaseAcceptance"
              >
                <Checkbox.Indicator className="text-lime-50">
                  <Check />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label
                className="cursor-pointer pl-[15px] text-[15px] leading-none text-white"
                htmlFor="increaseAcceptance"
              >
                Accept lock duration increase
              </label>
            </div>
          </div>
        )}
        {chain?.unsupported ? (
          <button
            className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium text-black transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
            onClick={() => switchNetwork?.()}
          >
            Switch to pulse
          </button>
        ) : (
          <button
            disabled={
              (activeInput === INPUT.OPTION && !isValidInput(option)) ||
              (activeInput === INPUT.PAYMENT &&
                !isValidInput(payment, paymentTokenDecimals)) ||
              (isApprovalNeeded ? !approve : !redeemLP) ||
              isFetchingAmounts ||
              isFetchingBalances ||
              isFetchingAllowanceOrApproving ||
              writingExerciseLP ||
              waitingRedeemReceipt ||
              isSelectedDurationLessThanLockEnd ||
              (isSelectedDurationMoreThanLockEnd && !increaseAccepted)
            }
            onClick={isApprovalNeeded ? () => approve?.() : () => redeemLP?.()}
            className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium text-black transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
          >
            {waitingRedeemReceipt ||
            writingExerciseLP ||
            isFetchingAmounts ||
            isFetchingAllowanceOrApproving
              ? "Loading..."
              : isApprovalNeeded
              ? "Approve"
              : `Redeem into ${paymentTokenSymbol}/${underlyingTokenSymbol} LP`}
          </button>
        )}
        <div className="h-1" />
        <div className="flex flex-col items-start justify-center space-y-2">
          <div className="uppercase">Breakdown</div>
          <div className="text-sm">
            You get {lpDiscount}% discount. There is additional token transfer
            for LP creation.
          </div>
          <div className="w-full">
            <div className="flex w-full items-center justify-between text-sm">
              <div>To redeem option</div>
              <div>
                {formatCurrency(paymentAmount)} {paymentTokenSymbol}
              </div>
            </div>
            <div className="flex w-full items-center justify-between text-sm">
              <div>To create LP</div>
              <div>
                {formatCurrency(addLiquidityAmount)} {paymentTokenSymbol}
              </div>
            </div>
            <Tooltip.Root>
              <div className="flex w-full items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  Max payment{" "}
                  <Tooltip.Trigger>
                    <InfoOutlined className="w-5" />
                  </Tooltip.Trigger>
                </div>
                <div>
                  {formatCurrency(maxPayment)} {paymentTokenSymbol}
                </div>
              </div>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="radix-state-delayed-open:radix-side-bottom:animate-slideUpAndFade radix-state-delayed-open:radix-side-left:animate-slideRightAndFade radix-state-delayed-open:radix-side-top:animate-slideDownAndFade select-none border border-accent bg-primaryBg px-4 py-2 text-sm leading-none text-secondary shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity] max-w-radix-tooltip-content-available-width radix-state-delayed-open:radix-side-right:animate-slideLeftAndFade"
                  sideOffset={5}
                >
                  We take into account 1% slippage
                  <Tooltip.Arrow className="fill-accent" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>
        </div>
      </div>
    </>
  );
}

function RedeemVest({ now }: { now: number }) {
  const queryClient = useQueryClient();
  const {
    option,
    payment,
    activeInput,
    setActiveInput,
    setOption,
    setPayment,
  } = useInputs();
  const maxPayment = (parseFloat(payment) * 1.01).toString();

  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({
    chainId: pulsechain.id,
  });

  const { address } = useAccount();

  const {
    paymentBalance,
    optionBalance,
    optionPrice,
    discountedVePrice,
    isFetchingBalances,
    refetchBalances,
    optionTokenSymbol,
    paymentTokenSymbol,
    paymentTokenDecimals,
    underlyingTokenSymbol,
  } = useTokenData();

  const { veDiscount } = useDiscountsData();

  const { isFetching: isFetchingAmounts } = useAmountToPayVest();

  const {
    isApprovalNeeded,
    approve,
    isFetching: isFetchingAllowanceOrApproving,
  } = useAllowance();

  const { config: exerciseVeOptionConfig } = usePrepareOptionTokenExerciseVe({
    args: [
      isValidInput(option) ? parseEther(option as `${number}`) : 0n,
      isValidInput(payment, paymentTokenDecimals) &&
      isValidInput(maxPayment, paymentTokenDecimals)
        ? parseUnits(maxPayment, paymentTokenDecimals)
        : 0n,
      address!,
      BigInt(now + 1e3 * 60 * 5),
    ],
    enabled:
      !!address &&
      isValidInput(payment, paymentTokenDecimals) &&
      isValidInput(maxPayment, paymentTokenDecimals) &&
      isValidInput(option) &&
      !isApprovalNeeded,
  });
  const {
    write: redeemVe,
    data: txResponse,
    isLoading: writingExercise,
  } = useOptionTokenExerciseVe(exerciseVeOptionConfig);
  const { isFetching: waitingRedeemReceipt } = useWaitForTransaction({
    hash: txResponse?.hash,
    onSuccess() {
      refetchBalances();
      setOption("");
      setPayment("");
      queryClient.invalidateQueries([QUERY_KEYS.BASE_ASSET_INFO]);
    },
  });

  const setMax = (input: INPUT_TYPE) => {
    if (input === INPUT.OPTION) {
      if (!optionBalance || parseFloat(optionBalance) === 0) return;
      setActiveInput(INPUT.OPTION);
      return setOption(optionBalance);
    } else if (input === INPUT.PAYMENT) {
      if (!paymentBalance || parseFloat(paymentBalance.formatted) === 0) return;
      setActiveInput(INPUT.PAYMENT);
      return setPayment(paymentBalance.formatted);
    }
  };

  const onOptionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveInput(INPUT.OPTION);
    setOption(e.target.value);
    if (e.target.value === "") setPayment("");
  };

  const onPaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveInput(INPUT.PAYMENT);
    setPayment(e.target.value);
    if (e.target.value === "") setOption("");
  };

  const areInputsEmpty = option === "";
  const insufficientOption =
    optionBalance && parseFloat(option) > parseFloat(optionBalance);
  const insufficientPayment =
    paymentBalance &&
    parseFloat(payment) > parseFloat(paymentBalance?.formatted);
  return (
    <>
      <div className="flex items-center justify-between">
        <div>{paymentTokenSymbol} balance</div>
        <div>
          {formatCurrency(paymentBalance?.formatted)} {paymentTokenSymbol}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>{optionTokenSymbol} balance</div>
        <div>
          {formatCurrency(optionBalance)} {optionTokenSymbol}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>Strike price</div>
        <div>
          {formatCurrency(discountedVePrice)} {paymentTokenSymbol}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>{underlyingTokenSymbol} price</div>
        <div>
          {formatCurrency(optionPrice)} {paymentTokenSymbol}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>Discount</div>
        <div>{formatCurrency(veDiscount)} %</div>
      </div>
      <div className="my-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div
            data-content={`${optionTokenSymbol} to redeem`}
            className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
              areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
            } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-[attr(data-content)]`}
          >
            <input
              value={option}
              onChange={onOptionInputChange}
              className={`w-full border-none bg-transparent p-4 text-left text-base focus:outline focus:outline-1 ${
                (!isValidInput(option) && option !== "") || insufficientOption
                  ? "text-error focus:outline-error focus-visible:outline-error"
                  : "focus:outline-secondary focus-visible:outline-secondary"
              }`}
              placeholder={`You redeem 0.00 ${optionTokenSymbol}`}
            />
          </div>
          <button className="p-4" onClick={() => setMax(INPUT.OPTION)}>
            MAX
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div
            data-content={`${paymentTokenSymbol} to pay`}
            className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
              areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
            } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-[attr(data-content)]`}
          >
            <input
              value={payment}
              onChange={onPaymentInputChange}
              className={`w-full border-none bg-transparent p-4 text-left text-base focus:outline focus:outline-1 ${
                (!isValidInput(payment, paymentTokenDecimals) &&
                  payment !== "") ||
                insufficientPayment
                  ? "text-error focus:outline-error focus-visible:outline-error"
                  : "focus:outline-secondary focus-visible:outline-secondary"
              }`}
              placeholder={`You pay 0.00 ${paymentTokenSymbol}`}
            />
          </div>
          <button className="p-4" onClick={() => setMax(INPUT.PAYMENT)}>
            MAX
          </button>
        </div>
        <div
          data-content={`ve${underlyingTokenSymbol} to receive`}
          className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
            areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
          } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-[attr(data-content)]`}
        >
          <input
            readOnly
            value={option}
            className="w-full border-none bg-transparent p-4 text-left text-base read-only:cursor-not-allowed focus:outline focus:outline-1 focus:outline-secondary focus-visible:outline-secondary"
            placeholder={`You get 0.00 ve${underlyingTokenSymbol}`}
          />
        </div>
        {chain?.unsupported ? (
          <button
            className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium text-black transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
            onClick={() => switchNetwork?.()}
          >
            Switch to pulse
          </button>
        ) : (
          <>
            <button
              disabled={
                (activeInput === INPUT.OPTION && !isValidInput(option)) ||
                (activeInput === INPUT.PAYMENT &&
                  !isValidInput(payment, paymentTokenDecimals)) ||
                (isApprovalNeeded ? !approve : !redeemVe) ||
                isFetchingAmounts ||
                isFetchingBalances ||
                isFetchingAllowanceOrApproving ||
                writingExercise ||
                waitingRedeemReceipt
              }
              onClick={
                isApprovalNeeded ? () => approve?.() : () => redeemVe?.()
              }
              className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium text-black transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
            >
              {isFetchingAllowanceOrApproving ||
              waitingRedeemReceipt ||
              writingExercise ||
              isFetchingAmounts
                ? "Loading..."
                : isApprovalNeeded
                ? "Approve"
                : `Redeem into ve${underlyingTokenSymbol}`}
            </button>
          </>
        )}
      </div>
      <div className="mb-2 flex flex-col items-start justify-center">
        Redeeming into vest will create you a new max locked veNFT. It is
        possible to merge it into single veNFT on Vest page after.
      </div>
      <Tooltip.Root>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            Max payment{" "}
            <Tooltip.Trigger>
              <InfoOutlined />
            </Tooltip.Trigger>
          </div>
          <div>
            {formatCurrency((parseFloat(payment) * 1.01).toString())}{" "}
            {paymentTokenSymbol}
          </div>
        </div>
        <Tooltip.Portal>
          <Tooltip.Content
            className="radix-state-delayed-open:radix-side-bottom:animate-slideUpAndFade radix-state-delayed-open:radix-side-left:animate-slideRightAndFade radix-state-delayed-open:radix-side-top:animate-slideDownAndFade select-none border border-accent bg-primaryBg px-4 py-2 leading-none text-secondary shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity] max-w-radix-tooltip-content-available-width radix-state-delayed-open:radix-side-right:animate-slideLeftAndFade"
            sideOffset={5}
          >
            We take into account 1% slippage
            <Tooltip.Arrow className="fill-accent" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </>
  );
}
