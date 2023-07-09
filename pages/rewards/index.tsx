import { Typography } from "@mui/material";

import SSRewards from "../../components/ssRewards/ssRewards";
import { PageWrapper } from "../../components/common/PageWrapper";

function Rewards() {
  return (
    <PageWrapper
      placeholder={
        <div className="relative z-10">
          <Typography
            className="text-center font-['Monument'] text-2xl font-thin text-white sm:text-3xl"
            variant="h1"
          >
            Rewards
          </Typography>
          <Typography
            className="my-7 mx-auto max-w-3xl text-center text-base text-secondaryGray sm:text-lg"
            variant="body2"
          >
            Claim your share of rewards!
          </Typography>
        </div>
      }
    >
      <SSRewards />
    </PageWrapper>
  );
}

export default Rewards;
