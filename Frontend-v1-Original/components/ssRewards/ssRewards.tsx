import { useEffect, useState } from "react";
import {
  Button,
  Typography,
  Grid,
  Select,
  MenuItem,
  SelectChangeEvent,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import { AddCircleOutline } from "@mui/icons-material";

import { formatCurrency } from "../../utils/utils";
import { VestNFT } from "../../stores/types/types";
import { useVeToken, useVestNfts } from "../../lib/global/queries";

import RewardsTable from "./ssRewardsTable";
import { useRewards } from "./lib/queries";
import { useClaimAllRewards } from "./lib/mutations";

const initialEmptyToken: VestNFT = {
  id: "0",
  lockAmount: "0",
  lockEnds: "0",
  lockValue: "0",
  votedInCurrentEpoch: false,
  reset: false,
  lastVoted: BigInt(0),
  influence: 0,
};

export default function Rewards() {
  const [token, setToken] = useState<VestNFT>(initialEmptyToken);

  const { data: veToken } = useVeToken();

  const { data: vestNFTs } = useVestNfts();

  const { mutate: claimAllRewards, isLoading: loading } = useClaimAllRewards();

  useEffect(() => {
    if (vestNFTs && vestNFTs.length > 0) {
      if (!token || token.lockEnds === "0") {
        setToken(vestNFTs[0]);
      }
    }
  }, [vestNFTs, token]);

  const {
    isLoading: isLoadingRewards,
    isRefetching: isRefetchingRewards,
    data: rewards,
  } = useRewards(token?.id, (data) => {
    if (
      data.bribes &&
      data.rewards &&
      data.oBlotrRewards &&
      data.veDist &&
      data.bribes.length >= 0 &&
      data.rewards.length >= 0 &&
      data.oBlotrRewards.length >= 0
    ) {
      return [
        ...data.bribes,
        ...data.rewards,
        ...data.oBlotrRewards,
        ...data.veDist,
      ];
    }
  });

  const onClaimAll = () => {
    let sendTokenID = "0";
    if (token && token.id) {
      sendTokenID = token.id;
    }
    claimAllRewards({
      rewards,
      tokenID: sendTokenID,
    });
  };

  const handleChange = (event: SelectChangeEvent<VestNFT>) => {
    setToken(event.target.value as VestNFT);
  };

  const renderMediumInput = (
    value: VestNFT,
    options: VestNFT[] | undefined
  ) => {
    return (
      <div>
        <div className="flex min-h-[60px] w-full flex-wrap items-center rounded-lg bg-primaryBg pl-5">
          <Grid container>
            <Grid item lg="auto" md="auto" sm={12} xs={12}>
              <Typography
                variant="body2"
                className="mr-4 px-0 py-4 text-secondaryGray"
              >
                Please select your veNFT:
              </Typography>
            </Grid>
            <Grid item lg={6} md={6} sm={12} xs={12}>
              <div className="h-full w-full min-w-[300px] flex-[1]">
                <Select
                  fullWidth
                  value={value}
                  onChange={handleChange}
                  // @ts-expect-error This is because of how material-ui works
                  InputProps={{
                    className: "text-3xl",
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
                          <div className="flex w-[calc(100%-24px)] items-center justify-between">
                            <Typography>Token #{option.id}</Typography>
                            <div>
                              <Typography align="right" className="text-xs">
                                {formatCurrency(option.lockValue)}
                              </Typography>
                              <Typography
                                align="right"
                                color="textSecondary"
                                className="text-xs"
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
    <div className="m-auto mb-5 mt-[100px] w-[calc(100%-40px)] max-w-[1400px] flex-col items-end pb-2 min-[1200px]:mb-16 min-[1200px]:mt-['unset'] min-[1200px]:w-[calc(100%-180px)]">
      <div className="flex justify-between">
        <div className="flex flex-col gap-1 self-start text-left">
          <Typography variant="h1">Rewards</Typography>
          <Typography variant="body2">
            Choose your veFLOW and claim your rewards.
          </Typography>
        </div>
        {isRefetchingRewards && <CircularProgress size={20} />}
      </div>
      <div className="flex w-full items-center justify-between py-6 px-0">
        <Grid container spacing={1}>
          <Grid item lg="auto" md="auto" sm={12} xs={12}>
            <div>{renderMediumInput(token, vestNFTs)}</div>
          </Grid>
          <Grid item lg={true} md={true} sm={false} xs={false}>
            <div className="flex items-center justify-center">
              <Typography className="rounded-lg border border-cantoGreen bg-primaryBg p-5 text-xs font-extralight">
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
              className="w-full min-w-[200px] bg-primaryBg font-bold text-cantoGreen hover:bg-[rgb(19,44,60)]"
              onClick={onClaimAll}
              disabled={loading}
            >
              <Typography>Claim All</Typography>
            </Button>
          </Grid>
        </Grid>
      </div>
      {!isLoadingRewards ? (
        <RewardsTable rewards={rewards} tokenID={token?.id} />
      ) : (
        <>
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
        </>
      )}
    </div>
  );
}
