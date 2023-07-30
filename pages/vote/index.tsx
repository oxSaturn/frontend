import { Typography } from "@mui/material";

import Gauges from "../../components/ssVotes/ssVotes";
import { PageWrapper } from "../../components/common/PageWrapper";

function Vote() {
  return (
    <PageWrapper
      placeholder={
        <div className="relative z-10">
          <Typography
            className="text-center font-['Monument'] text-2xl font-thin text-white sm:text-3xl"
            variant="h1"
          >
            Vote
          </Typography>
          <Typography
            className="my-7 mx-auto max-w-3xl text-center text-base text-secondary sm:text-lg"
            variant="body2"
          >
            Use your veBVM to vote for your selected liquidity pair&apos;s
            rewards distribution or create a bribe to encourage others to do the
            same.
          </Typography>
        </div>
      }
    >
      <Gauges />
    </PageWrapper>
  );
}

export default Vote;
