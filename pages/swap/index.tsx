import { Typography } from "@mui/material";

import SwapComponent from "../../components/swap/swap";
import { PageWrapper } from "../../components/common/PageWrapper";

function Swap() {
  return (
    <PageWrapper
      placeholder={
        <>
          {" "}
          <div className="relative z-10">
            <Typography
              className="text-center font-['Monument'] text-2xl font-thin text-white sm:text-3xl"
              variant="h1"
            >
              Swap
            </Typography>
            <Typography
              className="my-7 mx-auto max-w-3xl text-center text-base text-secondary sm:text-lg"
              variant="body2"
            >
              Swap between BVM supported stable and volatile assets.
            </Typography>
          </div>
        </>
      }
    >
      <SwapComponent />
    </PageWrapper>
  );
}

export default Swap;
