import { useState } from "react";
import { Typography, Button, TextField, CircularProgress } from "@mui/material";
import { useRouter } from "next/router";
import BigNumber from "bignumber.js";

import { formatCurrency } from "../../utils/utils";
import { GovToken, VestNFT } from "../../stores/types/types";

import classes from "./ssVest.module.css";
import { useIncreaseVestAmount } from "./lib/mutations";

export default function LockAmount({
  nft,
  govToken,
  updateLockAmount,
}: {
  nft: VestNFT;
  govToken: GovToken | undefined;
  updateLockAmount: (_arg: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [amountError] = useState(false);

  const router = useRouter();

  const { mutate: increateVestAmount, isLoading: lockLoading } =
    useIncreaseVestAmount(() => {
      router.push("/vest");
    });

  const setAmountPercent = (percent: number) => {
    const val = BigNumber(govToken?.balance || "0")
      .times(percent)
      .div(100)
      .toFixed(govToken?.decimals ?? 18);
    setAmount(val);
    updateLockAmount(val);
  };

  const onLock = () => {
    increateVestAmount({
      amount,
      tokenID: nft.id,
    });
  };

  const amountChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
    updateLockAmount(event.target.value);
  };

  const renderMassiveInput = (
    amountValue: string,
    amountError: boolean,
    amountChanged: (_event: React.ChangeEvent<HTMLInputElement>) => void,
    balance: string | null,
    logo: string | null
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
              Balance: {balance ? " " + formatCurrency(balance) : ""}
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
                  {logo && (
                    <img
                      className={classes.displayAssetIcon}
                      alt=""
                      src={logo}
                      height="100px"
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src =
                          "/tokens/unknown-logo.png";
                      }}
                    />
                  )}
                  {!logo && (
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
              error={amountError}
              helperText={amountError}
              value={amountValue}
              onChange={amountChanged}
              disabled={lockLoading}
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
        {renderMassiveInput(
          amount,
          amountError,
          amountChanged,
          govToken?.balance ?? null,
          govToken?.logoURI ?? null
        )}
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
            {lockLoading ? `Increasing Lock Amount` : `Increase Lock Amount`}
          </Typography>
          {lockLoading && (
            <CircularProgress size={10} className={classes.loadingCircle} />
          )}
        </Button>
      </div>
    </div>
  );
}
