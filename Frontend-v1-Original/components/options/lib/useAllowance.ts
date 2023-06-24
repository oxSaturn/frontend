import { useAccount, useWaitForTransaction } from "wagmi";
import { formatUnits, parseUnits } from "viem";

import {
  useErc20Allowance,
  usePrepareErc20Approve,
  useErc20Approve,
  useOptionTokenPaymentToken,
} from "../../../lib/wagmiGen";
import { PRO_OPTIONS } from "../../../stores/constants/constants";

import { isValidInput, useInputs } from "./useInputs";
import { useTokenData } from "./useTokenData";

export function useAllowance() {
  const { address } = useAccount();

  const { payment } = useInputs();
  const maxPayment = (parseFloat(payment) * 1.01).toString();

  const { data: paymentTokenAddress } = useOptionTokenPaymentToken();
  const { paymentTokenDecimals } = useTokenData();
  const {
    data: isApprovalNeeded,
    refetch: refetchAllowance,
    isFetching: isFetchingAllowance,
  } = useErc20Allowance({
    address: paymentTokenAddress,
    args: [address!, PRO_OPTIONS.oFLOW.tokenAddress],
    enabled: !!address && !!paymentTokenAddress,
    select: (allowance) => {
      const formattedAllowance = formatUnits(allowance, paymentTokenDecimals);
      if (!maxPayment) return;
      return parseFloat(formattedAllowance) < parseFloat(maxPayment);
    },
  });
  const { config: approveConfig } = usePrepareErc20Approve({
    address: paymentTokenAddress,
    args: [
      PRO_OPTIONS.oFLOW.tokenAddress,
      isValidInput(maxPayment, paymentTokenDecimals) &&
      isValidInput(payment, paymentTokenDecimals)
        ? parseUnits(maxPayment, paymentTokenDecimals)
        : 0n,
    ],
    enabled:
      !!address &&
      !!paymentTokenAddress &&
      isApprovalNeeded &&
      isValidInput(maxPayment, paymentTokenDecimals) &&
      isValidInput(payment, paymentTokenDecimals),
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
