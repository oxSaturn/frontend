import { useState } from "react";
import {
  useAccount,
  useNetwork,
  useSwitchNetwork,
  useWaitForTransaction,
  useBalance,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { pulsechain } from "viem/chains";

import {
  useErc20Allowance,
  usePrepareErc20Approve,
  useErc20Approve,
  usePrepareConvertorRedeem,
  useConvertorRedeem,
} from "../../lib/wagmiGen";
import { formatCurrency } from "../../utils/utils";

import { isValidInput, useTokenData } from "./lib";

export function Convert() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({
    chainId: pulsechain.id,
  });

  const [amount, setAmount] = useState("");
  const { refetchBalances } = useTokenData();

  const { data: optionV1Balance, refetch: refetchOptionV1Balance } = useBalance(
    {
      address,
      token: "0x1Fc0A9f06B6E85F023944e74F70693Ac03fDC621",
    }
  );

  const {
    data: isApprovalNeeded,
    refetch: refetchAllowance,
    isFetching: isFetchingAllowance,
  } = useErc20Allowance({
    address: "0x1Fc0A9f06B6E85F023944e74F70693Ac03fDC621",
    args: [address!, "0x281a5A2Df1674c119deF9D4c4353e4621F5fBF61"],
    enabled: !!address,
    select: (allowance) => {
      const formattedAllowance = formatEther(allowance);
      if (!amount) return false;
      return parseFloat(formattedAllowance) < parseFloat(amount);
    },
  });

  const { config: approveConfig } = usePrepareErc20Approve({
    address: "0x1Fc0A9f06B6E85F023944e74F70693Ac03fDC621",
    args: [
      "0x281a5A2Df1674c119deF9D4c4353e4621F5fBF61",
      isValidInput(amount) ? parseEther(amount as `${number}`) : 0n,
    ],
    enabled: !!address && isApprovalNeeded && isValidInput(amount),
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

  const { config: convertConfig } = usePrepareConvertorRedeem({
    address: "0x281a5A2Df1674c119deF9D4c4353e4621F5fBF61",
    args: [isValidInput(amount) ? parseEther(amount as `${number}`) : 0n],
    enabled: !!address && isValidInput(amount) && !isApprovalNeeded,
  });
  const {
    write: convert,
    data: txConvertResponse,
    isLoading: writingConvert,
  } = useConvertorRedeem({ ...convertConfig });
  const { isFetching: waitingConvertReceipt } = useWaitForTransaction({
    hash: txConvertResponse?.hash,
    onSuccess: () => {
      refetchOptionV1Balance();
      refetchAllowance();
      refetchBalances();
    },
  });

  const setMax = () => {
    if (optionV1Balance && parseFloat(optionV1Balance.formatted) > 0) {
      setAmount(optionV1Balance.formatted);
    }
  };

  const insufficientAmount =
    optionV1Balance &&
    parseFloat(amount) > parseFloat(optionV1Balance.formatted);

  return (
    <>
      <div className="flex w-96 min-w-[384px] flex-col rounded-md border border-cyan/50 p-5 font-sono text-lime-50 md:w-[512px] md:min-w-[512px]">
        <div className="relative mb-5 flex items-center justify-between">
          <h2 className="text-xl">oFLOW v1 balance</h2>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm">
            {formatCurrency(optionV1Balance?.formatted)}
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
              Switch to Pulse
            </button>
          ) : (
            <button
              disabled={
                !isValidInput(amount) ||
                insufficientAmount ||
                isFetchingAllowance ||
                writingApprove ||
                waitingApprovalReceipt ||
                writingConvert ||
                waitingConvertReceipt ||
                (isApprovalNeeded ? !approve : !convert)
              }
              onClick={isApprovalNeeded ? () => approve?.() : () => convert?.()}
              className="flex h-14 w-full items-center justify-center rounded border border-transparent bg-cyan p-5 text-center font-medium text-black transition-colors hover:bg-cyan/80 focus-visible:outline-secondary disabled:bg-slate-400 disabled:opacity-60"
            >
              {writingApprove ||
              isFetchingAllowance ||
              waitingApprovalReceipt ||
              writingConvert ||
              waitingConvertReceipt
                ? waitingApprovalReceipt
                  ? "Approving"
                  : waitingConvertReceipt
                  ? "Converting"
                  : "Loading"
                : isApprovalNeeded
                ? "Approve"
                : "Convert"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
