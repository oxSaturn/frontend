import { Typography } from "@mui/material";

import LaunchpadTable from "../../components/launchpad/launchpadTable";
import { PageWrapper } from "../../components/common/PageWrapper";

function Launchpad() {
  return (
    <PageWrapper
      placeholder={
        <div className="relative z-10">
          <Typography
            className="text-center font-['Monument'] text-2xl font-thin text-white sm:text-3xl"
            variant="h1"
          >
            Launchpad
          </Typography>
          <Typography
            className="my-7 mx-auto max-w-3xl text-center text-base text-secondaryGray sm:text-lg"
            variant="body2"
          >
            Participate in partner projects via Launchpad.
          </Typography>
        </div>
      }
    >
      <LaunchpadTable />
    </PageWrapper>
  );
}

export default Launchpad;
