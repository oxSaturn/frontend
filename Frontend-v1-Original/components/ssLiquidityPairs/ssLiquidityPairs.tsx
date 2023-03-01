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
  const [circulatingSupply, setCirculatingSupply] = useState<number>(0);
  const [mCap, setMCap] = useState<number>(0);

  useEffect(() => {
    const stableSwapUpdated = () => {
      setPairs(stores.stableSwapStore.getStore("pairs"));
      setTvl(stores.stableSwapStore.getStore("tvl"));
      setCirculatingSupply(
        stores.stableSwapStore.getStore("circulatingSupply")
      );
      setMCap(stores.stableSwapStore.getStore("marketCap"));
      forceUpdate();
    };

    setPairs(stores.stableSwapStore.getStore("pairs"));
    setTvl(stores.stableSwapStore.getStore("tvl"));
    setCirculatingSupply(stores.stableSwapStore.getStore("circulatingSupply"));
    setMCap(stores.stableSwapStore.getStore("marketCap"));

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
          <div className={classes.tvlText}>TVL: {formatFinancialData(tvl)}</div>
          <div className={classes.tvlText}>
            MCap: {formatFinancialData(mCap)}
          </div>
          <div className={classes.tvlText}>
            Circulating Supply: {formatFinancialData(circulatingSupply)}
          </div>
        </div>
      </div>
      <PairsTable pairs={pairs} />
    </div>
  );
}

function formatFinancialData(dataNumber: number) {
  if (dataNumber < 10_000_000) {
    return (
      "$" +
      dataNumber.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  } else if (dataNumber < 1_000_000_000) {
    return "$" + (dataNumber / 1_000_000).toFixed(2) + "m";
  } else {
    return "$" + (dataNumber / 1_000_000_000).toFixed(2) + "b";
  }
}
