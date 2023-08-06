import { Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { Redeem } from "../../components/options/redeem";
import { Stake } from "../../components/options/stake";
import { Reward } from "../../components/options/reward";
import { Convert } from "../../components/options/convert";
import { PageWrapper } from "../../components/common/PageWrapper";
import { useInputs } from "../../components/options/lib/useInputs";
import { Select, SelectItem } from "../../components/common/radixSelect";
import {
  OPTIONS,
  type oToken as OptionToken,
} from "../../stores/constants/constants";
import { GOV_TOKEN_SYMBOL } from "../../stores/constants/contracts";

function transformOptionQuery(
  option: string | string[] | undefined
): OptionToken {
  if (typeof option === "undefined") {
    return `o${GOV_TOKEN_SYMBOL}`;
  }
  if (Array.isArray(option)) {
    const [oToken] = option;
    if (Object.keys(OPTIONS).includes(oToken)) {
      return oToken as OptionToken;
    }
  }
  return `o${GOV_TOKEN_SYMBOL}`;
}
function Options() {
  const router = useRouter();
  const { option } = router.query;
  const { setOptionToken } = useInputs();
  useEffect(() => {
    setOptionToken(transformOptionQuery(option));
  }, [option, setOptionToken]);

  useEffect(() => {
    return () => {
      // reset option token on unmount
      setOptionToken(`o${GOV_TOKEN_SYMBOL}`);
    };
  }, [setOptionToken]);
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
      <div className="space-y-5">
        <h1 className="font-sono text-base md:text-2xl flex px-5 items-center gap-2 w-96 min-w-[384px] md:w-[512px] md:min-w-[512px] lg:w-[calc(1024px+1.25rem)] lg:min-w-[calc(1024px+1.25rem)] mx-auto">
          <span>Select option token:</span>
          <Select
            value={transformOptionQuery(option)}
            onValueChange={(value) => {
              router.push(`/options/${value}`);
            }}
          >
            {Object.keys(OPTIONS).map((oToken) => (
              <SelectItem key={oToken} value={oToken}>
                {oToken}
              </SelectItem>
            ))}
          </Select>
        </h1>
        <div className="flex flex-wrap items-stretch justify-center gap-5">
          <Redeem />
          <div className="flex flex-col items-center justify-between gap-5">
            <Stake />
            <Reward />
            <Convert />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default Options;
