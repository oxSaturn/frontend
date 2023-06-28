import { Typography, Paper } from "@mui/material";

import { useAccount } from "wagmi";

import { Redeem } from "../../components/options/redeem";
import { Stake } from "../../components/options/stake";
import { Reward } from "../../components/options/reward";
import { Convert } from "../../components/options/convert";

function Rewards() {
  const { address } = useAccount();

  return (
    <div className="relative my-3 flex h-full w-full flex-col pt-8">
      {address ? (
        <div className="flex flex-wrap items-stretch justify-center gap-5">
          <Redeem />
          <div className="flex flex-col items-center justify-between gap-1">
            <Stake />
            <Reward />
            <Convert />
          </div>
        </div>
      ) : (
        <Paper className="fixed top-0 flex h-[calc(100%-150px)] w-full flex-col flex-wrap items-center justify-center bg-[rgba(17,23,41,0.2)] p-12 text-center shadow-none max-lg:my-auto max-lg:mt-24 max-lg:mb-0 lg:h-[100vh] lg:w-full">
          <div className="relative z-10">
            <Typography
              className="text-center font-['Monument'] text-2xl font-thin text-white sm:text-3xl"
              variant="h1"
            >
              Redeem
            </Typography>
            <Typography
              className="my-7 mx-auto max-w-3xl text-center text-base text-secondary sm:text-lg"
              variant="body2"
            >
              Redeem your option tokens!
            </Typography>
          </div>
        </Paper>
      )}
    </div>
  );
}

export default Rewards;
