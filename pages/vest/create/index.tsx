import { Typography } from "@mui/material";

import Lock from "../../../components/ssVest/lock";
import { PageWrapper } from "../../../components/common/PageWrapper";
import { GOV_TOKEN_SYMBOL } from "../../../stores/constants/contracts";

function Vest() {
  return (
    <PageWrapper
      placeholder={
        <>
          <Typography
            className="text-center font-['Monument'] text-2xl font-thin text-white sm:text-3xl"
            variant="h1"
          >
            Vest
          </Typography>
          <Typography
            className="my-7 mx-auto max-w-3xl text-center text-base text-secondary sm:text-lg"
            variant="body2"
          >
            Lock your {GOV_TOKEN_SYMBOL} to earn rewards and governance rights.
            Each locked position is created and represented as an NFT, meaning
            you can hold multiple locked positions.
          </Typography>
        </>
      }
    >
      <Lock />
    </PageWrapper>
  );
}

export default Vest;
