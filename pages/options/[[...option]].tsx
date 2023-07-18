import { Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { Redeem } from "../../components/options/redeem";
import { Stake } from "../../components/options/stake";
import { Reward } from "../../components/options/reward";
import { Convert } from "../../components/options/convert";
import { PageWrapper } from "../../components/common/PageWrapper";
import { OptionToken, useInputs } from "../../components/options/lib/useInputs";
import { OPTIONS } from "../../stores/constants/constants";

function Options() {
  const { option } = useRouter().query;
  const { setOptionToken } = useInputs();
  useEffect(() => {
    // visit /options
    if (typeof option === "undefined") {
      setOptionToken("oFVM");
      return;
    }
    // visit /options/oToken
    if (Array.isArray(option)) {
      const [oToken] = option;
      if (Object.keys(OPTIONS).includes(oToken)) {
        setOptionToken(oToken as OptionToken);
      }
    }
  }, [option, setOptionToken]);
  return (
    <PageWrapper
      placeholder={
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
      }
    >
      <div className="flex flex-wrap items-stretch justify-center gap-5">
        <Redeem />
        <div className="flex flex-col items-center justify-between gap-1">
          <Stake />
          <Reward />
          <Convert />
        </div>
      </div>
    </PageWrapper>
  );
}

export default Options;
