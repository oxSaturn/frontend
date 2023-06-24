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
      if (!maxPayment) return;

      const multiplier = 1_000_000_000;
      // this is sort of a hack that we scale up the payment first to avoid rounding errors
      const maxPaymentBigint =
        (BigInt(parseFloat(payment) * multiplier) *
          10n ** BigInt(paymentTokenDecimals) *
          101n) /
        100n /
        BigInt(multiplier);

      return allowance < maxPaymentBigint;
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
