import { useState, useMemo, useRef, memo } from "react";
import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Typography,
  Slider,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
} from "@mui/material";
import BigNumber from "bignumber.js";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  OpenInNewOutlined,
  InfoOutlined,
} from "@mui/icons-material";

import { Tooltip } from "../common/radixTooltip";

import { formatCurrency } from "../../utils/utils";
import { Gauge, Vote, VestNFT, Votes } from "../../stores/types/types";

import tokens from "../../tokens.json";
import { formatTVL } from "../liquidityPairs/LiquidityPairsTable";

const headCells = [
  { id: "expand", numeric: false, disablePadding: true, label: "" },
  { id: "asset", numeric: false, disablePadding: false, label: "Asset" },
  {
    id: "tvl",
    numeric: true,
    disablePadding: false,
    label: "TVL",
  },
  {
    id: "totalVotes",
    numeric: true,
    disablePadding: false,
    label: "Total Votes",
  },
  {
    id: "votingAPR",
    numeric: true,
    disablePadding: false,
    label: "Voting APR",
  },
  {
    id: "totalBribesUSD",
    numeric: true,
    disablePadding: false,
    label: "Total Bribe Value",
  },
  {
    id: "apy",
    numeric: true,
    disablePadding: false,
    label: "Bribes",
  },
  {
    id: "rewardEstimate",
    numeric: true,
    disablePadding: false,
    label: "Reward Estimate",
  },
  {
    id: "myVotes",
    numeric: true,
    disablePadding: false,
    label: "My Votes",
  },
  {
    id: "mvp",
    numeric: true,
    disablePadding: false,
    label: "My Vote %",
  },
] as const;

type OrderBy = (typeof headCells)[number]["id"];

function EnhancedTableHead(props: {
  order: "asc" | "desc";
  orderBy: OrderBy;
  onRequestSort: (_event: undefined, _property: OrderBy) => void;
}) {
  const { order, orderBy, onRequestSort } = props;

  const createSortHandler = (property: OrderBy) => () => {
    onRequestSort(undefined, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            className="border-b border-b-[rgba(104,108,122,0.2)]"
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={"normal"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "desc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.id === "votingAPR" ||
              headCell.id === "totalBribesUSD" ? (
                <Tooltip content="The below ranges indicate that options are being used as part of bribes for the pool. The lowest number indicated exercising option token to liquid tokens, whereas the higher for LP of the underlying token.">
                  <h5 className="text-xs font-extralight inline-flex items-center">
                    <InfoOutlined className="w-5 mr-1" />
                    {headCell.label}
                  </h5>
                </Tooltip>
              ) : headCell.id === "rewardEstimate" ? (
                <Tooltip content="The below estimate takes into account minimum value of bribes.">
                  <h5 className="text-xs font-extralight inline-flex items-center">
                    <InfoOutlined className="w-5 mr-1" />
                    {headCell.label}
                  </h5>
                </Tooltip>
              ) : (
                <Typography variant="h5" className="text-xs font-extralight">
                  {headCell.label}
                </Typography>
              )}
              {orderBy === headCell.id ? (
                <span className="absolute top-5 m-[-1px] h-[1px] w-[1px] overflow-hidden text-clip border-0 border-none p-0">
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </span>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export default function EnhancedTable({
  gauges,
  setParentSliderValues,
  defaultVotes,
  token,
}: {
  gauges: Gauge[] | undefined;
  setParentSliderValues: (_votes: Votes | undefined) => void;
  defaultVotes: Votes | undefined;
  token: VestNFT;
}) {
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("votingAPR");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [disabledSort, setDisabledSort] = useState(false);
  const votesRef = useRef<Gauge[] | null>(null);

  const onSliderChange = (
    event: Event,
    value: number | number[],
    asset: Gauge
  ) => {
    if (
      orderBy === "mvp" ||
      orderBy === "myVotes" ||
      orderBy === "rewardEstimate"
    ) {
      setDisabledSort(true);
    }
    let newSliderValues = defaultVotes ? [...defaultVotes] : [];

    newSliderValues = newSliderValues.map((val) => {
      if (asset?.address === val.address && !Array.isArray(value)) {
        val.value = value;
      }
      return val;
    });

    setParentSliderValues(newSliderValues);
  };

  const handleRequestSort = (event: undefined, property: OrderBy) => {
    if (
      disabledSort &&
      (property === "mvp" ||
        property === "myVotes" ||
        property === "rewardEstimate")
    ) {
      return;
    } else if (disabledSort) {
      setDisabledSort(false);
    }

    if (orderBy === property) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrder("desc");
    }
    setOrderBy(property);
  };

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows =
    rowsPerPage -
    Math.min(rowsPerPage, (gauges?.length ?? 0) - page * rowsPerPage);

  const sortedGauges = useMemo(() => {
    if (disabledSort) {
      return votesRef.current;
    }
    votesRef.current = stableSort(
      gauges ?? [],
      getComparator(order, orderBy, defaultVotes, token)
    ).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    return votesRef.current;
  }, [
    gauges,
    order,
    orderBy,
    page,
    rowsPerPage,
    defaultVotes,
    disabledSort,
    token,
  ]);

  if (!gauges || gauges.length === 0) {
    return (
      <div className="w-full">
        <TableContainer className="px-6 lg:overflow-x-hidden">
          <Table
            aria-labelledby="tableTitle"
            size={"medium"}
            aria-label="enhanced table"
          >
            <TableBody>
              <Skeleton variant="rounded" height={40} className="my-3 w-full" />
              <Skeleton variant="rounded" height={40} className="my-3 w-full" />
              <Skeleton variant="rounded" height={40} className="my-3 w-full" />
              <Skeleton variant="rounded" height={40} className="my-3 w-full" />
              <Skeleton variant="rounded" height={40} className="my-3 w-full" />
              <Skeleton variant="rounded" height={40} className="my-3 w-full" />
              <Skeleton variant="rounded" height={40} className="my-3 w-full" />
              <Skeleton variant="rounded" height={40} className="my-3 w-full" />
              <Skeleton variant="rounded" height={40} className="my-3 w-full" />
              <Skeleton variant="rounded" height={40} className="my-3 w-full" />
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={gauges?.length ?? 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <TableContainer className="lg:overflow-x-hidden">
        <Table
          aria-labelledby="tableTitle"
          size={"medium"}
          aria-label="enhanced table"
        >
          <EnhancedTableHead
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
          />
          <TableBody>
            {sortedGauges?.map((row) => (
              <VotesRow
                row={row}
                token={token}
                defaultVotes={defaultVotes}
                onSliderChange={onSliderChange}
                key={row.address + row.gauge.address}
              />
            ))}
            {emptyRows > 0 && (
              <TableRow style={{ height: 61 * emptyRows }}>
                <TableCell colSpan={7} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={gauges.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
}

const VotesRow = memo(function VotesRow({
  row,
  token,
  defaultVotes,
  onSliderChange,
}: {
  row: Gauge;
  token: VestNFT;
  defaultVotes: Votes | undefined;
  onSliderChange: (
    _event: Event,
    _value: number | number[],
    _row: Gauge
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const token0Info =
    tokens[row.token0.address.toLowerCase() as keyof typeof tokens];
  const token1Info =
    tokens[row.token1.address.toLowerCase() as keyof typeof tokens];

  let sliderValue = defaultVotes?.find((el) => el.address === row?.address)
    ?.value;
  if (!sliderValue) {
    sliderValue = 0;
  }

  let rewardEstimate: number | undefined;
  const votesCasting = (sliderValue / 100) * parseFloat(token?.lockValue);
  if (votesCasting > 0 && row.gauge.weight) {
    const divideBy = token?.votedInCurrentEpoch
      ? parseFloat(row.gauge.weight)
      : votesCasting + parseFloat(row.gauge.weight);

    rewardEstimate =
      row.gauge.min_tbv > 0 && sliderValue > 0
        ? (row.gauge.min_tbv * votesCasting) / divideBy
        : 0;
  }
  const rewardPerThousand =
    row.gauge.weight && parseFloat(row.gauge.weight) > 0
      ? (row.gauge.min_tbv / parseFloat(row.gauge.weight)) * 1000
      : 0;

  return (
    <>
      <TableRow>
        <TableCell align="right" size="small">
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
            title="View Pair"
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <div className="flex items-center">
            <div className="relative flex h-[35px] w-[70px]">
              <img
                className="absolute left-0 top-0 rounded-[30px] border-[3px] border-[rgb(25,33,56)]"
                src={
                  row && row.token0 && row.token0.logoURI
                    ? row.token0.logoURI
                    : ``
                }
                width="37"
                height="37"
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src =
                    "/tokens/unknown-logo.png";
                }}
              />
              <img
                className="absolute left-6 top-0 z-[1] rounded-[30px] border-[3px] border-[rgb(25,33,56)]"
                src={
                  row && row.token1 && row.token1.logoURI
                    ? row.token1.logoURI
                    : ``
                }
                width="37"
                height="37"
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src =
                    "/tokens/unknown-logo.png";
                }}
              />
            </div>
            <div>
              <Typography variant="h2" className="text-xs font-extralight">
                <a
                  href={`https://dexscreener.com/fantom/${row.address}`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="hover:underline"
                >
                  {row.symbol}
                </a>
              </Typography>
              <Typography
                variant="h5"
                className="text-xs font-extralight"
                color="textSecondary"
              >
                {row.isStable ? "Stable Pool" : "Volatile Pool"}
              </Typography>
            </div>
          </div>
        </TableCell>
        {/* insert tvl */}
        <TableCell align="right">
          <Typography variant="h2" className="text-xs font-extralight">
            {formatTVL(row.tvl)}
          </Typography>
        </TableCell>
        <TableCell align="right">
          {!!row.gauge.weight && !!row.gauge.weightPercent ? (
            <>
              <Typography variant="h2" className="text-xs font-extralight">
                {formatCurrency(row.gauge.weight)}
              </Typography>
              <Typography
                variant="h5"
                className="text-xs font-extralight"
                color="textSecondary"
              >
                {formatCurrency(row.gauge.weightPercent)} %
              </Typography>
            </>
          ) : (
            <div className="flex items-center justify-end max-[1000px]:block">
              <Skeleton
                variant="rectangular"
                width={120}
                height={16}
                style={{ marginTop: "1px", marginBottom: "1px" }}
              />
            </div>
          )}
        </TableCell>
        <TableCell align="right">
          <Typography variant="h2" className="text-xs font-extralight">
            {row.gauge.max_apr - row.gauge.min_apr < 10
              ? `${row.gauge.min_apr.toFixed()}%`
              : `${row.gauge.min_apr.toFixed()}-${row.gauge.max_apr.toFixed()}%`}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="h2" className="text-xs font-extralight">
            {row.gauge.max_tbv - row.gauge.min_tbv < 10
              ? `$${formatCurrency(row.gauge.min_tbv)}`
              : `$${formatCurrency(row.gauge.min_tbv)}-$${formatCurrency(
                  row.gauge.max_tbv
                )}`}
          </Typography>
        </TableCell>
        <TableCell align="right">
          {/* NOTE: instead of row.gauge.bribes from api show aggregated gaugebribes which equalss pair.gauge.bribes */}
          {row.gaugebribes ? (
            row.gaugebribes.map((bribe) => (
              <div
                className="flex items-center justify-end"
                key={bribe.token.symbol}
              >
                <Typography variant="h2" className="text-xs font-extralight">
                  {formatCurrency(bribe.rewardAmmount)}
                </Typography>
                <Typography
                  variant="h5"
                  className="text-xs font-extralight"
                  color="textSecondary"
                >
                  {bribe.token.symbol}
                </Typography>
              </div>
            ))
          ) : (
            <>
              <div className="flex items-center justify-end max-[1000px]:block">
                <Skeleton
                  variant="rectangular"
                  width={120}
                  height={16}
                  style={{ marginTop: "1px", marginBottom: "1px" }}
                />
              </div>
              <div className="flex items-center justify-end max-[1000px]:block">
                <Skeleton
                  variant="rectangular"
                  width={120}
                  height={16}
                  style={{ marginTop: "1px", marginBottom: "1px" }}
                />
              </div>
              <div className="flex items-center justify-end max-[1000px]:block">
                <Skeleton
                  variant="rectangular"
                  width={120}
                  height={16}
                  style={{ marginTop: "1px", marginBottom: "1px" }}
                />
              </div>
            </>
          )}
          {/* {row.gauge.bribes.map((bribe, idx) => {
            return bribe.rewardAmount !== undefined ? (
              <div
                className="flex items-center justify-end"
                key={bribe.token.symbol}
              >
                <Typography variant="h2" className="text-xs font-extralight">
                  {formatCurrency(bribe.rewardAmount)}
                </Typography>
                <Typography
                  variant="h5"
                  className="text-xs font-extralight"
                  color="textSecondary"
                >
                  {bribe.token.symbol}
                </Typography>
              </div>
            ) : (
              <div className="flex items-center justify-end max-[1000px]:block">
                <Skeleton
                  variant="rectangular"
                  width={120}
                  height={16}
                  style={{ marginTop: "1px", marginBottom: "1px" }}
                  key={bribe.token.symbol}
                />
              </div>
            );
          })} */}
        </TableCell>
        <TableCell align="right">
          {!rewardEstimate ? (
            <>
              <Typography variant="h2" className="text-xs font-extralight">
                $
                {formatCurrency(
                  rewardPerThousand > row.gauge.min_tbv
                    ? row.gauge.min_tbv
                    : rewardPerThousand
                )}
              </Typography>
              <Typography
                variant="h5"
                className="text-xs font-extralight"
                color="textSecondary"
              >
                per 1000 votes
              </Typography>
            </>
          ) : (
            <Typography variant="h2" className="text-xs font-extralight">
              ${formatCurrency(rewardEstimate)}
            </Typography>
          )}
        </TableCell>
        <TableCell align="right">
          <Typography variant="h2" className="text-xs font-extralight">
            {formatCurrency(votesCasting)}
          </Typography>
          <Typography
            variant="h5"
            className="text-xs font-extralight"
            color="textSecondary"
          >
            {formatCurrency(sliderValue)} %
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Slider
            valueLabelDisplay="auto"
            value={sliderValue}
            onChange={(event, value) => {
              onSliderChange(event, value, row);
            }}
            min={0}
            max={100}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="py-0"></TableCell>
        <TableCell className="py-0" colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List disablePadding={true} dense className="pb-4">
              {(
                [
                  [row.token0, token0Info],
                  [row.token1, token1Info],
                ] as const
              ).map(([token, info]) => {
                return (
                  <ListItem disablePadding key={token.address}>
                    <ListItemAvatar className="flex min-w-[70px] justify-end">
                      <Avatar
                        sx={{ width: 34, height: 34 }}
                        className="mr-[9px] border-2 border-solid border-[rgb(25,33,56)] bg-transparent"
                      >
                        <img
                          loading="lazy"
                          className="h-[31px] w-[31px]"
                          src={token?.logoURI ?? "/tokens/unknown-logo.png"}
                          alt={token?.symbol}
                        />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography className="text-xs font-extralight">
                          {token.name}
                        </Typography>
                      }
                      secondary={
                        <>
                          <div className="flex items-center">
                            <a
                              href={`https://ftmscan.com/address/${token.address}`}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="text-xs font-extralight transition-all duration-200 hover:text-blue-400 hover:underline"
                            >
                              Contract Address{" "}
                              <OpenInNewOutlined fontSize="inherit" />
                            </a>
                            {info?.homepage ? (
                              <>
                                ・
                                <a
                                  href={info?.homepage}
                                  target="_blank"
                                  rel="noopener noreferrer nofollow"
                                  className="text-xs font-extralight transition-all duration-200 hover:text-blue-400 hover:underline"
                                  title={`Visit ${info?.name} homepage`}
                                >
                                  Home Page{" "}
                                  <OpenInNewOutlined fontSize="inherit" />
                                </a>
                              </>
                            ) : null}
                          </div>
                          <div className="max-w-[400px] text-xs">
                            {/* short description here */}
                          </div>
                        </>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
});

function descendingComparator(
  a: Gauge,
  b: Gauge,
  orderBy: OrderBy,
  defaultVotes?: Array<Pick<Vote, "address"> & { value: number }>,
  token?: VestNFT
) {
  if (!a || !b) {
    return 0;
  }

  switch (orderBy) {
    case "asset":
      let caseA = a.symbol.toLowerCase();
      let caseB = b.symbol.toLowerCase();
      if (caseB < caseA) {
        return -1;
      }
      if (caseB > caseA) {
        return 1;
      }
      return 0;

    case "tvl":
      if (BigNumber(b.tvl).lt(a.tvl)) {
        return -1;
      }
      if (BigNumber(b.tvl).gt(a.tvl)) {
        return 1;
      }
      return 0;

    case "votingAPR":
      if (BigNumber(b.gauge.min_apr).lt(a.gauge.min_apr)) {
        return -1;
      }
      if (BigNumber(b.gauge.min_apr).gt(a.gauge.min_apr)) {
        return 1;
      }
      return 0;

    case "rewardEstimate":
      const sliderValueA = defaultVotes?.find((el) => el.address === a?.address)
        ?.value;
      const sliderValueB = defaultVotes?.find((el) => el.address === b?.address)
        ?.value;
      let rewardEstimateA: number | undefined;
      let rewardEstimateB: number | undefined;

      const votesCastingA =
        (sliderValueA ?? 0 / 100) * parseFloat(token?.lockValue ?? "0");
      if (votesCastingA > 0 && a.gauge.weight && sliderValueA) {
        const divideByA = token?.votedInCurrentEpoch
          ? parseFloat(a.gauge.weight)
          : votesCastingA + parseFloat(a.gauge.weight);
        rewardEstimateA =
          a.gauge.min_tbv > 0 && sliderValueA > 0
            ? (a.gauge.min_tbv * votesCastingA) / divideByA
            : 0;
      }

      const votesCastingB =
        (sliderValueB ?? 0 / 100) * parseFloat(token?.lockValue ?? "0");
      if (votesCastingB > 0 && b.gauge.weight && sliderValueB) {
        const divideByB = token?.votedInCurrentEpoch
          ? parseFloat(b.gauge.weight)
          : votesCastingB + parseFloat(b.gauge.weight);
        rewardEstimateB =
          b.gauge.min_tbv > 0 && sliderValueB > 0
            ? (b.gauge.min_tbv * votesCastingB) / divideByB
            : 0;
      }

      const _rewardPerThousandA =
        a.gauge.weight && parseFloat(a.gauge.weight) > 0
          ? (a.gauge.min_tbv / parseFloat(a.gauge.weight)) * 1000
          : 0;
      const _rewardPerThousandB =
        b.gauge.weight && parseFloat(b.gauge.weight) > 0
          ? (b.gauge.min_tbv / parseFloat(b.gauge.weight)) * 1000
          : 0;
      const rewardPerThousandA =
        _rewardPerThousandA > a.gauge.min_tbv
          ? a.gauge.min_tbv
          : _rewardPerThousandA;
      const rewardPerThousandB =
        _rewardPerThousandB > b.gauge.min_tbv
          ? b.gauge.min_tbv
          : _rewardPerThousandB;

      if (rewardEstimateB && rewardEstimateA) {
        if (rewardEstimateB < rewardEstimateA) {
          return -1;
        }
        if (rewardEstimateB > rewardEstimateA) {
          return 1;
        }
      } else if (rewardEstimateB && !rewardEstimateA) {
        return 1;
      } else if (rewardEstimateA && !rewardEstimateB) {
        return -1;
      }
      if (rewardPerThousandB < rewardPerThousandA) {
        return -1;
      }
      if (rewardPerThousandB > rewardPerThousandA) {
        return 1;
      }
      return 0;

    case "totalVotes":
      if (!a.gauge.weight || !b.gauge.weight) {
        return 0;
      }
      if (BigNumber(b.gauge.weight).lt(a.gauge.weight)) {
        return -1;
      }
      if (BigNumber(b.gauge.weight).gt(a.gauge.weight)) {
        return 1;
      }
      return 0;

    case "totalBribesUSD":
    case "apy":
      if (BigNumber(b.gauge.median_tbv).lt(a.gauge.median_tbv)) {
        return -1;
      }
      if (BigNumber(b.gauge.median_tbv).gt(a.gauge.median_tbv)) {
        return 1;
      }
      return 0;

    case "myVotes":
    case "mvp":
      const sliderValue1 = defaultVotes?.find((el) => el.address === a?.address)
        ?.value;
      const sliderValue2 = defaultVotes?.find((el) => el.address === b?.address)
        ?.value;
      if (
        sliderValue1 !== undefined &&
        sliderValue2 !== undefined &&
        sliderValue2 < sliderValue1
      ) {
        return -1;
      }
      if (
        sliderValue1 !== undefined &&
        sliderValue2 !== undefined &&
        sliderValue2 > sliderValue1
      ) {
        return 1;
      }
      return 0;

    default:
      return 0;
  }
}

function getComparator(
  order: "asc" | "desc",
  orderBy: OrderBy,
  defaultVotes?: Array<Pick<Vote, "address"> & { value: number }>,
  token?: VestNFT
) {
  return order === "desc"
    ? (a: Gauge, b: Gauge) =>
        descendingComparator(a, b, orderBy, defaultVotes, token)
    : (a: Gauge, b: Gauge) =>
        -descendingComparator(a, b, orderBy, defaultVotes, token);
}

function stableSort(
  array: Gauge[],
  comparator: (_a: Gauge, _b: Gauge) => number
) {
  const stabilizedThis = array.map((el, index) => [el, index] as const);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}
