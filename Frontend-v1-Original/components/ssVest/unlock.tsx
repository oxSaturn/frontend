import { useRouter } from "next/router";
import {
  Paper,
  Typography,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

import { GovToken, VestNFT, VeToken } from "../../stores/types/types";

import VestingInfo from "./vestingInfo";
import classes from "./ssVest.module.css";
import { useWithdrawVest } from "./lib/mutations";

export default function Unlock({
  nft,
  govToken,
  veToken,
}: {
  nft: VestNFT;
  govToken: GovToken | undefined;
  veToken: VeToken | undefined;
}) {
  const router = useRouter();

  const { mutate: withdrawVest, isLoading: lockLoading } = useWithdrawVest(
    nft.id,
    () => {
      router.push("/vest");
    }
  );

  const onWithdraw = () => {
    withdrawVest();
  };

  const onBack = () => {
    router.push("/vest");
  };

  return (
    <Paper elevation={0} className={classes.container2}>
      <div className={classes.titleSection}>
        <IconButton className={classes.backButton} onClick={onBack}>
          <ArrowBack className={classes.backIcon} />
        </IconButton>
        <Typography className={classes.titleText}>
          Manage Existing Lock
        </Typography>
      </div>
      <VestingInfo currentNFT={nft} veToken={veToken} govToken={govToken} />
      <div className={classes.contentBox}>
        <Typography className={classes.para}>
          Your lock has expired. Please withdraw your lock before you can
          re-lock.
        </Typography>
      </div>
      <div className={classes.actionsContainer}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          color="primary"
          disabled={lockLoading}
          onClick={onWithdraw}
          className={classes.buttonOverride}
        >
          <Typography className={classes.actionButtonText}>
            {lockLoading ? `Withrawing` : `Withdraw`}
          </Typography>
          {lockLoading && (
            <CircularProgress size={10} className={classes.loadingCircle} />
          )}
        </Button>
      </div>
    </Paper>
  );
}
