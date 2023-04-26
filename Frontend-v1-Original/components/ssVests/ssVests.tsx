import { useState, useEffect, useCallback } from "react";
import { Typography } from "@mui/material";

import stores from "../../stores";
import { ACTIONS } from "../../stores/constants/constants";
import { GovToken, VestNFT, VeToken } from "../../stores/types/types";

import PartnersVests from "./partnersVests";
import VestsTable from "./ssVestsTable";

export default function Vests() {
  const [, updateState] = useState<{}>();
  const forceUpdate = useCallback(() => updateState({}), []);

  const [vestNFTs, setVestNFTs] = useState<VestNFT[]>([]);
  const [govToken, setGovToken] = useState<GovToken | null>(null);
  const [veToken, setVeToken] = useState<VeToken | null>(null);

  useEffect(() => {
    const ssUpdated = async () => {
      setGovToken(stores.stableSwapStore.getStore("govToken"));
      setVeToken(stores.stableSwapStore.getStore("veToken"));
    };

    ssUpdated();

    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
    };
  }, []);

  useEffect(() => {
    const vestNFTsReturned = (nfts: VestNFT[]) => {
      setVestNFTs(nfts);
      forceUpdate();
    };

    window.setTimeout(() => {
      stores.dispatcher.dispatch({ type: ACTIONS.GET_VEST_NFTS, content: {} });
    }, 1);

    const resetVestReturned = () => {
      stores.dispatcher.dispatch({ type: ACTIONS.GET_VEST_NFTS, content: {} });
    };

    stores.emitter.on(ACTIONS.VEST_NFTS_RETURNED, vestNFTsReturned);
    stores.emitter.on(ACTIONS.RESET_VEST_RETURNED, resetVestReturned);
    return () => {
      stores.emitter.removeListener(
        ACTIONS.VEST_NFTS_RETURNED,
        vestNFTsReturned
      );
      stores.emitter.removeListener(
        ACTIONS.RESET_VEST_RETURNED,
        resetVestReturned
      );
    };
  }, [forceUpdate]);

  return (
    <div className="m-auto mb-5 flex w-[calc(100%-40px)] max-w-[1400px] flex-col items-end p-0 pt-20 pb-2 xl:mb-14 xl:w-[calc(100%-180px)] xl:pt-0">
      <div className="flex flex-col gap-1 self-start text-left">
        <Typography variant="h1">Vest</Typography>
        <Typography variant="body2">
          Lock FLOW into veFLOW to earn and govern. Vote with veFLOW to earn
          bribes and trading fees. veFLOW can be transferred, merged and split.
          You can hold multiple positions.
        </Typography>
      </div>
      <VestsTable vestNFTs={vestNFTs} govToken={govToken} veToken={veToken} />
      <PartnersVests />
    </div>
  );
}
