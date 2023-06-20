import { useEffect, useState } from "react";
import {
  useAccount,
  useBalance,
  useSwitchNetwork,
  useNetwork,
  useWaitForTransaction,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { canto } from "viem/chains";
import { InfoOutlined } from "@mui/icons-material";

import * as Toast from "@radix-ui/react-toast";
import * as Tooltip from "@radix-ui/react-tooltip";

import { formatCurrency } from "../../utils/utils";
import { PRO_OPTIONS } from "../../stores/constants/constants";

import {
  useOAggBalanceOf,
  useOAggDiscount,
  useOAggExercise,
  useOAggGetDiscountedPrice,
  useOAggGetTimeWeightedAveragePrice,
  usePrepareOAggExercise,
  usePrepareErc20Approve,
  useErc20Allowance,
  useErc20Approve,
  usePrepareOAggExerciseLp,
  useOAggExerciseLp,
  useOAggGetLockDurationForLpDiscount,
} from "../../lib/wagmiGen";

import { Slider } from "./slider";
import {
  INPUT,
  INPUT_TYPE,
  useAmountToPay,
  useInputs,
  isValidInput,
} from "./lib/useAmountToPay";
import { useTokenData } from "./lib/useTokenData";
import { useNow } from "./lib/useNow";
import { useDiscountsData } from "./lib/useDiscountsData";

const OPTION_TOKEN_ADDRESS = PRO_OPTIONS.oAGG.token;

export function Redeem() {
  const now = useNow();
  const {
    option,
    payment,
    activeInput,
    setActiveInput,
    setOption,
    setPayment,
  } = useInputs();
  const maxPaymentWpls = (parseFloat(payment) * 1.01).toString();

  const [lpDiscount, setLpDiscount] = useState(80);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastHash, setToastHash] = useState("");

  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({
    chainId: canto.id,
  });

  const { address } = useAccount();

  const { optionTokenSymbol, paymentTokenSymbol, underlyingTokenSymbol } =
    useTokenData();
  const { maxLpDiscount, minLpDiscount } = useDiscountsData();

  const {
    data: durationForDiscount,
    isFetching: isFetchingDurationForDiscount,
  } = useOAggGetLockDurationForLpDiscount({
    args: [BigInt(100 - lpDiscount)],
    cacheTime: 0,
    select(data) {
      return Number(data);
    },
  });

  const { days, hours, minutes } = useTimer(durationForDiscount ?? 0);

  const {
    data: paymentBalance,
    isFetching: isFetchingPaymentBalance,
    refetch: refetchPaymentBalance,
  } = useBalance({
    address,
    token: "0x9f823d534954fc119e31257b3ddba0db9e2ff4ed",
  });

  const { data: optionBalance, refetch: refetchOptionBalance } =
    useOAggBalanceOf({
      args: [address!],
      enabled: !!address,
      select: (data) => formatEther(data),
    });

  const { data: optionPrice } = useOAggGetTimeWeightedAveragePrice({
    args: [parseEther("1")],
    select: (data) => formatEther(data),
  });

  const { data: discountedPrice } = useOAggGetDiscountedPrice({
    args: [parseEther("1")],
    select: (data) => formatEther(data),
  });

  const { data: discount } = useOAggDiscount({
    select: (discount) => (100n - discount).toString(),
  });

  const { isFetching: isFetchingAmounts } = useAmountToPay();

  const {
    data: isApprovalNeeded,
    refetch: refetchAllowance,
    isFetching: isFetchingAllowance,
  } = useErc20Allowance({
    address: "0x9f823d534954fc119e31257b3ddba0db9e2ff4ed",
    args: [address!, OPTION_TOKEN_ADDRESS],
    enabled: !!address,
    select: (allowance) => {
      const formattedAllowance = formatEther(allowance);
      if (!payment) return;
      return parseFloat(formattedAllowance) < parseFloat(payment);
    },
  });

  const { config: approveConfig } = usePrepareErc20Approve({
    address: "0x9f823d534954fc119e31257b3ddba0db9e2ff4ed",
    args: [
      OPTION_TOKEN_ADDRESS,
      isValidInput(payment) && isValidInput(maxPaymentWpls)
        ? parseEther(maxPaymentWpls as `${number}`)
        : 0n,
    ],
    enabled:
      !!address &&
      isApprovalNeeded &&
      !isFetchingAmounts &&
      isValidInput(payment) &&
      isValidInput(maxPaymentWpls),
  });

  const {
    write: approve,
    data: txApproveResponse,
    isLoading: writingApprove,
  } = useErc20Approve({
    ...approveConfig,
    onSuccess(data) {
      setToastMessage("Transaction submitted!");
      setToastOpen(true);
      setToastHash(data.hash);
    },
  });

  const { isFetching: waitingApprovalReceipt } = useWaitForTransaction({
    hash: txApproveResponse?.hash,
    onSuccess(data) {
      setToastMessage("Transaction confirmed!");
      setToastOpen(true);
      setToastHash(data.transactionHash);
      refetchAllowance();
    },
  });

  const { config: exerciseOptionConfig } = usePrepareOAggExercise({
    args: [
      isValidInput(option) ? parseEther(option as `${number}`) : 0n,
      isValidInput(payment) && isValidInput(maxPaymentWpls)
        ? parseEther(maxPaymentWpls as `${number}`)
        : 0n,
      address!,
      BigInt(now + 1e3 * 60 * 5),
    ],
    enabled:
      !!address &&
      isValidInput(payment) &&
      isValidInput(maxPaymentWpls) &&
      isValidInput(option) &&
      !isApprovalNeeded,
  });

  const { config: exerciseLPOptionConfig } = usePrepareOAggExerciseLp({
    args: [
      isValidInput(option) ? parseEther(option as `${number}`) : 0n,
      isValidInput(payment) && isValidInput(maxPaymentWpls)
        ? parseEther(maxPaymentWpls as `${number}`)
        : 0n,
      address!,
      BigInt(100 - lpDiscount),
      BigInt(now + 1e3 * 60 * 5),
    ],
    enabled:
      !!address &&
      isValidInput(payment) &&
      isValidInput(maxPaymentWpls) &&
      isValidInput(option) &&
      !isApprovalNeeded,
  });

  const {
    write: redeem,
    data: txResponse,
    isLoading: writingExercise,
  } = useOAggExercise({
    ...exerciseOptionConfig,
    onSuccess(data) {
      setToastMessage("Transaction submitted!");
      setToastOpen(true);
      setToastHash(data.hash);
    },
  });

  const {
    write: redeemLP,
    data: txResponseLP,
    isLoading: writingExerciseLP,
  } = useOAggExerciseLp({
    ...exerciseLPOptionConfig,
    onSuccess(data) {
      setToastMessage("Transaction submitted!");
      setToastOpen(true);
      setToastHash(data.hash);
    },
  });

  const { isFetching: waitingRedeemReceipt } = useWaitForTransaction({
    hash: txResponse?.hash || txResponseLP?.hash,
    onSuccess(data) {
      setToastMessage("Transaction confirmed!");
      setToastOpen(true);
      setToastHash(data.transactionHash);
      refetchPaymentBalance();
      refetchOptionBalance();
      setOption("");
      setPayment("");
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
  const insufficientOFlow =
    optionBalance && parseFloat(option) > parseFloat(optionBalance);
  const insufficientWpls =
    paymentBalance &&
    parseFloat(payment) > parseFloat(paymentBalance?.formatted);

  return (
    <>
      <div className="mt-20 flex w-96 min-w-[384px] flex-col border border-primary p-5 font-sono text-lime-50 md:w-[512px] md:min-w-[512px]">
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
          <div>Liquid Discount</div>
          <div>{formatCurrency(discount)} %</div>
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
          <div>Duration for this discount</div>
          <div>
            {days}d {hours}h {minutes}m
          </div>
        </div>
        <div className="my-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div
              data-content={optionTokenSymbol}
              className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
                areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
              } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-[attr(data-content)]`}
            >
              <input
                value={option}
                onChange={onOptionInputChange}
                className={`w-full border-none bg-transparent p-4 text-left text-base focus:outline focus:outline-1 ${
                  (!isValidInput(option) && option !== "") || insufficientOFlow
                    ? "text-error focus:outline-error focus-visible:outline-error"
                    : "focus:outline-secondary focus-visible:outline-secondary"
                }`}
                placeholder={`0.00 ${optionTokenSymbol}`}
              />
            </div>
            <button className="p-4" onClick={() => setMax(INPUT.OPTION)}>
              MAX
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div
              data-content={paymentTokenSymbol}
              className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
                areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
              } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-[attr(data-content)]`}
            >
              <input
                value={payment}
                onChange={onPaymentInputChange}
                className={`w-full border-none bg-transparent p-4 text-left text-base focus:outline focus:outline-1 ${
                  (!isValidInput(payment) && payment !== "") || insufficientWpls
                    ? "text-error focus:outline-error focus-visible:outline-error"
                    : "focus:outline-secondary focus-visible:outline-secondary"
                }`}
                placeholder={`0.00 ${paymentTokenSymbol}`}
              />
            </div>
            <button className="p-4" onClick={() => setMax(INPUT.PAYMENT)}>
              MAX
            </button>
          </div>
          <div
            data-content={underlyingTokenSymbol}
            className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
              areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
            } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-[attr(data-content)]`}
          >
            <input
              readOnly
              value={option}
              className="w-full border-none bg-transparent p-4 text-left text-base focus:outline focus:outline-1 focus:outline-secondary focus-visible:outline-secondary"
              placeholder={`0.00 ${underlyingTokenSymbol}`}
            />
          </div>
          <Slider
            value={[lpDiscount]}
            onValueChange={(e) => setLpDiscount(e[0])}
            min={minLpDiscount}
            max={maxLpDiscount}
            className="relative flex h-5 touch-none select-none items-center"
          />
          {chain?.unsupported ? (
            <button
              className="text-extendedBlack flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
              onClick={() => switchNetwork?.()}
            >
              Switch to pulse
            </button>
          ) : (
            <>
              <button
                disabled={
                  (activeInput === INPUT.OPTION && !isValidInput(option)) ||
                  (activeInput === INPUT.PAYMENT && !isValidInput(payment)) ||
                  (isApprovalNeeded ? !approve : !redeem) ||
                  isFetchingAmounts ||
                  isFetchingPaymentBalance ||
                  isFetchingAllowance ||
                  writingExercise ||
                  writingExerciseLP ||
                  writingApprove ||
                  waitingApprovalReceipt ||
                  waitingRedeemReceipt
                }
                onClick={
                  isApprovalNeeded ? () => approve?.() : () => redeemLP?.()
                }
                className="text-extendedBlack flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
              >
                {waitingApprovalReceipt ||
                waitingRedeemReceipt ||
                writingExercise ||
                writingExerciseLP ||
                writingApprove ||
                isFetchingAmounts ||
                isFetchingAllowance
                  ? "Loading..."
                  : isApprovalNeeded
                  ? "Approve"
                  : "Redeem into LP"}
              </button>
              <button
                disabled={
                  (activeInput === INPUT.OPTION && !isValidInput(option)) ||
                  (activeInput === INPUT.PAYMENT && !isValidInput(payment)) ||
                  (isApprovalNeeded ? !approve : !redeem) ||
                  isFetchingAmounts ||
                  isFetchingPaymentBalance ||
                  isFetchingAllowance ||
                  writingExercise ||
                  writingExerciseLP ||
                  writingApprove ||
                  waitingApprovalReceipt ||
                  waitingRedeemReceipt
                }
                onClick={
                  isApprovalNeeded ? () => approve?.() : () => redeem?.()
                }
                className="text-extendedBlack flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
              >
                {waitingApprovalReceipt ||
                waitingRedeemReceipt ||
                writingExercise ||
                writingExerciseLP ||
                writingApprove ||
                isFetchingAmounts ||
                isFetchingAllowance
                  ? "Loading..."
                  : isApprovalNeeded
                  ? "Approve"
                  : "Redeem"}
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
      </div>
      <Toast.Root
        className="prose radix-state-closed:animate-hide radix-state-open:animate-slideIn radix-swipe-end:animate-swipeOut rounded-md bg-[#111] p-4 text-left shadow shadow-secondary radix-swipe-cancel:translate-x-0 radix-swipe-cancel:transition-[transform_200ms_ease-out] radix-swipe-move:translate-x-[var(--radix-toast-swipe-move-x)]"
        open={toastOpen}
        onOpenChange={setToastOpen}
      >
        <Toast.Title asChild>
          <h2 className="text-success">Success!</h2>
        </Toast.Title>
        <Toast.Description asChild>
          <p className="text-primary">{toastMessage}</p>
        </Toast.Description>
        <Toast.Action
          className="[grid-area:_action]"
          asChild
          altText="Look up on explorer"
        >
          <a
            href={`https://tuber.build/tx/${toastHash}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-secondary underline transition-colors hover:text-primary hover:no-underline"
          >
            Look up on explorer
          </a>
        </Toast.Action>
      </Toast.Root>
      <Toast.Viewport className="fixed bottom-0 right-0 z-[2147483647] m-0 flex w-[390px] max-w-[100vw] list-none flex-col gap-3 p-6 outline-none" />
    </>
  );
}

const SECOND = 1_000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

function useTimer(deadline = 0) {
  const [timeLeft, setTimeLeft] = useState(deadline);

  useEffect(() => {
    setTimeLeft(deadline * 1000);
    const intervalId = setInterval(() => {
      setTimeLeft(deadline * 1000);
    }, SECOND);

    return () => {
      clearInterval(intervalId);
    };
  }, [deadline]);

  return {
    days: Math.floor(timeLeft / DAY),
    hours: Math.floor((timeLeft / HOUR) % 24),
    minutes: Math.floor((timeLeft / MINUTE) % 60),
    seconds: Math.floor((timeLeft / SECOND) % 60),
  };
}
