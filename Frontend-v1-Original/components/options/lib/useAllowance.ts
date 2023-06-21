import { useAccount, useWaitForTransaction } from "wagmi";
import { formatEther, parseEther } from "viem";

import {
  useErc20Allowance,
  usePrepareErc20Approve,
  useErc20Approve,
} from "../../../lib/wagmiGen";
import { PRO_OPTIONS } from "../../../stores/constants/constants";

import { isValidInput, useInputs } from "./useInputs";
import { useAmountToPayLiquid } from "./useAmountToPayLiquid";

export function useAllowance() {
  const { address } = useAccount();

  const { payment } = useInputs();
  const maxPayment = (parseFloat(payment) * 1.01).toString();

  const { isFetching: isFetchingAmountsLiquid } = useAmountToPayLiquid();

  const {
    data: isApprovalNeeded,
    refetch: refetchAllowance,
    isFetching: isFetchingAllowance,
  } = useErc20Allowance({
    address: PRO_OPTIONS.oAGG.paymentTokenAddress,
    args: [address!, PRO_OPTIONS.oAGG.tokenAddress],
    enabled: !!address,
    select: (allowance) => {
      const formattedAllowance = formatEther(allowance);
      if (!payment) return;
      return parseFloat(formattedAllowance) < parseFloat(payment);
    },
  });
  const { config: approveConfig } = usePrepareErc20Approve({
    address: PRO_OPTIONS.oAGG.paymentTokenAddress,
    args: [
      PRO_OPTIONS.oAGG.tokenAddress,
      isValidInput(payment) && isValidInput(maxPayment)
        ? parseEther(maxPayment as `${number}`)
        : 0n,
    ],
    enabled:
      !!address &&
      isApprovalNeeded &&
      !isFetchingAmountsLiquid &&
      isValidInput(payment) &&
      isValidInput(maxPayment),
  });
  const {
    write: approve,
    data: txApproveResponse,
    isLoading: writingApprove,
  } = useErc20Approve(approveConfig);
  const { isFetching: waitingApprovalReceipt } = useWaitForTransaction({
    hash: txApproveResponse?.hash,
    onSuccess() {
      refetchAllowance();
    },
  });

  return {
    isFetching: isFetchingAllowance || writingApprove || waitingApprovalReceipt,
    approve,
    isApprovalNeeded,
  };
}
