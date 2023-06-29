import { Typography } from "@mui/material";

import LiquidityPairs from "../../components/liquidityPairs/LiquidityPairs";
import { PageWrapper } from "../../components/common/PageWrapper";

function Liquidity() {
  return (
    <PageWrapper
      placeholder={
        <div className="relative z-10">
          <Typography
            className="text-center font-['Monument'] text-2xl font-thin text-white sm:text-3xl"
            variant="h1"
          >
            Liquidity Pools
          </Typography>
          <Typography
            className="my-7 mx-auto max-w-3xl text-center text-base text-secondary sm:text-lg"
            variant="body2"
          >
            Create a pair or add liquidity to existing stable or volatile
            Liquidity Pairs.
          </Typography>
        </div>
      }
    >
      <LiquidityPairs />
    </PageWrapper>
  );
}

export default Liquidity;
