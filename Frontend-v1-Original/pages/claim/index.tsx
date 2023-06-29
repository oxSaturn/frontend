import { Typography } from "@mui/material";

import { Claim } from "../../components/claim/claim";

function Rewards() {
  return (
    <div className="relative mt-0 flex h-full w-full flex-col pt-8">
      <div className="relative z-10">
        <Typography
          className="text-center font-['Monument'] text-2xl font-thin text-white sm:text-3xl"
          variant="h1"
        >
          Claim
        </Typography>
        <Typography
          className="my-7 mx-auto max-w-3xl text-center text-base text-secondary sm:text-lg"
          variant="body2"
        >
          Claim your veNFT for 3+ years locked on Fantom
        </Typography>
      </div>
      <div className="flex items-center justify-center">
        <Claim />
      </div>
    </div>
  );
}

export default Rewards;
