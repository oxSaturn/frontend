import { Typography } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { formatCurrency } from "../../utils/utils";
import { GovToken, VestNFT, VeToken } from "../../stores/types/types";

import classes from "./ssVest.module.css";
import { lockOptions } from "./lockDuration";

dayjs.extend(relativeTime);

interface VestingInfoProps {
  veToken: VeToken | null;
  govToken: GovToken | null;
  currentNFT?: VestNFT;
  futureNFT?: VestNFT;
  showVestingStructure?: boolean;
}

export default function VestingInfo({
  currentNFT,
  futureNFT,
  veToken,
  govToken,
  showVestingStructure,
}: VestingInfoProps) {
  return (
    <div className={classes.vestInfoContainer}>
      {currentNFT && (
        <>
          <Typography className={classes.title}>
            Your current voting power is:
          </Typography>
          <div className={classes.mainSection}>
            <Typography className={classes.amount}>
              {formatCurrency(currentNFT?.lockValue)} {veToken?.symbol}
            </Typography>
            <div className={classes.values}>
              <Typography
                color="textSecondary"
                align="right"
                className={classes.val}
              >
                {formatCurrency(currentNFT.lockAmount)} {govToken?.symbol}{" "}
                locked expires {dayjs.unix(+currentNFT?.lockEnds).fromNow()}{" "}
              </Typography>
              <Typography
                color="textSecondary"
                align="right"
                className={classes.val}
              >
                Locked until{" "}
                {dayjs.unix(+currentNFT?.lockEnds).format("YYYY / MM / DD")}
              </Typography>
            </div>
          </div>
        </>
      )}
      {futureNFT && (
        <>
          <Typography className={classes.title}>
            Your voting power will be:
          </Typography>
          <div className={classes.mainSection}>
            <Typography className={classes.amount}>
              {formatCurrency(futureNFT?.lockValue)} {veToken?.symbol}
            </Typography>
            <div className={classes.values}>
              <Typography
                color="textSecondary"
                align="right"
                className={classes.val}
              >
                {formatCurrency(futureNFT.lockAmount)} {govToken?.symbol} locked
                expires {dayjs.unix(+futureNFT?.lockEnds).fromNow()}{" "}
              </Typography>
              <Typography
                color="textSecondary"
                align="right"
                className={classes.val}
              >
                Locked until{" "}
                {dayjs.unix(+futureNFT?.lockEnds).format("YYYY / MM / DD")}
              </Typography>
            </div>
          </div>
        </>
      )}
      {showVestingStructure && (
        <div className={classes.seccondSection}>
          {Object.entries(lockOptions)
            .sort((a, b) => a[1] - b[1])
            .map(([option], index) => (
              <Typography
                key={option}
                className={classes.info}
                color="textSecondary"
              >
                1 {govToken?.symbol} locked for {option} ={" "}
                {["0.25", "0.5", "0.75", "1.00"][index]} {veToken?.symbol}
              </Typography>
            ))}
        </div>
      )}
    </div>
  );
}
