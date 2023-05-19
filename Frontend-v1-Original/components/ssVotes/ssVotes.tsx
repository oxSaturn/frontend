import React, { useEffect, useMemo, useReducer } from "react";
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
// import { useRouter } from "next/router";

import { formatCurrency } from "../../utils/utils";
import WarningModal from "../warning/warning";
import stores from "../../stores";
import { ACTIONS } from "../../stores/constants/constants";
import {
  Gauge,
  hasGauge,
  VestNFT,
  VeToken,
  Vote,
  Votes as VotesType,
} from "../../stores/types/types";

import GaugesTable from "./ssVotesTable";
import classes from "./ssVotes.module.css";

const initialEmptyToken: VestNFT = {
  id: "0",
  lockAmount: "0",
  lockEnds: "0",
  lockValue: "0",
  actionedInCurrentEpoch: false,
  reset: false,
  lastVoted: BigInt(0),
};

function MyListSubheader(props: ListSubheaderProps) {
  return <ListSubheader {...props} />;
}

MyListSubheader.muiSkipListHighlight = true;

type ACTION =
  | { type: "showWarning" }
  | { type: "hideWarning" }
  | { type: "vote" }
  | { type: "voteDone" }
  | { type: "setVeToken"; veToken: VeToken | null }
  | { type: "setSearch"; search: string }
  | { type: "setGauges"; gauges: Gauge[] }
  | { type: "setVestNFTs"; vestNFTs: VestNFT[] }
  | { type: "setToken"; token: VestNFT }
  | { type: "setVotes"; votes: VotesType };
interface State {
  showWarning: boolean;
  isVoting: boolean;
  veToken: VeToken | null;
  search: string;
  gauges: Gauge[];
  vestNFTs: VestNFT[]; // all nfts
  token: VestNFT; // current selected nft
  votes: VotesType; // votes of current selected nft
}

function reducer(state: State, action: ACTION) {
  switch (action.type) {
    case "showWarning":
      return { ...state, showWarning: true };
    case "hideWarning":
      return { ...state, showWarning: false };
    case "vote":
      return { ...state, isVoting: true };
    case "voteDone":
      return { ...state, isVoting: false };
    case "setVeToken":
      return { ...state, veToken: action.veToken };
    case "setSearch":
      return { ...state, search: action.search };
    case "setGauges":
      return { ...state, gauges: action.gauges };
    case "setVestNFTs":
      return { ...state, vestNFTs: action.vestNFTs };
    case "setToken":
      return { ...state, token: action.token };
    case "setVotes":
      return { ...state, votes: action.votes };
    default:
      return state;
  }
}
export default function Votes() {
  const [state, dispatch] = useReducer(reducer, {
    showWarning: false,
    isVoting: false,
    veToken: null,
    search: "",
    gauges: [],
    vestNFTs: [],
    token: initialEmptyToken,
    votes: [],
  });

  // set veToken
  useEffect(() => {
    const veTokenReady = () => {
      dispatch({
        type: "setVeToken",
        veToken: stores.stableSwapStore.getStore("veToken"),
      });
    };
    // there're two emitters in stableSwapStore when veToken is ready
    // 1. ACTIONS.CONFIGURED_SS
    // 2. ACTIONS.UPDATED
    // we use the second one here
    stores.emitter.on(ACTIONS.UPDATED, veTokenReady);
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, veTokenReady);
    };
  }, []);

  // set gauges
  // similar to set veToken
  useEffect(() => {
    const pairsReady = () => {
      const as = stores.stableSwapStore.getStore("pairs");

      const filteredAssets = as.filter(hasGauge).filter((gauge) => {
        let sliderValue =
          state.votes.find((el) => el.address === gauge.address)?.value ?? 0;
        if (gauge.isAliveGauge === false && sliderValue === 0) {
          // gauge could be alive with votes in last epoch while killed in current epoch
          return false;
        }
        return true;
      });
      dispatch({
        type: "setGauges",
        gauges: filteredAssets,
      });
    };
    stores.emitter.on(ACTIONS.UPDATED, pairsReady);
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, pairsReady);
    };
  }, [state.votes]);

  // set vestNFTs
  useEffect(() => {
    const nftsReady = () => {
      const nfts = stores.stableSwapStore.getStore("vestNFTs");
      dispatch({
        type: "setVestNFTs",
        vestNFTs: nfts,
      });
    };
    stores.emitter.on(ACTIONS.UPDATED, nftsReady);
    stores.emitter.on(ACTIONS.VEST_NFTS_RETURNED, nftsReady); // run `getVestNFTs` in stableSwapStore
    // TODO we should update nfts when user votes successfully
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, nftsReady);
      stores.emitter.removeListener(ACTIONS.VEST_NFTS_RETURNED, nftsReady);
    };
  }, []);

  // set token
  useEffect(() => {
    const nfts = state.vestNFTs;
    if (state.token.id !== "0") {
      // if we have selected a nft, chances are we don't need to select again
      // but user might have voted with the nft,
      // and we need to update the token's data
      const nft = nfts.find((nft) => nft.id === state.token.id);
      if (
        nft &&
        nft?.actionedInCurrentEpoch !== state.token.actionedInCurrentEpoch &&
        nft?.lastVoted !== state.token.lastVoted
      ) {
        dispatch({
          type: "setToken",
          token: nft,
        });
      }
      return;
    } else {
      // if we haven't selected a nft, we need to select one
      if (nfts && nfts.length > 0) {
        const votableNFTs = nfts.filter(
          (nft) => nft.actionedInCurrentEpoch === false
        );
        if (votableNFTs.length > 0) {
          dispatch({
            type: "setToken",
            token: votableNFTs[0],
          });
        } else {
          dispatch({
            type: "setToken",
            token: nfts[0],
          });
        }
      }
    }
  }, [state.vestNFTs, state.token]);

  // fetch votes data for the selected nft
  useEffect(() => {
    if (state.token.id === "0") return;
    stores.dispatcher.dispatch({
      type: ACTIONS.GET_VEST_VOTES,
      content: { tokenID: state.token.id },
    });
  }, [state.token]);

  // set votes
  useEffect(() => {
    const vestVotesReturned = (votesReturned: Vote[]) => {
      const votesReturnedMapped = votesReturned.map((vote) => {
        return {
          address: vote?.address,
          value: BigNumber(
            vote && vote.votePercent ? vote.votePercent : 0
          ).toNumber(),
        };
      });
      dispatch({
        type: "setVotes",
        votes: votesReturnedMapped,
      });
    };

    stores.emitter.on(ACTIONS.VEST_VOTES_RETURNED, vestVotesReturned);

    return () => {
      stores.emitter.removeListener(
        ACTIONS.VEST_VOTES_RETURNED,
        vestVotesReturned
      );
    };
  }, []);

  // handle warning
  useEffect(() => {
    const localStorageWarningAccepted =
      window.localStorage.getItem("voting.warning");
    if (
      !localStorageWarningAccepted ||
      localStorageWarningAccepted !== "accepted"
    ) {
      dispatch({ type: "showWarning" });
    } else {
      dispatch({ type: "hideWarning" });
    }
  }, []);

  // on vote result returned
  useEffect(() => {
    const voteReturned = () => {
      dispatch({ type: "voteDone" });
      // update current nft's data
      stores.dispatcher.dispatch({
        type: ACTIONS.GET_VEST_NFTS,
      });
    };
    stores.emitter.on(ACTIONS.VOTE_RETURNED, voteReturned);

    const errorReturned = () => {
      dispatch({ type: "voteDone" });
    };
    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.VOTE_RETURNED, voteReturned);
      stores.emitter.removeListener(ACTIONS.ERROR, voteReturned);
    };
  }, []);

  const onVote = () => {
    dispatch({ type: "vote" });
    stores.dispatcher.dispatch({
      type: ACTIONS.VOTE,
      content: { votes: state.votes, tokenID: state.token.id },
    });
  };

  const acceptWarning = () => {
    window.localStorage.setItem("voting.warning", "accepted");
  };

  let totalVotes = state.votes.reduce((acc, curr) => {
    return (acc += curr.value);
  }, 0);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const nft = state.vestNFTs.find((nft) => nft.id === event.target.value);
    if (nft) {
      dispatch({
        type: "setToken",
        token: nft,
      });
    }
  };

  const onSearchChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "setSearch",
      search: event.target.value,
    });
  };

  const renderMediumInput = (value: VestNFT, options: VestNFT[]) => {
    const actionedNFTs = options.filter(
      (option) => option.actionedInCurrentEpoch === true
    );
    const votableNFTs = options.filter(
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
                  value={value.id}
                  onChange={handleChange}
                  // @ts-expect-error This is because of how material-ui works
                  InputProps={{
                    className: classes.mediumInput,
                  }}
                  sx={{ "& .MuiSelect-select": { height: "inherit" } }}
                >
                  {votableNFTs.length > 0 ? (
                    <MyListSubheader>
                      Available to Vote this Epoch
                    </MyListSubheader>
                  ) : null}
                  {votableNFTs.length > 0 &&
                    votableNFTs.map((option) => {
                      return (
                        <MenuItem
                          key={option.id}
                          // ok at runtime if MenuItem is an immediate child of Select since value is transferred to data-value.
                          value={option.id}
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
                                {state.veToken?.symbol}
                              </Typography>
                            </div>
                          </div>
                        </MenuItem>
                      );
                    })}
                  {actionedNFTs.length > 0 ? (
                    <MyListSubheader>
                      Already Voted/Reset this Epoch
                    </MyListSubheader>
                  ) : null}
                  {actionedNFTs.length > 0 &&
                    actionedNFTs.map((option) => {
                      return (
                        <MenuItem
                          key={option.id}
                          // ok at runtime if MenuItem is an immediate child of Select since value is transferred to data-value.
                          value={option.id}
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
                                {state.veToken?.symbol}
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
      state.gauges.filter((pair) => {
        if (!state.search || state.search === "") {
          return true;
        }

        const searchLower = state.search.toLowerCase();

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
    [state.gauges, state.search]
  );

  const bribesAccrued = filteredGauges
    .reduce(
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
              value={state.search}
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
              {renderMediumInput(state.token, state.vestNFTs)}
            </div>
          </Grid>
        </Grid>
      </div>
      <Paper elevation={0} className={classes.tableContainer}>
        <GaugesTable
          gauges={filteredGauges}
          setParentSliderValues={(votes) =>
            dispatch({
              type: "setVotes",
              votes,
            })
          }
          defaultVotes={state.votes}
          token={state.token}
        />
      </Paper>
      {state.token.actionedInCurrentEpoch ? (
        <Paper
          elevation={10}
          className="fixed bottom-0 left-0 right-0 z-10 border-t border-solid border-[rgba(126,153,176,0.2)] bg-[#0e110c] md:left-1/2 md:bottom-7 md:max-w-[560px] md:-translate-x-1/2 md:border"
        >
          <Alert severity="error" className="flex justify-center py-5">
            NFT #{state.token.id} has already{" "}
            {state.token.reset ? "Reset" : "Voted"} this epoch.
          </Alert>
        </Paper>
      ) : (
        <Paper elevation={10} className={classes.actionButtons}>
          <div className={classes.infoSection}>
            <Typography>Voting Power Used: </Typography>
            <Typography
              className={`${
                BigNumber(totalVotes).gt(100)
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
              disabled={state.isVoting || !BigNumber(totalVotes).eq(100)}
              onClick={onVote}
            >
              <Typography className={classes.actionButtonText}>
                {state.isVoting ? `Casting Votes` : `Cast Votes`}
              </Typography>
              {state.isVoting && (
                <CircularProgress size={10} className={classes.loadingCircle} />
              )}
            </Button>
          </div>
        </Paper>
      )}
      {state.showWarning && (
        <WarningModal
          close={() => dispatch({ type: "hideWarning" })}
          acceptWarning={acceptWarning}
        />
      )}
    </div>
  );
}
