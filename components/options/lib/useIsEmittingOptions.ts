import { useQuery } from "@tanstack/react-query";
import { useContractRead } from "wagmi";

import {
  useOptionTokenGauge,
  useOptionTokenHasRole,
} from "../../../lib/wagmiGen";
import {
  CONTRACTS,
  MINTER_ROLE,
  PRO_OPTIONS,
  QUERY_KEYS,
  ZERO_ADDRESS,
} from "../../../stores/constants";

import { useInputs } from "./useInputs";

export function useIsEmittingOptions() {
  const { optionToken } = useInputs();

  const { data: gaugeAddress } = useOptionTokenGauge({
    address: PRO_OPTIONS[optionToken].tokenAddress,
  });
  const { data: hasMinterRole } = useOptionTokenHasRole({
    address: PRO_OPTIONS.oBVM.tokenAddress,
    args: [MINTER_ROLE, gaugeAddress!],
    enabled: !!gaugeAddress,
  });
  const { data: oFlowOnGauge } = useContractRead({
    address: gaugeAddress,
    abi: CONTRACTS.GAUGE_ABI,
    functionName: "oFlow",
  });

  return useQuery({
    queryKey: [QUERY_KEYS.IS_EMITTING_OPTIONS, hasMinterRole, oFlowOnGauge],
    queryFn: () => {
      return !!hasMinterRole && oFlowOnGauge !== ZERO_ADDRESS;
    },
    enabled:
      hasMinterRole !== undefined &&
      oFlowOnGauge !== undefined &&
      !!gaugeAddress,
  });
}
