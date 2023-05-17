import { Typography, CircularProgress } from "@mui/material";

import {
  usePairs,
  usePairsWithoutGauges,
  usePairsWithGauges,
} from "../../lib/global/queries";

import classes from "./ssLiquidityPairs.module.css";
import PairsTable from "./ssLiquidityPairsTable";

export default function LiquidityPairs() {
  const { data: initPairs, isFetching: isFetchingInitPairs } = usePairs();
  const { data: pairsWithoutGauges, isFetching: isFetchingWithoutGauges } =
    usePairsWithoutGauges();
  const { data: pairsWithGauges, isFetching: isFetchingWithGauges } =
    usePairsWithGauges();

  const pairs = pairsWithGauges
    ? pairsWithGauges
    : pairsWithoutGauges
    ? pairsWithoutGauges
    : initPairs;

  const isFetching =
    isFetchingWithGauges || isFetchingWithoutGauges || isFetchingInitPairs;
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
        {isFetching && <CircularProgress size={20} />}
      </div>
      <PairsTable pairs={pairs} />
    </div>
  );
}
