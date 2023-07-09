import { useState, useRef } from "react";
import {
  Paper,
  Typography,
  Button,
  TextField,
  CircularProgress,
  RadioGroup,
  Radio,
  FormControlLabel,
  Tooltip,
  IconButton,
} from "@mui/material";
import { useRouter } from "next/router";
import BigNumber from "bignumber.js";
import dayjs from "dayjs";
import { ArrowBack } from "@mui/icons-material";

import { useGovToken, useVeToken } from "../../lib/global/queries";
import { formatCurrency } from "../../utils/utils";

import { GovToken, VestNFT } from "../../stores/types/types";

import VestingInfo from "./vestingInfo";
import classes from "./ssVest.module.css";

import { type LockOption, lockOptions, defaultLockDuration, maxLockDuration } from "./lockDuration";
import { useCreateVest } from "./lib/mutations";

export default function Lock() {
  const inputEl = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | false>(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(lockOptions[defaultLockDuration] + ''); // select 1 week by default
  const [selectedDate, setSelectedDate] = useState(
    dayjs().add(lockOptions[defaultLockDuration], "days").format("YYYY-MM-DD")
  );
  const [selectedDateError] = useState(false);
  const { data: govToken } = useGovToken();
  const { data: veToken } = useVeToken();

  const { mutate: createVest, isLoading: lockLoading } = useCreateVest(() => {
    router.push("/vest");
  });

  const setAmountPercent = (percent: number) => {
    setAmount(
      BigNumber(govToken?.balance || 0)
        .times(percent)
        .div(100)
        .toFixed(govToken?.decimals ?? 18)
    );
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
    setSelectedValue(null);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value);

    let days = +event.target.value ?? 0;
    const newDate = dayjs().add(days, "days").format("YYYY-MM-DD");

    setSelectedDate(newDate);
  };

  const onLock = () => {
    setAmountError(false);

    let error = false;

    if (!amount || amount === "" || isNaN(+amount)) {
      setAmountError("Amount is required");
      error = true;
    } else {
      if (
        !govToken?.balance ||
        isNaN(+govToken?.balance) ||
        BigNumber(govToken?.balance).lte(0)
      ) {
        setAmountError("Invalid balance");
        error = true;
      } else if (BigNumber(amount).lte(0)) {
        setAmountError("Invalid amount");
        error = true;
      } else if (govToken && BigNumber(amount).gt(govToken.balance)) {
        setAmountError(`Greater than your available balance`);
        error = true;
      }
    }

    if (!error) {
      const now = dayjs();
      const expiry = dayjs(selectedDate).add(1, "days");
      const secondsToExpire = expiry.diff(now, "seconds");
      const maxLockDurationInSeconds =
        lockOptions[maxLockDuration] * 24 * 60 * 60;
      createVest({
        amount,
        unlockTime: (secondsToExpire > maxLockDurationInSeconds
          ? maxLockDurationInSeconds
          : secondsToExpire
        ).toString(),
      });
    }
  };

  const focus = () => {
    inputEl.current?.focus();
  };

  const onAmountChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmountError(false);
    setAmount(event.target.value);
  };

  const renderMassiveDateInput = (
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
                    className={classes.displayAssetIcon}
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
                min: dayjs().add(7, "days").format("YYYY-MM-DD"),
                max: dayjs().add(lockOptions[maxLockDuration], "days").format("YYYY-MM-DD"),
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

  const renderMassiveInput = (
    amountValue: string,
    amountError: string | false,
    amountChanged: (_event: React.ChangeEvent<HTMLInputElement>) => void,
    token: GovToken | undefined
  ) => {
    return (
      <div className={classes.textField}>
        <div className={classes.inputTitleContainer}>
          <div className={classes.inputBalance}>
            <Typography
              className={classes.inputBalanceText}
              noWrap
              onClick={() => {
                setAmountPercent(100);
              }}
            >
              Balance:{" "}
              {token && token.balance
                ? " " + formatCurrency(token.balance)
                : ""}
            </Typography>
          </div>
        </div>
        <div
          className={`${classes.massiveInputContainer} ${
            amountError && classes.error
          }`}
        >
          <div className={classes.massiveInputAssetSelect}>
            <div className={classes.displaySelectContainer}>
              <div className={classes.assetSelectMenuItem}>
                <div className={classes.displayDualIconContainer}>
                  {token && token.logoURI && (
                    <img
                      className={classes.displayAssetIcon}
                      alt=""
                      src={token.logoURI}
                      height="100px"
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src =
                          "/tokens/unknown-logo.png";
                      }}
                    />
                  )}
                  {!(token && token.logoURI) && (
                    <img
                      className={classes.displayAssetIcon}
                      alt=""
                      src={"/tokens/unknown-logo.png"}
                      height="100px"
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src =
                          "/tokens/unknown-logo.png";
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className={classes.massiveInputAmount}>
            <TextField
              placeholder="0.00"
              fullWidth
              error={!!amountError}
              helperText={amountError}
              value={amountValue}
              onChange={amountChanged}
              disabled={lockLoading}
              InputProps={{
                className: classes.largeInput,
              }}
            />
            <Typography color="textSecondary" className={classes.smallerText}>
              {token?.symbol}
            </Typography>
          </div>
        </div>
      </div>
    );
  };

  const renderVestInformation = () => {
    const now = dayjs();
    const expiry = dayjs(selectedDate);
    const dayToExpire = expiry.diff(now, "days");

    const tmpNFT: VestNFT = {
      id: "future",
      lockAmount: amount,
      lockValue: BigNumber(amount)
        .times(parseInt(dayToExpire.toString()) + 1)
        .div(lockOptions[maxLockDuration])
        .toFixed(18),
      lockEnds: expiry.unix().toString(),
      actionedInCurrentEpoch: false,
      reset: false,
      lastVoted: BigInt(0),
      influence: 0,
    };

    return (
      <VestingInfo
        futureNFT={tmpNFT}
        govToken={govToken}
        veToken={veToken}
        showVestingStructure={true}
      />
    );
  };

  const onBack = () => {
    router.push("/vest");
  };

  return (
    <div className={classes.vestContainer}>
      <Paper elevation={0} className={classes.container3}>
        <div className={classes.titleSection}>
          <Tooltip title="Back to Vest" placement="top">
            <IconButton className={classes.backButton} onClick={onBack}>
              <ArrowBack className={classes.backIcon} />
            </IconButton>
          </Tooltip>
          <Typography className={classes.titleText}>Create New Lock</Typography>
        </div>
        {renderMassiveInput(amount, amountError, onAmountChanged, govToken)}
        <div>
          {renderMassiveDateInput(
            selectedDate,
            selectedDateError,
            handleDateChange
          )}
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
                    value={lockOptions[key as LockOption]}
                    control={<Radio color="primary" />}
                    label={key}
                    labelPlacement="end"
                  />
                );
              })}
            </RadioGroup>
          </div>
        </div>
        {renderVestInformation()}
        <div className={classes.actionsContainer}>
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
              {lockLoading ? `Locking` : `Lock`}
            </Typography>
            {lockLoading && (
              <CircularProgress size={10} className={classes.loadingCircle} />
            )}
          </Button>
        </div>
      </Paper>
      <br />
      <br />
    </div>
  );
}
