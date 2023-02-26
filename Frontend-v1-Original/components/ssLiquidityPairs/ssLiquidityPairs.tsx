import React, { useState, useEffect, useCallback } from "react";
import { Typography } from "@mui/material";
import type { Pair } from "../../stores/types/types";

import classes from "./ssLiquidityPairs.module.css";

import PairsTable from "./ssLiquidityPairsTable";

import stores from "../../stores";
import { ACTIONS } from "../../stores/constants/constants";

export default function ssLiquidityPairs() {
  const [, updateState] = useState<{}>();
  const forceUpdate = useCallback(() => updateState({}), []);

  const [pairs, setPairs] = useState<Pair[]>([]);
  const [tvl, setTvl] = useState<number>(0);

  useEffect(() => {
    const stableSwapUpdated = () => {
      setPairs(stores.stableSwapStore.getStore("pairs"));
      setTvl(stores.stableSwapStore.getStore("tvl"));
      forceUpdate();
    };

    setPairs(stores.stableSwapStore.getStore("pairs"));
    setTvl(stores.stableSwapStore.getStore("tvl"));

    stores.emitter.on(ACTIONS.UPDATED, stableSwapUpdated);
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, stableSwapUpdated);
    };
  }, []);

  return (
    <div className={classes.container}>
      <div className={classes.descriptionTvlBox}>
        <div className={classes.descriptionBox}>
          <Typography variant="h1">Liquidity Pools</Typography>
          <Typography variant="body2">
            Pair your tokens to provide liquidity. Stake the LP tokens to earn
            FLOW
          </Typography>
        </div>
        <div className={classes.tvlBox}>
          <div className={classes.tvlText}>TVL: {formatTvl(tvl) ?? 0}</div>
        </div>
      </div>
      <PairsTable pairs={pairs} />
    </div>
  );
}

function formatTvl(tvl: number) {
  if (tvl < 10_000_000) {
    return (
      "$" +
      tvl.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  } else if (tvl < 1_000_000_000) {
    return "$" + (tvl / 1_000_000).toFixed(2) + "m";
  } else {
    return "$" + (tvl / 1_000_000_000).toFixed(2) + "b";
  }
}
