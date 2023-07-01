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

import { useVeToken, useVestNfts } from "../../lib/global/queries";
import { formatCurrency } from "../../utils/utils";
import WarningModal from "../warning/warning";
import { VestNFT } from "../../stores/types/types";

import GaugesTable from "./ssVotesTable";

import {
  useGaugesWithGaugesAndVotes,
  useVestVotes,
  useVotes,
} from "./lib/queries";
import { useVote } from "./lib/mutations";

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

function MyListSubheader(props: ListSubheaderProps) {
  return <ListSubheader {...props} />;
}

MyListSubheader.muiSkipListHighlight = true;

export default function Votes() {
  const [showWarning, setShowWarning] = useState(false);

  const [token, setToken] = useState<VestNFT>(initialEmptyToken);
  const [search, setSearch] = useState("");

  const { data: veToken } = useVeToken();
  const { data: vestNFTs, isFetching: isLoadingVestNfts } = useVestNfts();
  const { votes, setVotes } = useVotes();
  useVestVotes(token.id);
  const gauges = useGaugesWithGaugesAndVotes(votes);

  const { mutate: vote, isLoading: voteLoading } = useVote();

  useEffect(() => {
    if (vestNFTs && vestNFTs.length > 0) {
      const votableNFTs = vestNFTs.filter(
        (nft) => nft.votedInCurrentEpoch === false
      );
      if (votableNFTs.length > 0) {
        setToken(votableNFTs[0]);
      } else {
        setToken(vestNFTs[0]);
      }
    }
  }, [vestNFTs]);

  useEffect(() => {
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
  }, []);

  const onVote = () => {
    vote({
      votes,
      tokenID: token.id,
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

  const renderMediumInput = (
    value: VestNFT,
    options: VestNFT[] | undefined
  ) => {
    const actionedNFTs = options?.filter(
      (option) => option.votedInCurrentEpoch === true
    );
    const votableNFTs = options?.filter(
      (option) => option.votedInCurrentEpoch === false
    );
    return (
      <div>
        <div className="flex w-full flex-wrap items-center rounded-lg bg-background pl-5">
          <Grid container>
            <Grid item lg="auto" md="auto" sm={12} xs={12}>
              <Typography
                variant="body2"
                className="mr-4 py-5 px-0 text-secondary"
              >
                Please select your veNFT:
              </Typography>
            </Grid>

            <Grid item lg={6} md={6} sm={12} xs={12}>
              <div className="flex h-full w-[300px]">
                <Select
                  fullWidth
                  value={value}
                  onChange={handleChange}
                  // @ts-expect-error This is because of how material-ui works
                  InputProps={{
                    fontSize: "32px",
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
    <div className="m-auto mb-5 flex w-[calc(100%-40px)] max-w-[1400px] flex-col items-end p-0 pt-20 pb-2 xl:mb-14 xl:w-[calc(100%-180px)] xl:pt-0">
      <div className="flex flex-col gap-1 self-start text-left">
        <Typography variant="h1">Vote</Typography>
        <Typography variant="body2">
          Select your veNFT and use 100% of your votes for one or more pools to
          earn bribes and trading fees (
          <span className="text-primary">${formatCurrency(bribesAccrued)}</span>{" "}
          in total).
        </Typography>
      </div>
      <div className="flex w-full items-center justify-between py-6 px-0">
        <Grid container spacing={1}>
          <Grid item lg={true} md={true} sm={12} xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              placeholder="FTM, WFTM, 0x..."
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
            <div className="rounded-lg border border-[rgba(126,153,176,0.2)]">
              {renderMediumInput(token, vestNFTs)}
            </div>
          </Grid>
        </Grid>
      </div>
      <Paper
        elevation={0}
        className="flex w-full flex-col items-end border border-[rgba(126,153,176,0.2)]"
      >
        <GaugesTable
          gauges={filteredGauges}
          setParentSliderValues={setVotes}
          defaultVotes={votes}
          token={token}
        />
      </Paper>
      {token.votedInCurrentEpoch ? (
        <Paper
          elevation={10}
          className="fixed bottom-0 left-0 right-0 z-10 border-t border-solid border-[rgba(126,153,176,0.2)] bg-[#0e110c] md:left-1/2 md:bottom-7 md:max-w-[560px] md:-translate-x-1/2 md:border"
        >
          <Alert severity="error" className="flex justify-center py-5">
            NFT #{token.id} has already voted this epoch.
          </Alert>
        </Paper>
      ) : (
        <Paper
          elevation={10}
          className="fixed bottom-0 left-0 z-20 flex min-w-full items-center justify-between rounded-none border-t border-t-[rgba(126,153,176,0.2)] bg-[#0e110c] py-2 px-1 md:bottom-8 md:left-[calc(50%-280px)] md:min-w-[560px] md:rounded-lg md:border md:border-[rgba(126,153,176,0.2)] md:px-4"
        >
          <div className="flex items-center justify-end py-2 px-6">
            <Typography>Voting Power Used: </Typography>
            <Typography
              className={`ml-2 text-xl ${
                BigNumber(totalVotes ?? 0).gt(100)
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {totalVotes} %
            </Typography>
          </div>
          <div>
            <Button
              className="bg-background py-4 font-bold text-primary hover:bg-green-900"
              variant="contained"
              size="large"
              color="primary"
              disabled={
                voteLoading ||
                !BigNumber(totalVotes ?? 0).eq(100) ||
                isLoadingVestNfts
              }
              onClick={onVote}
            >
              <Typography className="text-base font-bold capitalize">
                {voteLoading ? `Casting Votes` : `Cast Votes`}
              </Typography>
              {voteLoading && (
                <CircularProgress size={10} className="ml-2 fill-white" />
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
