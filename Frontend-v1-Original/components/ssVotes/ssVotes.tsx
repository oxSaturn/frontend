import React, { useState, useEffect, useMemo } from "react";
import {
  Paper,
  Typography,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  MenuItem,
  Select,
  Grid,
  SelectChangeEvent,
  ListSubheader,
  type ListSubheaderProps,
  Alert,
} from "@mui/material";
import BigNumber from "bignumber.js";
import { Search } from "@mui/icons-material";

import { useVeToken } from "../../lib/global/queries";
import { useVestNfts } from "../ssVests/queries";
import { formatCurrency } from "../../utils/utils";
import WarningModal from "../warning/warning";
import stores from "../../stores";
import { ACTIONS } from "../../stores/constants/constants";
import { VestNFT } from "../../stores/types/types";

import GaugesTable from "./ssVotesTable";

import { useGaugesWithGaugesAndVotes, useVestVotes, useVotes } from "./queries";
import classes from "./ssVotes.module.css";

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

function MyListSubheader(props: ListSubheaderProps) {
  return <ListSubheader {...props} />;
}

MyListSubheader.muiSkipListHighlight = true;

export default function Votes() {
  const [showWarning, setShowWarning] = useState(false);

  const [voteLoading, setVoteLoading] = useState(false);
  const [token, setToken] = useState<VestNFT>(initialEmptyToken);
  const [search, setSearch] = useState("");

  const { data: veToken } = useVeToken();
  const { data: vestNFTs } = useVestNfts();
  const { votes, setVotes } = useVotes();
  useVestVotes(token.id);
  const { data: gauges } = useGaugesWithGaugesAndVotes(votes);

  useEffect(() => {
    if (vestNFTs && vestNFTs.length > 0) {
      const votableNFTs = vestNFTs.filter(
        (nft) => nft.actionedInCurrentEpoch === false
      );
      if (votableNFTs.length > 0) {
        setToken(votableNFTs[0]);
      } else {
        setToken(vestNFTs[0]);
      }
    }
  }, [vestNFTs]);

  useEffect(() => {
    const voteReturned = () => {
      setVoteLoading(false);
    };

    stores.emitter.on(ACTIONS.VOTE_RETURNED, voteReturned);
    stores.emitter.on(ACTIONS.ERROR, voteReturned);

    const localStorageWarningAccepted =
      window.localStorage.getItem("voting.warning");
    if (
      !localStorageWarningAccepted ||
      localStorageWarningAccepted !== "accepted"
    ) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);

    return () => {
      stores.emitter.removeListener(ACTIONS.VOTE_RETURNED, voteReturned);
      stores.emitter.removeListener(ACTIONS.ERROR, voteReturned);
    };
  }, []);

  const onVote = () => {
    setVoteLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.VOTE,
      content: { votes, tokenID: token.id },
    });
  };

  const acceptWarning = () => {
    window.localStorage.setItem("voting.warning", "accepted");
  };

  let totalVotes = votes?.reduce((acc, curr) => {
    return (acc += curr.value);
  }, 0);

  const handleChange = (event: SelectChangeEvent<VestNFT>) => {
    setToken(event.target.value as VestNFT);
  };

  const onSearchChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  // const onBribe = () => {
  //   router.push("/bribe/create");
  // };

  const renderMediumInput = (
    value: VestNFT,
    options: VestNFT[] | undefined
  ) => {
    const actionedNFTs = options?.filter(
      (option) => option.actionedInCurrentEpoch === true
    );
    const votableNFTs = options?.filter(
      (option) => option.actionedInCurrentEpoch === false
    );
    return (
      <div className={classes.textField}>
        <div className={classes.mediumInputContainer}>
          <Grid container>
            <Grid item lg="auto" md="auto" sm={12} xs={12}>
              <Typography variant="body2" className={classes.smallText}>
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
                  {votableNFTs && votableNFTs.length > 0 ? (
                    <MyListSubheader>
                      Available to Vote this Epoch
                    </MyListSubheader>
                  ) : null}
                  {votableNFTs &&
                    votableNFTs.length > 0 &&
                    votableNFTs.map((option) => {
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
                  {actionedNFTs && actionedNFTs.length > 0 ? (
                    <MyListSubheader>
                      Already Voted/Reset this Epoch
                    </MyListSubheader>
                  ) : null}
                  {actionedNFTs &&
                    actionedNFTs.length > 0 &&
                    actionedNFTs.map((option) => {
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

  const filteredGauges = useMemo(
    () =>
      gauges?.filter((pair) => {
        if (!search || search === "") {
          return true;
        }

        const searchLower = search.toLowerCase();

        if (
          pair.symbol.toLowerCase().includes(searchLower) ||
          pair.address.toLowerCase().includes(searchLower) ||
          pair.token0.symbol.toLowerCase().includes(searchLower) ||
          pair.token0.address.toLowerCase().includes(searchLower) ||
          pair.token0.name.toLowerCase().includes(searchLower) ||
          pair.token1.symbol.toLowerCase().includes(searchLower) ||
          pair.token1.address.toLowerCase().includes(searchLower) ||
          pair.token1.name.toLowerCase().includes(searchLower)
        ) {
          return true;
        }

        return false;
      }),
    [gauges, search]
  );

  const bribesAccrued = filteredGauges
    ?.reduce(
      (
        acc: number,
        row: {
          gauge: {
            tbv: number;
          };
        }
      ) => acc + row.gauge.tbv,
      0
    )
    .toFixed(2);

  return (
    <div className={classes.container}>
      <div className={classes.descriptionTimerBox}>
        <div className={classes.descriptionBox}>
          <Typography variant="h1">Vote</Typography>
          <Typography variant="body2">
            Select your veNFT and use 100% of your votes for one or more pools
            to earn bribes and trading fees (
            <span className="text-cantoGreen">
              ${formatCurrency(bribesAccrued)}
            </span>{" "}
            in total).
          </Typography>
        </div>
      </div>
      <div className={classes.topBarContainer}>
        <Grid container spacing={1}>
          {/* <Grid item lg='auto' sm={12} xs={12}>

              <Button
                variant="contained"
                color="secondary"
                className={classes.button}
                startIcon={<AddCircleOutlineIcon />}
                size='large'
                className={ classes.buttonOverride }
                color='primary'
                onClick={ onBribe }
              >
                <Typography className={ classes.actionButtonText }>{ `Create Bribe` }</Typography>
              </Button>

          </Grid> */}
          <Grid item lg={true} md={true} sm={12} xs={12}>
            <TextField
              className={classes.searchContainer}
              variant="outlined"
              fullWidth
              placeholder="CANTO, NOTE, 0x..."
              value={search}
              onChange={onSearchChanged}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fill: "white" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item lg="auto" sm={12} xs={12}>
            <div className={classes.tokenIDContainer}>
              {renderMediumInput(token, vestNFTs)}
            </div>
          </Grid>
        </Grid>
      </div>
      <Paper elevation={0} className={classes.tableContainer}>
        <GaugesTable
          gauges={filteredGauges}
          setParentSliderValues={setVotes}
          defaultVotes={votes}
          token={token}
        />
      </Paper>
      {token.actionedInCurrentEpoch ? (
        <Paper
          elevation={10}
          className="fixed bottom-0 left-0 right-0 z-10 border-t border-solid border-[rgba(126,153,176,0.2)] bg-[#0e110c] md:left-1/2 md:bottom-7 md:max-w-[560px] md:-translate-x-1/2 md:border"
        >
          <Alert severity="error" className="flex justify-center py-5">
            NFT #{token.id} has already {token.reset ? "Reset" : "Voted"} this
            epoch.
          </Alert>
        </Paper>
      ) : (
        <Paper elevation={10} className={classes.actionButtons}>
          <div className={classes.infoSection}>
            <Typography>Voting Power Used: </Typography>
            <Typography
              className={`${
                BigNumber(totalVotes ?? 0).gt(100)
                  ? classes.errorText
                  : classes.helpText
              }`}
            >
              {totalVotes} %
            </Typography>
          </div>
          <div>
            <Button
              className={classes.buttonOverrideFixed}
              variant="contained"
              size="large"
              color="primary"
              disabled={voteLoading || !BigNumber(totalVotes ?? 0).eq(100)}
              onClick={onVote}
            >
              <Typography className={classes.actionButtonText}>
                {voteLoading ? `Casting Votes` : `Cast Votes`}
              </Typography>
              {voteLoading && (
                <CircularProgress size={10} className={classes.loadingCircle} />
              )}
            </Button>
          </div>
        </Paper>
      )}
      {showWarning && (
        <WarningModal
          close={() => setShowWarning(false)}
          acceptWarning={acceptWarning}
        />
      )}
    </div>
  );
}
