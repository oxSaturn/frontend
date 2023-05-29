import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Typography,
  Grid,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { AddCircleOutline } from "@mui/icons-material";

import { formatCurrency } from "../../utils/utils";
import stores from "../../stores";
import { ACTIONS } from "../../stores/constants/constants";
import {
  VeDistReward,
  VestNFT,
  VeToken,
  Gauge,
} from "../../stores/types/types";

import classes from "./ssRewards.module.css";
import RewardsTable from "./ssRewardsTable";

const initialEmptyToken: VestNFT = {
  id: "0",
  lockAmount: "0",
  lockEnds: "0",
  lockValue: "0",
  actionedInCurrentEpoch: false,
  reset: false,
  lastVoted: BigInt(0),
  influence: 0,
};

export default function Rewards() {
  const [, updateState] = useState<{}>();
  const forceUpdate = useCallback(() => updateState({}), []);

  const [rewards, setRewards] = useState<(Gauge | VeDistReward)[]>([]);
  const [vestNFTs, setVestNFTs] = useState<VestNFT[]>([]);
  const [token, setToken] = useState<VestNFT>(initialEmptyToken);
  const [veToken, setVeToken] = useState<VeToken | null>(null);
  const [loading, setLoading] = useState(false);

  const stableSwapUpdated = () => {
    const nfts = stores.stableSwapStore.getStore("vestNFTs");
    setVestNFTs(nfts);
    setVeToken(stores.stableSwapStore.getStore("veToken"));

    if (nfts && nfts.length > 0) {
      if (!token || token.lockEnds === "0") {
        setToken(nfts[0]);
        window.setTimeout(() => {
          stores.dispatcher.dispatch({
            type: ACTIONS.GET_REWARD_BALANCES,
            content: { tokenID: nfts[0].id },
          });
        });
      } else {
        window.setTimeout(() => {
          stores.dispatcher.dispatch({
            type: ACTIONS.GET_REWARD_BALANCES,
            content: { tokenID: token.id },
          });
        });
      }
    } else {
      window.setTimeout(() => {
        stores.dispatcher.dispatch({
          type: ACTIONS.GET_REWARD_BALANCES,
          content: { tokenID: 0 },
        });
      });
    }

    forceUpdate();
  };

  const rewardBalancesReturned = (
    rew?: (typeof stores.stableSwapStore)["store"]["rewards"]
  ) => {
    if (rew) {
      if (
        rew &&
        rew.xBribes &&
        rew.xxBribes &&
        rew.rewards &&
        rew.BLOTR_rewards &&
        rew.veDist &&
        rew.xBribes.length >= 0 &&
        rew.xxBribes.length >= 0 &&
        rew.rewards.length >= 0 &&
        rew.BLOTR_rewards.length >= 0
      ) {
        setRewards([
          ...rew.xxBribes,
          ...rew.xBribes,
          ...rew.rewards,
          ...rew.BLOTR_rewards,
          ...rew.veDist,
        ]);
      }
    } else {
      let re = stores.stableSwapStore.getStore("rewards");

      if (
        re &&
        re.xBribes &&
        re.xxBribes &&
        re.rewards &&
        re.BLOTR_rewards &&
        re.veDist &&
        re.xBribes.length >= 0 &&
        re.xxBribes.length >= 0 &&
        re.rewards.length >= 0 &&
        re.BLOTR_rewards.length >= 0
      ) {
        setRewards([
          ...re.xxBribes,
          ...re.xBribes,
          ...re.rewards,
          ...re.BLOTR_rewards,
          ...re.veDist,
        ]);
      }
    }
  };

  useEffect(() => {
    rewardBalancesReturned();
    stableSwapUpdated();

    stores.emitter.on(ACTIONS.UPDATED, stableSwapUpdated);
    stores.emitter.on(ACTIONS.REWARD_BALANCES_RETURNED, rewardBalancesReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, stableSwapUpdated);
      stores.emitter.removeListener(
        ACTIONS.REWARD_BALANCES_RETURNED,
        rewardBalancesReturned
      );
    };
  }, [token]);

  useEffect(() => {
    const claimReturned = () => {
      setLoading(false);
    };

    const claimAllReturned = () => {
      setLoading(false);
    };

    stableSwapUpdated();

    stores.emitter.on(ACTIONS.CLAIM_REWARD_RETURNED, claimReturned);
    // stores.emitter.on(ACTIONS.CLAIM_PAIR_FEES_RETURNED, claimReturned);
    stores.emitter.on(ACTIONS.CLAIM_VE_DIST_RETURNED, claimReturned);
    stores.emitter.on(ACTIONS.CLAIM_ALL_REWARDS_RETURNED, claimAllReturned);
    return () => {
      stores.emitter.removeListener(
        ACTIONS.CLAIM_REWARD_RETURNED,
        claimReturned
      );
      stores.emitter.removeListener(
        ACTIONS.CLAIM_VE_DIST_RETURNED,
        claimReturned
      );
      stores.emitter.removeListener(
        ACTIONS.CLAIM_ALL_REWARDS_RETURNED,
        claimAllReturned
      );
    };
  }, []);

  const onClaimAll = () => {
    setLoading(true);
    let sendTokenID = 0;
    if (token && token.id) {
      sendTokenID = +token.id;
    }
    stores.dispatcher.dispatch({
      type: ACTIONS.CLAIM_ALL_REWARDS,
      content: { pairs: rewards, tokenID: sendTokenID },
    });
  };

  const handleChange = (event: SelectChangeEvent<VestNFT>) => {
    setToken(event.target.value as VestNFT);
    stores.dispatcher.dispatch({
      type: ACTIONS.GET_REWARD_BALANCES,
      content: { tokenID: (event.target.value as VestNFT).id },
    });
  };

  const renderMediumInput = (value: VestNFT, options: VestNFT[]) => {
    return (
      <div className={classes.textField}>
        <div className={classes.mediumInputContainer}>
          <Grid container>
            <Grid item lg="auto" md="auto" sm={12} xs={12}>
              <Typography variant="body2" className={classes.helpText}>
                Please select your veNFT:
              </Typography>
            </Grid>
            <Grid item lg={6} md={6} sm={12} xs={12}>
              <div className={classes.mediumInputAmount}>
                <Select
                  fullWidth
                  value={value}
                  onChange={handleChange}
                  // @ts-expect-error This is because of how material-ui works
                  InputProps={{
                    className: classes.mediumInput,
                  }}
                  sx={{ "& .MuiSelect-select": { height: "inherit" } }}
                >
                  {options &&
                    options.map((option) => {
                      return (
                        <MenuItem
                          key={option.id}
                          // ok at runtime if MenuItem is an immediate child of Select since value is transferred to data-value.
                          value={option as any}
                        >
                          <div className={classes.menuOption}>
                            <Typography>Token #{option.id}</Typography>
                            <div>
                              <Typography
                                align="right"
                                className={classes.smallerText}
                              >
                                {formatCurrency(option.lockValue)}
                              </Typography>
                              <Typography
                                align="right"
                                color="textSecondary"
                                className={classes.smallerText}
                              >
                                {veToken?.symbol}
                              </Typography>
                            </div>
                          </div>
                        </MenuItem>
                      );
                    })}
                </Select>
              </div>
            </Grid>
          </Grid>
        </div>
      </div>
    );
  };

  return (
    <div className={classes.container}>
      <div className={classes.descriptionBox}>
        <Typography variant="h1">Rewards</Typography>
        <Typography variant="body2">
          Choose your veFLOW and claim your rewards.
        </Typography>
      </div>
      <div className={classes.toolbarContainer}>
        <Grid container spacing={1}>
          <Grid item lg="auto" md="auto" sm={12} xs={12}>
            <div className={classes.tokenIDContainer}>
              {renderMediumInput(token, vestNFTs)}
            </div>
          </Grid>
          <Grid item lg={true} md={true} sm={false} xs={false}>
            <div className={classes.disclaimerContainer}>
              <Typography className={classes.disclaimer}>
                Rewards are an estimation that aren&apos;t exact till the supply
                -{">"} rewardPerToken calculations have run
              </Typography>
            </div>
          </Grid>
          <Grid item lg="auto" md="auto" sm={12} xs={12}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddCircleOutline />}
              size="large"
              className={classes.buttonOverride}
              onClick={onClaimAll}
              disabled={loading}
            >
              <Typography className={classes.actionButtonText}>
                Claim All
              </Typography>
            </Button>
          </Grid>
        </Grid>
      </div>
      <RewardsTable rewards={rewards} tokenID={token?.id} />
    </div>
  );
}
