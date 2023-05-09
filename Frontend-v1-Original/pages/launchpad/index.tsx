import { useAccount } from "wagmi";
import { Paper, Typography } from "@mui/material";

import LaunchpadTable from "../../components/launchpad/launchpadTable";

function Launchpad() {
  const { address } = useAccount();

  return (
    <div className="relative mt-0 flex h-full w-full flex-col pt-8">
      {address ? (
        <div>
          <LaunchpadTable />
        </div>
      ) : (
        <Paper className="fixed top-0 flex h-[calc(100%-150px)] w-[calc(100%-80px)] flex-col flex-wrap items-center justify-center bg-[rgba(17,23,41,0.2)] p-12 text-center shadow-none max-lg:my-auto max-lg:mt-24 max-lg:mb-0 lg:h-[100vh] lg:w-full">
          <div className="relative z-10">
            <Typography
              className="text-center font-['Monument'] text-2xl font-thin text-white sm:text-3xl"
              variant="h1"
            >
              Launchpad
            </Typography>
            <Typography
              className="text-secondaryGray my-7 mx-auto max-w-3xl text-center text-base sm:text-lg"
              variant="body2"
            >
              Participate in partner projects via Launchpad.
            </Typography>
          </div>
        </Paper>
      )}
    </div>
  );
}

export default Launchpad;
