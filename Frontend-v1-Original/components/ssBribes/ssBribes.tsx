import { useRouter } from "next/router";
import { Button, Typography } from "@mui/material";
import { AddCircleOutline } from "@mui/icons-material";

import { useAutoBribes } from "./queries";
import { useBribeAutoBribe } from "./mutations";

import classes from "./ssBribes.module.css";

export default function Bribes() {
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
  const { mutate: bribe } = useBribeAutoBribe();

  const onBribe = (address: `0x${string}`) => {
    bribe(address);
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
                className="w-full rounded-md bg-background p-2 font-bold text-primary hover:bg-[rgb(19,44,60)]"
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
