import LiquidityCreate from "../../../components/ssLiquidityManage/ssLiquidityManage";

import classes from "./liquidity.module.css";

function Pair({ changeTheme }) {
  return (
    <div className={classes.container}>
      <LiquidityCreate />
    </div>
  );
}

export default Pair;
