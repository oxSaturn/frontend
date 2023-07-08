import { Typography, CircularProgress } from "@mui/material";

import Link from "next/link";

import PairsTable from "./LiquidityPairsTable";
import { useDisplayedPairs } from "./queries";

export default function LiquidityPairs() {
  const { data: tablePairs, isFetching } = useDisplayedPairs();
  return (
    <div className="m-auto mb-5 flex w-[calc(100%-40px)] max-w-[1400px] flex-col items-end p-0 pb-2 xl:mb-14 xl:w-[calc(100%-180px)] xl:pt-0">
      <div className="flex w-full items-stretch justify-between">
        <div className="flex flex-col gap-1 self-start text-left">
          <Typography variant="h1">Liquidity Pools</Typography>
          <Typography variant="body2">
            Pair your tokens to provide liquidity. Stake the LP tokens to earn{" "}
            <Link href="/options" className="underline">
              oFLOW
            </Link>{" "}
            (Option to buy FLOW at a discount)
          </Typography>
        </div>
        {isFetching && <CircularProgress size={20} />}
      </div>
      <PairsTable pairs={tablePairs} />
    </div>
  );
}
