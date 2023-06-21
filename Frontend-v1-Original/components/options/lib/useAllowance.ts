import { useAccount, useWaitForTransaction } from "wagmi";
import { formatEther, parseEther } from "viem";

import {
  useErc20Allowance,
  usePrepareErc20Approve,
  useErc20Approve,
} from "../../../lib/wagmiGen";
import { PRO_OPTIONS } from "../../../stores/constants/constants";

import { isValidInput } from "./useInputs";

export function useAllowance(approveAmount: string) {
  const { address } = useAccount();

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
      if (!approveAmount) return;
      return parseFloat(formattedAllowance) < parseFloat(approveAmount);
    },
  });
  const { config: approveConfig } = usePrepareErc20Approve({
    address: PRO_OPTIONS.oAGG.paymentTokenAddress,
    args: [
      PRO_OPTIONS.oAGG.tokenAddress,
      isValidInput(approveAmount)
        ? parseEther(approveAmount as `${number}`)
        : 0n,
    ],
    enabled: !!address && isApprovalNeeded && isValidInput(approveAmount),
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
