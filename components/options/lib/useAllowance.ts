import { useAccount, useWaitForTransaction } from "wagmi";
import { parseUnits } from "viem";

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

  const { payment, optionToken } = useInputs();
  const maxPayment = (parseFloat(payment) * 1.01).toString();

  const { data: paymentTokenAddress } = useOptionTokenPaymentToken({
    address: PRO_OPTIONS[optionToken].tokenAddress,
  });
  const { paymentTokenDecimals } = useTokenData();
  const {
    data: isApprovalNeeded,
    refetch: refetchAllowance,
    isFetching: isFetchingAllowance,
  } = useErc20Allowance({
    address: paymentTokenAddress,
    args: [address!, PRO_OPTIONS.oFVM.tokenAddress],
    enabled: !!address && !!paymentTokenAddress && !!paymentTokenDecimals,
    select: (allowance) => {
      if (!maxPayment) return;
      if (!isValidInput(maxPayment, paymentTokenDecimals)) return;
      return allowance < parseUnits(maxPayment, paymentTokenDecimals);
    },
  });
  const { config: approveConfig } = usePrepareErc20Approve({
    address: paymentTokenAddress,
    args: [
      PRO_OPTIONS.oFVM.tokenAddress,
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
