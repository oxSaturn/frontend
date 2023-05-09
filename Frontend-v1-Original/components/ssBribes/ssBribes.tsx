import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Button, Typography } from "@mui/material";
import { AddCircleOutline } from "@mui/icons-material";

import stores from "../../stores";
import { ACTIONS } from "../../stores/constants/constants";
import { Pair } from "../../stores/types/types";

import { useAutoBribes } from "./queries";
import classes from "./ssBribes.module.css";

export default function Bribes() {
  const [, updateState] = useState<undefined | {}>();
  const forceUpdate = useCallback(() => updateState({}), []);

  const [, setPairs] = useState<Pair[]>([]);

  useEffect(() => {
    const stableSwapUpdated = () => {
      const pairs = stores.stableSwapStore.getStore("pairs");
      const pairsWithBribes = pairs.filter((pair) => {
        return (
          pair &&
          pair.gauge != null &&
          pair.gauge.address &&
          pair.gauge.bribes &&
          pair.gauge.bribes.length > 0
        );
      });
      setPairs(pairsWithBribes);
      forceUpdate();
    };

    stableSwapUpdated();

    stores.emitter.on(ACTIONS.UPDATED, stableSwapUpdated);
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, stableSwapUpdated);
    };
  }, [forceUpdate]);

  const router = useRouter();
  const onCreate = () => {
    router.push("/bribe/create");
  };

  return (
    <div className={classes.container}>
      <div className={classes.descriptionBox}>
        <Typography variant="h1">Bribe</Typography>
        <Typography variant="body2">
          Create a bribe to encourage others to vote for your selected
          pool&apos;s rewards distribution.
        </Typography>
      </div>
      <Button
        variant="contained"
        color="secondary"
        startIcon={<AddCircleOutline />}
        size="large"
        className={classes.buttonOverride}
        onClick={onCreate}
      >
        <Typography className={classes.actionButtonText}>
          Create Bribe
        </Typography>
      </Button>
      <div className={classes.descriptionBox}>
        <Typography variant="h1">Auto Bribes</Typography>
        <Typography variant="body2">
          {`Help bribe our partner bribe contract and get 0.5% of this week's bribe.`}
        </Typography>
      </div>
      <AutoBribes />
    </div>
  );
}

const AutoBribes = () => {
  const { data: autoBribes, isLoading } = useAutoBribes();

  const onBribe = (address: `0x${string}`) => {
    stores.dispatcher.dispatch({
      type: ACTIONS.BRIBE_AUTO_BRIBE,
      content: {
        address,
      },
    });
  };

  const mappedAutoBribes = autoBribes && [...autoBribes.entries()];

  return (
    <div className="flex flex-wrap items-center justify-start gap-5">
      {isLoading ? <div>Loading...</div> : null}
      {mappedAutoBribes &&
        mappedAutoBribes.map(([address, { name, bribed }]) => {
          return (
            <div
              key={address}
              className="flex flex-col rounded-lg p-5 shadow-glow"
            >
              <div>{name}</div>
              <div>{bribed ? "Bribed this epoch" : "Not bribed yet!"}</div>
              <Button
                onClick={() => onBribe(address)}
                variant="contained"
                color="secondary"
                size="large"
                className="w-full rounded-md bg-[#272826] p-2 font-bold text-cantoGreen hover:bg-[rgb(19,44,60)]"
                disabled={bribed}
              >
                Bribe
              </Button>
            </div>
          );
        })}
    </div>
  );
};
