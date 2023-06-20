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
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { InfoOutlined } from "@mui/icons-material";

import * as Toast from "@radix-ui/react-toast";
import * as Tooltip from "@radix-ui/react-tooltip";

import { formatCurrency } from "../../utils/utils";

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

const OPTION_TOKEN_ADDRESS = "0x13661E41f6AFF14DE677bbD692601bE809a14F76";

export function Redeem() {
  const { oFlow, WPLS, activeInput, setActiveInput, setOFlow, setWpls } =
    useInputs();
  const maxPaymentWpls = (parseFloat(WPLS) * 1.01).toString();

  const [lpDiscount, setLpDiscount] = useState(20);
  const [now] = useState(Date.now());
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastHash, setToastHash] = useState("");

  const { openConnectModal } = useConnectModal();

  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({
    chainId: canto.id,
  });

  const { address } = useAccount();

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
    data: WplsBalance,
    isFetching: isFetchingWplsBalance,
    refetch: refetchWpls,
  } = useBalance({
    address,
    token: "0x9f823d534954fc119e31257b3ddba0db9e2ff4ed",
  });

  const { data: oFlowBalance, refetch: refetchOFlowBalance } = useOAggBalanceOf(
    {
      args: [address!],
      enabled: !!address,
      select: (data) => formatEther(data),
    }
  );

  const { data: blotrPrice } = useOAggGetTimeWeightedAveragePrice({
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
    isFetching: isFetchingALlowance,
  } = useErc20Allowance({
    address: "0x9f823d534954fc119e31257b3ddba0db9e2ff4ed",
    args: [address!, OPTION_TOKEN_ADDRESS],
    enabled: !!address,
    select: (allowance) => {
      const formattedAllowance = formatEther(allowance);
      if (!WPLS) return;
      return parseFloat(formattedAllowance) < parseFloat(WPLS);
    },
  });

  const { config: approveConfig } = usePrepareErc20Approve({
    address: "0x9f823d534954fc119e31257b3ddba0db9e2ff4ed",
    args: [
      OPTION_TOKEN_ADDRESS,
      isValidInput(WPLS) && isValidInput(maxPaymentWpls)
        ? parseEther(maxPaymentWpls as `${number}`)
        : 0n,
    ],
    enabled:
      !!address &&
      isApprovalNeeded &&
      !isFetchingAmounts &&
      isValidInput(WPLS) &&
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

  const { config: exerciseBlotrConfig } = usePrepareOAggExercise({
    args: [
      isValidInput(oFlow) ? parseEther(oFlow as `${number}`) : 0n,
      isValidInput(WPLS) && isValidInput(maxPaymentWpls)
        ? parseEther(maxPaymentWpls as `${number}`)
        : 0n,
      address!,
      BigInt(now + 1e3 * 60 * 5),
    ],
    enabled:
      !!address &&
      isValidInput(WPLS) &&
      isValidInput(maxPaymentWpls) &&
      isValidInput(oFlow) &&
      !isApprovalNeeded,
  });

  const { config: exerciseLPBlotrConfig } = usePrepareOAggExerciseLp({
    args: [
      isValidInput(oFlow) ? parseEther(oFlow as `${number}`) : 0n,
      isValidInput(WPLS) && isValidInput(maxPaymentWpls)
        ? parseEther(maxPaymentWpls as `${number}`)
        : 0n,
      address!,
      BigInt(100 - lpDiscount),
      BigInt(now + 1e3 * 60 * 5),
    ],
    enabled:
      !!address &&
      isValidInput(WPLS) &&
      isValidInput(maxPaymentWpls) &&
      isValidInput(oFlow) &&
      !isApprovalNeeded,
  });

  const {
    write: redeem,
    data: txResponse,
    isLoading: writingExercise,
  } = useOAggExercise({
    ...exerciseBlotrConfig,
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
    ...exerciseLPBlotrConfig,
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
      refetchWpls();
      refetchOFlowBalance();
      setOFlow("");
      setWpls("");
    },
  });

  const setMax = (input: INPUT_TYPE) => {
    if (input === INPUT.OFLOW) {
      if (!oFlowBalance || parseFloat(oFlowBalance) === 0) return;
      setActiveInput(INPUT.OFLOW);
      return setOFlow(oFlowBalance);
    } else if (input === INPUT.WPLS) {
      if (!WplsBalance || parseFloat(WplsBalance.formatted) === 0) return;
      setActiveInput(INPUT.WPLS);
      return setWpls(WplsBalance.formatted);
    }
  };

  const onOFlowInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveInput(INPUT.OFLOW);
    setOFlow(e.target.value);
    if (e.target.value === "") setWpls("");
  };

  const onWplsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveInput(INPUT.WPLS);
    setWpls(e.target.value);
    if (e.target.value === "") setOFlow("");
  };

  const areInputsEmpty = oFlow === "";
  const insufficientOFlow =
    oFlowBalance && parseFloat(oFlow) > parseFloat(oFlowBalance);
  const insufficientWpls =
    WplsBalance && parseFloat(WPLS) > parseFloat(WplsBalance?.formatted);

  return (
    <>
      <div className="mt-20 flex w-96 min-w-[384px] flex-col border border-primary p-5 font-sono text-lime-50 md:w-[512px] md:min-w-[512px]">
        <div className="flex items-center justify-between">
          <div>WPLS balance</div>
          <div>{formatCurrency(WplsBalance?.formatted)} WPLS</div>
        </div>
        <div className="flex items-center justify-between">
          <div>oFLOW balance</div>
          <div>{formatCurrency(oFlowBalance)} oFLOW</div>
        </div>
        <div className="flex items-center justify-between">
          <div>Strike price</div>
          <div>{formatCurrency(discountedPrice)} WPLS</div>
        </div>
        <div className="flex items-center justify-between">
          <div>FLOW price</div>
          <div>{formatCurrency(blotrPrice)} WPLS</div>
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
              className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
                areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
              } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-["oFLOW"]`}
            >
              <input
                value={oFlow}
                onChange={onOFlowInputChange}
                className={`w-full border-none bg-transparent p-4 text-left text-base focus:outline focus:outline-1 ${
                  (!isValidInput(oFlow) && oFlow !== "") || insufficientOFlow
                    ? "text-error focus:outline-error focus-visible:outline-error"
                    : "focus:outline-secondary focus-visible:outline-secondary"
                }`}
                placeholder="0.00 oFLOW"
              />
            </div>
            <button className="p-4" onClick={() => setMax(INPUT.OFLOW)}>
              MAX
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div
              className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
                areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
              } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-["WPLS"]`}
            >
              <input
                value={WPLS}
                onChange={onWplsInputChange}
                className={`w-full border-none bg-transparent p-4 text-left text-base focus:outline focus:outline-1 ${
                  (!isValidInput(WPLS) && WPLS !== "") || insufficientWpls
                    ? "text-error focus:outline-error focus-visible:outline-error"
                    : "focus:outline-secondary focus-visible:outline-secondary"
                }`}
                placeholder="0.00 WPLS"
              />
            </div>
            <button className="p-4" onClick={() => setMax(INPUT.WPLS)}>
              MAX
            </button>
          </div>
          <div
            className={`relative w-full border border-[rgb(46,45,45)] after:absolute after:transition-opacity ${
              areInputsEmpty ? "after:opacity-0" : "after:opacity-100"
            } after:right-2 after:top-2 after:text-xs after:text-secondary after:content-["FLOW"]`}
          >
            <input
              readOnly
              value={oFlow}
              className="w-full border-none bg-transparent p-4 text-left text-base focus:outline focus:outline-1 focus:outline-secondary focus-visible:outline-secondary"
              placeholder="0.00 FLOW"
            />
          </div>
          <Slider
            value={[lpDiscount]}
            onValueChange={(e) => setLpDiscount(e[0])}
          />
          {address ? (
            chain?.unsupported ? (
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
                    (activeInput === INPUT.OFLOW && !isValidInput(oFlow)) ||
                    (activeInput === INPUT.WPLS && !isValidInput(WPLS)) ||
                    (isApprovalNeeded ? !approve : !redeem) ||
                    isFetchingAmounts ||
                    isFetchingWplsBalance ||
                    isFetchingALlowance ||
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
                  isFetchingALlowance
                    ? "Loading..."
                    : isApprovalNeeded
                    ? "Approve"
                    : "Redeem into LP"}
                </button>
                <button
                  disabled={
                    (activeInput === INPUT.OFLOW && !isValidInput(oFlow)) ||
                    (activeInput === INPUT.WPLS && !isValidInput(WPLS)) ||
                    (isApprovalNeeded ? !approve : !redeem) ||
                    isFetchingAmounts ||
                    isFetchingWplsBalance ||
                    isFetchingALlowance ||
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
                  isFetchingALlowance
                    ? "Loading..."
                    : isApprovalNeeded
                    ? "Approve"
                    : "Redeem"}
                </button>
              </>
            )
          ) : (
            <button
              className="text-extendedBlack flex h-14 w-full items-center justify-center rounded border border-transparent bg-primary p-5 text-center font-medium transition-colors hover:bg-secondary focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
              onClick={() => openConnectModal?.()}
            >
              Connect wallet
            </button>
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
              {formatCurrency((parseFloat(WPLS) * 1.01).toString())} WPLS
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
