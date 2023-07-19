import { Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Link from "next/link";

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

function transformOptionQuery(
  option: string | string[] | undefined
): OptionToken {
  if (typeof option === "undefined") {
    return "oFVM";
  }
  if (Array.isArray(option)) {
    const [oToken] = option;
    if (Object.keys(OPTIONS).includes(oToken)) {
      return oToken as OptionToken;
    }
  }
  return "oFVM";
}
function Options() {
  const router = useRouter();
  const { option } = router.query;
  const { setOptionToken } = useInputs();
  useEffect(() => {
    setOptionToken(transformOptionQuery(option));
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
      <div className="space-y-5">
        <h1 className="text-center text-2xl flex justify-center items-center">
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
          <div className="flex flex-col items-center justify-between gap-1">
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
