import { useState, useEffect, useRef } from "react";
import {
  Typography,
  Button,
  TextField,
  CircularProgress,
  RadioGroup,
  Radio,
  FormControlLabel,
} from "@mui/material";
import { useRouter } from "next/router";
import moment from "moment";
import BigNumber from "bignumber.js";

import stores from "../../stores";
import { ACTIONS } from "../../stores/constants/constants";
import { VestNFT } from "../../stores/types/types";

import classes from "./ssVest.module.css";

export const lockOptions: {
  [key: string]: number;
} = {
  "1 week": 8,
  "1 month": 30,
  "1 year": 365,
  "2 years": 730,
  "3 years": 1095,
  "4 years": 1460,
};
export default function LockDuration({
  nft,
  updateLockDuration,
}: {
  nft: VestNFT;
  updateLockDuration: (_arg: string) => void;
}) {
  const inputEl = useRef<HTMLInputElement | null>(null);
  const [lockLoading, setLockLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(
    moment().add(8, "days").format("YYYY-MM-DD")
  );
  const [selectedDateError] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const lockReturned = () => {
      setLockLoading(false);
      router.push("/vest");
    };
    const errorReturned = () => {
      setLockLoading(false);
    };

    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.INCREASE_VEST_DURATION_RETURNED, lockReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(
        ACTIONS.INCREASE_VEST_DURATION_RETURNED,
        lockReturned
      );
    };
  }, [router]);

  useEffect(() => {
    if (nft && nft.lockEnds) {
      setSelectedDate(moment.unix(+nft.lockEnds).format("YYYY-MM-DD"));
      setSelectedValue(null);
    }
  }, [nft]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
    setSelectedValue(null);

    updateLockDuration(event.target.value);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value);

    let days = +event.target.value ?? 0;
    const newDate = moment().add(days, "days").format("YYYY-MM-DD");

    setSelectedDate(newDate);
    updateLockDuration(newDate);
  };

  const onLock = () => {
    setLockLoading(true);

    const now = moment();
    const expiry = moment(selectedDate).add(1, "days");
    const secondsToExpire = expiry.diff(now, "seconds");

    stores.dispatcher.dispatch({
      type: ACTIONS.INCREASE_VEST_DURATION,
      content: { unlockTime: secondsToExpire, tokenID: nft.id },
    });
  };

  const focus = () => {
    inputEl.current?.focus();
  };

  let min = moment().add(7, "days").format("YYYY-MM-DD");
  if (BigNumber(nft?.lockEnds).gt(0)) {
    min = moment.unix(+nft?.lockEnds).format("YYYY-MM-DD");
  }

  const renderMassiveInput = (
    amountValue: string,
    amountError: boolean,
    amountChanged: (_event: React.ChangeEvent<HTMLInputElement>) => void
  ) => {
    return (
      <div className={classes.textField}>
        <div
          className={`${classes.massiveInputContainer} ${
            amountError && classes.error
          }`}
        >
          <div className={classes.massiveInputAssetSelect}>
            <div className={classes.displaySelectContainer}>
              <div className={classes.assetSelectMenuItem}>
                <div className={classes.displayDualIconContainer}>
                  <div
                    className={classes.displayAssetIconWhite}
                    onClick={focus}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div className={classes.massiveInputAmount}>
            <TextField
              inputRef={inputEl}
              id="someDate"
              type="date"
              placeholder="Expiry Date"
              fullWidth
              error={amountError}
              helperText={amountError}
              value={amountValue}
              onChange={amountChanged}
              disabled={lockLoading}
              inputProps={{
                min: min,
                max: moment().add(1460, "days").format("YYYY-MM-DD"),
              }}
              InputProps={{
                className: classes.largeInput,
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={classes.someContainer}>
      <div className={classes.inputsContainer3}>
        {renderMassiveInput(selectedDate, selectedDateError, handleDateChange)}
        <div className={classes.inline}>
          <Typography className={classes.expiresIn}>Expires: </Typography>
          <RadioGroup
            className={`${classes.vestPeriodToggle} grid grid-cols-2`}
            onChange={handleChange}
            value={selectedValue}
          >
            {Object.keys(lockOptions).map((key) => {
              return (
                <FormControlLabel
                  key={key}
                  className={classes.vestPeriodLabel}
                  value={lockOptions[key]}
                  control={<Radio color="primary" />}
                  label={key}
                  labelPlacement="end"
                />
              );
            })}
          </RadioGroup>
        </div>
      </div>
      <div className={classes.actionsContainer3}>
        <Button
          className={classes.buttonOverride}
          fullWidth
          variant="contained"
          size="large"
          color="primary"
          disabled={lockLoading}
          onClick={onLock}
        >
          <Typography className={classes.actionButtonText}>
            {lockLoading ? `Increasing Duration` : `Increase Duration`}
          </Typography>
          {lockLoading && (
            <CircularProgress size={10} className={classes.loadingCircle} />
          )}
        </Button>
      </div>
    </div>
  );
}
