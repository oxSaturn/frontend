import { Typography, CircularProgress } from "@mui/material";

import PairsTable from "./ssLiquidityPairsTable";
import { useTablePairs } from "./queries";

import classes from "./ssLiquidityPairs.module.css";

export default function LiquidityPairs() {
  const { data: tablePairs, isFetching } = useTablePairs();
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
      <PairsTable pairs={tablePairs} />
    </div>
  );
}
