import { useQuery } from "@tanstack/react-query";
import { useContractRead } from "wagmi";

import {
  useOptionTokenGauge,
  useOptionTokenHasRole,
} from "../../../lib/wagmiGen";
import {
  CONTRACTS,
  MINTER_ROLE,
  QUERY_KEYS,
  ZERO_ADDRESS,
} from "../../../stores/constants";

export function useIsEmittingOptions() {
  const { data: gaugeAddress } = useOptionTokenGauge();
  const { data: hasMinterRole } = useOptionTokenHasRole({
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
