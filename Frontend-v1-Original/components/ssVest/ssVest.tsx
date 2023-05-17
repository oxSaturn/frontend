import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import BigNumber from "bignumber.js";
import moment from "moment";

import stores from "../../stores";
import { ACTIONS } from "../../stores/constants/constants";
import { VestNFT } from "../../stores/types/types";
import { useGovToken, useVeToken } from "../../lib/global/queries";

import ExistingLock from "./existingLock";
import Unlock from "./unlock";
import Lock from "./lock";
import classes from "./ssVest.module.css";

export default function Vest() {
  const router = useRouter();

  const [, updateState] = useState<{}>();
  const forceUpdate = useCallback(() => updateState({}), []);

  const { data: govToken } = useGovToken();
  const { data: veToken } = useVeToken();

  const [nft, setNFT] = useState<VestNFT | null>(null);

  const ssUpdated = async () => {
    if (typeof router.query.id === "string") {
      const nft = await stores.stableSwapStore.getNFTByID(router.query.id);
      setNFT(nft);
    }
    forceUpdate();
  };

  useEffect(() => {
    ssUpdated();

    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
    };
  }, []);

  useEffect(() => {
    ssUpdated();
  }, [router.query.id]);

  return (
    <div className={classes.vestContainer}>
      {router.query.id === "create" && (
        <Lock govToken={govToken} veToken={veToken} />
      )}
      {router.query.id !== "create" &&
        nft &&
        BigNumber(nft.lockEnds).gte(moment().unix()) &&
        BigNumber(nft.lockEnds).gt(0) && (
          <ExistingLock nft={nft} govToken={govToken} veToken={veToken} />
        )}
      {router.query.id !== "create" &&
        nft &&
        BigNumber(nft.lockEnds).lt(moment().unix()) &&
        BigNumber(nft.lockEnds).gt(0) && (
          <Unlock nft={nft} govToken={govToken} veToken={veToken} />
        )}
    </div>
  );
}
