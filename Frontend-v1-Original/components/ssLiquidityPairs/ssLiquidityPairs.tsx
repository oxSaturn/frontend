import { Typography } from "@mui/material";

import { usePairsWithBalances } from "../../lib/global/queries";

import classes from "./ssLiquidityPairs.module.css";
import PairsTable from "./ssLiquidityPairsTable";

export default function LiquidityPairs() {
  const { data: pairs } = usePairsWithBalances();

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
      </div>
      <PairsTable pairs={pairs} />
    </div>
  );
}
