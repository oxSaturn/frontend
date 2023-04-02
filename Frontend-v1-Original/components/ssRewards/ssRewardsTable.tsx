import React, { useState } from "react";
import PropTypes from "prop-types";

import {
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Typography,
  Skeleton,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import BigNumber from "bignumber.js";

import stores from "../../stores";
import { ACTIONS } from "../../stores/constants/constants";
import { formatCurrency } from "../../utils/utils";
import { Gauge, VeDistReward, isGaugeReward } from "../../stores/types/types";

const headCells = [
  { id: "reward", numeric: false, disablePadding: false, label: "Pool" },
  {
    id: "balance",
    numeric: true,
    disablePadding: false,
    label: "Your Position",
  },
  {
    id: "earned",
    numeric: true,
    disablePadding: false,
    label: "You Earned",
  },
  {
    id: "bruh",
    numeric: true,
    disablePadding: false,
    label: "Actions",
  },
] as const;

type OrderBy = (typeof headCells)[number]["id"];

function EnhancedTableHead({
  order,
  orderBy,
  onRequestSort,
}: {
  order: "asc" | "desc";
  orderBy: OrderBy;
  onRequestSort: (event: React.MouseEvent<unknown>, property: OrderBy) => void;
}) {
  const classes = useStyles();
  const createSortHandler =
    (property: OrderBy) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            className={classes.overrideTableHead}
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={"normal"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              <Typography variant="h5" className={classes.headerText}>
                {headCell.label}
              </Typography>
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
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

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
  },
  assetTableRow: {
    "&:hover": {
      background: "rgba(104,108,122,0.05)",
    },
  },
  paper: {
    width: "100%",
    // @ts-expect-error we dont have type for default theme
    marginBottom: theme.spacing(2),
  },
  visuallyHidden: {
    border: 0,
    clip: "rect(0 0 0 0)",
    height: 1,
    margin: -1,
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    top: 20,
    width: 1,
  },
  inline: {
    display: "flex",
    alignItems: "center",
  },
  inlineEnd: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  icon: {
    marginRight: "12px",
  },
  textSpaced: {
    lineHeight: "1.5",
    fontWeight: "200",
    fontSize: "12px",
  },
  textSpacedPadded: {
    paddingLeft: "10px",
    lineHeight: "1.5",
    fontWeight: "200",
    fontSize: "12px",
  },
  headerText: {
    fontWeight: "200",
    fontSize: "12px",
  },
  cell: {},
  cellSuccess: {
    color: "#4eaf0a",
  },
  cellAddress: {
    cursor: "pointer",
  },
  aligntRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  skelly: {
    marginBottom: "12px",
    marginTop: "12px",
  },
  skelly1: {
    marginBottom: "12px",
    marginTop: "24px",
  },
  skelly2: {
    margin: "12px 6px",
  },
  tableBottomSkelly: {
    display: "flex",
    justifyContent: "flex-end",
  },
  assetInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    padding: "24px",
    width: "100%",
    flexWrap: "wrap",
    borderBottom: "1px solid rgba(104, 108, 122, 0.25)",
    background:
      "radial-gradient(circle, rgba(63,94,251,0.7) 0%, rgba(47,128,237,0.7) 48%) rgba(63,94,251,0.7) 100%",
  },
  assetInfoError: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    padding: "24px",
    width: "100%",
    flexWrap: "wrap",
    borderBottom: "1px rgba(104, 108, 122, 0.25)",
    background: "#dc3545",
  },
  infoField: {
    flex: 1,
  },
  flexy: {
    padding: "6px 0px",
  },
  overrideCell: {
    padding: "0px",
  },
  hoverRow: {
    cursor: "pointer",
  },
  statusLiquid: {
    color: "#dc3545",
  },
  statusWarning: {
    color: "#FF9029",
  },
  statusSafe: {
    color: "green",
  },
  imgLogo: {
    border: "3px solid rgb(25, 33, 56)",
    borderRadius: "30px",
  },
  img1Logo: {
    position: "absolute",
    left: "0px",
    top: "0px",
    border: "3px solid rgb(25, 33, 56)",
    borderRadius: "30px",
  },
  img2Logo: {
    position: "absolute",
    left: "23px",
    zIndex: "1",
    top: "0px",
    border: "3px solid rgb(25, 33, 56)",
    borderRadius: "30px",
  },
  overrideTableHead: {
    borderBottom: "1px solid rgba(126,153,176,0.15) !important",
  },
  doubleImages: {
    display: "flex",
    position: "relative",
    width: "70px",
    height: "35px",
  },
  searchContainer: {
    flex: 1,
    minWidth: "300px",
    marginRight: "30px",
  },
  buttonOverride: {
    color: "rgb(6, 211, 215)",
    background: "#272826",
    fontWeight: "700",
    "&:hover": {
      background: "rgb(19, 44, 60)",
    },
  },
  toolbar: {
    margin: "24px 0px",
    padding: "0px",
  },
  tableContainer: {
    border: "1px solid rgba(126,153,176,0.2)",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  filterButton: {
    background: "#272826",
    border: "1px solid rgba(126,153,176,0.3)",
    color: "#06D3D7",
    marginRight: "30px",
  },
  actionButtonText: {
    fontSize: "15px",
    fontWeight: "700",
  },
  filterContainer: {
    background: "#212b48",
    minWidth: "300px",
    marginTop: "15px",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 10px 20px 0 rgba(0,0,0,0.2)",
    border: "1px solid rgba(126,153,176,0.2)",
  },
  alignContentRight: {
    textAlign: "right",
  },
  labelColumn: {
    display: "flex",
    alignItems: "center",
  },
  filterLabel: {
    fontSize: "14px",
  },
  filterListTitle: {
    marginBottom: "10px",
    paddingBottom: "20px",
    borderBottom: "1px solid rgba(126,153,176,0.2)",
  },
  infoIcon: {
    color: "#06D3D7",
    fontSize: "16px",
    marginLeft: "10px",
  },
  symbol: {
    minWidth: "40px",
  },
}));

export default function EnhancedTable({
  rewards,
  tokenID,
}: {
  rewards: (Gauge | VeDistReward)[];
  tokenID: string;
}) {
  const classes = useStyles();

  const [order, setOrder] = React.useState<"asc" | "desc">("desc");
  const [orderBy, setOrderBy] = React.useState<OrderBy>("balance");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

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

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: OrderBy
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  if (!rewards) {
    return (
      <div className={classes.root}>
        <Skeleton
          variant="rectangular"
          width={"100%"}
          height={40}
          className={classes.skelly1}
        />
        <Skeleton
          variant="rectangular"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
        <Skeleton
          variant="rectangular"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
        <Skeleton
          variant="rectangular"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
        <Skeleton
          variant="rectangular"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
        <Skeleton
          variant="rectangular"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
      </div>
    );
  }

  const onClaim = (reward: Gauge | VeDistReward) => {
    if (reward.rewardType === "Bribe") {
      stores.dispatcher.dispatch({
        type: ACTIONS.CLAIM_BRIBE,
        content: { pair: reward, tokenID },
      });
    } else if (reward.rewardType === "Reward") {
      stores.dispatcher.dispatch({
        type: ACTIONS.CLAIM_REWARD,
        content: { pair: reward, tokenID },
      });
    } else if (reward.rewardType === "Distribution") {
      stores.dispatcher.dispatch({
        type: ACTIONS.CLAIM_VE_DIST,
        content: { tokenID },
      });
    }
  };

  const emptyRows =
    rowsPerPage - Math.min(rowsPerPage, rewards.length - page * rowsPerPage);

  return (
    <div className={classes.root}>
      <Paper elevation={0} className={classes.tableContainer}>
        <TableContainer>
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
              {stableSort(rewards, getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  if (!row) {
                    return null;
                  }

                  return (
                    <TableRow
                      key={"ssRewardsTable" + index}
                      className={classes.assetTableRow}
                    >
                      <TableCell className={classes.cell}>
                        {isGaugeReward(row) &&
                          ["Bribe", "Reward"].includes(
                            row.rewardType ?? ""
                          ) && (
                            <div className={classes.inline}>
                              <div className={classes.doubleImages}>
                                <img
                                  className={classes.img1Logo}
                                  src={
                                    row && row.token0 && row.token0.logoURI
                                      ? row.token0.logoURI
                                      : ``
                                  }
                                  width="37"
                                  height="37"
                                  alt=""
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).onerror =
                                      null;
                                    (e.target as HTMLImageElement).src =
                                      "/tokens/unknown-logo.png";
                                  }}
                                />
                                <img
                                  className={classes.img2Logo}
                                  src={
                                    row && row.token1 && row.token1.logoURI
                                      ? row.token1.logoURI
                                      : ``
                                  }
                                  width="37"
                                  height="37"
                                  alt=""
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).onerror =
                                      null;
                                    (e.target as HTMLImageElement).src =
                                      "/tokens/unknown-logo.png";
                                  }}
                                />
                              </div>
                              <div>
                                <Typography
                                  variant="h2"
                                  noWrap
                                  className={classes.textSpaced}
                                >
                                  {row?.symbol}
                                </Typography>
                                <Typography
                                  variant="h5"
                                  className={classes.textSpaced}
                                  color="textSecondary"
                                >
                                  {row?.rewardType}
                                </Typography>
                              </div>
                            </div>
                          )}
                        {!isGaugeReward(row) &&
                          ["Distribution"].includes(row.rewardType ?? "") && (
                            <div className={classes.inline}>
                              <div className={classes.doubleImages}>
                                <img
                                  className={classes.img1Logo}
                                  src={
                                    row &&
                                    row.lockToken &&
                                    row.lockToken.logoURI
                                      ? row.lockToken.logoURI
                                      : ``
                                  }
                                  width="37"
                                  height="37"
                                  alt=""
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).onerror =
                                      null;
                                    (e.target as HTMLImageElement).src =
                                      "/tokens/unknown-logo.png";
                                  }}
                                />
                              </div>
                              <div>
                                <Typography
                                  variant="h2"
                                  noWrap
                                  className={classes.textSpaced}
                                >
                                  {row?.lockToken?.symbol}
                                </Typography>
                                <Typography
                                  variant="h5"
                                  className={classes.textSpaced}
                                  color="textSecondary"
                                >
                                  {row?.rewardType}
                                </Typography>
                              </div>
                            </div>
                          )}
                      </TableCell>
                      <TableCell className={classes.cell} align="right">
                        <div>
                          {row &&
                            row.rewardType === "Bribe" &&
                            row.gauge &&
                            row.gauge.balance &&
                            row.gauge.totalSupply && (
                              <>
                                <div className={classes.inlineEnd}>
                                  <Typography
                                    variant="h2"
                                    className={classes.textSpaced}
                                  >
                                    {formatCurrency(
                                      BigNumber(row.gauge.balance)
                                        .div(row.gauge.totalSupply)
                                        .times(row.gauge.reserve0 ?? 0)
                                    )}
                                  </Typography>
                                  <Typography
                                    variant="h5"
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    color="textSecondary"
                                  >
                                    {row.token0.symbol}
                                  </Typography>
                                </div>
                                <div className={classes.inlineEnd}>
                                  <Typography
                                    variant="h5"
                                    className={classes.textSpaced}
                                  >
                                    {formatCurrency(
                                      BigNumber(row.gauge.balance)
                                        .div(row.gauge.totalSupply)
                                        .times(row.gauge.reserve1 ?? 0)
                                    )}
                                  </Typography>
                                  <Typography
                                    variant="h5"
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    color="textSecondary"
                                  >
                                    {row.token1.symbol}
                                  </Typography>
                                </div>
                              </>
                            )}
                          {row &&
                            row.rewardType === "Reward" &&
                            row.gauge &&
                            row.gauge.balance &&
                            row.gauge.totalSupply && (
                              <>
                                <div className={classes.inlineEnd}>
                                  <Typography
                                    variant="h2"
                                    className={classes.textSpaced}
                                  >
                                    {formatCurrency(
                                      BigNumber(row.gauge.balance)
                                        .div(row.gauge.totalSupply)
                                        .times(row.gauge.reserve0 ?? 0)
                                    )}
                                  </Typography>
                                  <Typography
                                    variant="h5"
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    color="textSecondary"
                                  >
                                    {row.token0.symbol}
                                  </Typography>
                                </div>
                                <div className={classes.inlineEnd}>
                                  <Typography
                                    variant="h5"
                                    className={classes.textSpaced}
                                  >
                                    {formatCurrency(
                                      BigNumber(row.gauge.balance)
                                        .div(row.gauge.totalSupply)
                                        .times(row.gauge.reserve1 ?? 0)
                                    )}
                                  </Typography>
                                  <Typography
                                    variant="h5"
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    color="textSecondary"
                                  >
                                    {row.token1.symbol}
                                  </Typography>
                                </div>
                              </>
                            )}
                          {row &&
                            !isGaugeReward(row) &&
                            row.rewardType === "Distribution" && (
                              <>
                                <div className={classes.inlineEnd}>
                                  <Typography
                                    variant="h5"
                                    className={classes.textSpaced}
                                  >
                                    {formatCurrency(row.token?.lockValue)}
                                  </Typography>
                                  <Typography
                                    variant="h5"
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    color="textSecondary"
                                  >
                                    {row.lockToken.symbol}
                                  </Typography>
                                </div>
                              </>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className={classes.cell} align="right">
                        <div>
                          {row &&
                            row.rewardType === "Bribe" &&
                            row.gauge &&
                            row.gauge.bribesEarned &&
                            row.gauge.bribesEarned.map((bribe) => {
                              return (
                                <div className={classes.inlineEnd}>
                                  <img
                                    className={classes.imgLogo}
                                    src={
                                      bribe &&
                                      bribe.token &&
                                      bribe.token.logoURI
                                        ? bribe.token.logoURI
                                        : ``
                                    }
                                    width="24"
                                    height="24"
                                    alt=""
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).onerror =
                                        null;
                                      (e.target as HTMLImageElement).src =
                                        "/tokens/unknown-logo.png";
                                    }}
                                  />
                                  <Typography
                                    variant="h2"
                                    className={classes.textSpacedPadded}
                                  >
                                    {formatCurrency(bribe.earned)}
                                  </Typography>
                                  <Typography
                                    variant="h5"
                                    className={classes.textSpacedPadded}
                                    color="textSecondary"
                                  >
                                    {bribe.token?.symbol}
                                  </Typography>
                                </div>
                              );
                            })}
                          {row && row.rewardType === "Reward" && (
                            <>
                              <div className={classes.inlineEnd}>
                                <Typography
                                  variant="h2"
                                  className={classes.textSpaced}
                                >
                                  {formatCurrency(row.gauge.rewardsEarned)}
                                </Typography>
                                <Typography
                                  variant="h5"
                                  className={`${classes.textSpaced} ${classes.symbol}`}
                                  color="textSecondary"
                                >
                                  FLOW
                                </Typography>
                              </div>
                            </>
                          )}
                          {row &&
                            !isGaugeReward(row) &&
                            row.rewardType === "Distribution" && (
                              <>
                                <div className={classes.inlineEnd}>
                                  <Typography
                                    variant="h5"
                                    className={classes.textSpaced}
                                  >
                                    {formatCurrency(row.earned)}
                                  </Typography>
                                  <Typography
                                    variant="h5"
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    color="textSecondary"
                                  >
                                    {row?.lockToken?.symbol}
                                  </Typography>
                                </div>
                              </>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className={classes.cell} align="right">
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => {
                            onClaim(row);
                          }}
                        >
                          Claim
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rewards.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </div>
  );
}

function descendingComparator(
  a: Gauge | VeDistReward,
  b: Gauge | VeDistReward,
  orderBy: OrderBy
) {
  if (!a || !b) {
    return 0;
  }

  let aAmount = 0;
  let bAmount = 0;

  switch (orderBy) {
    case "reward":
      if (a.rewardType && b.rewardType) {
        if (b.rewardType < a.rewardType) {
          return -1;
        }
        if (b.rewardType > a.rewardType) {
          return 1;
        }
      }
      if (isGaugeReward(a) && isGaugeReward(b)) {
        if (b.symbol < a.symbol) {
          return -1;
        }
        if (b.symbol > a.symbol) {
          return 1;
        }
      }
      return 0;

    case "balance":
      if (isGaugeReward(a) && a.rewardType === "Bribe" && a.gauge.balance) {
        aAmount = +a.gauge.balance;
      } else if (isGaugeReward(a) && a.balance) {
        aAmount = +a.balance;
      }

      if (isGaugeReward(b) && b.rewardType === "Bribe" && b.gauge.balance) {
        bAmount = +b.gauge.balance;
      } else if (isGaugeReward(b) && b.balance) {
        bAmount = +b.balance;
      }

      if (BigNumber(bAmount).lt(aAmount)) {
        return -1;
      }
      if (BigNumber(bAmount).gt(aAmount)) {
        return 1;
      }
      return 0;

    case "earned":
      if (a.rewardType === "Bribe") {
        aAmount = a.gauge?.bribes.length;
      } else {
        aAmount = 2;
      }

      if (b.rewardType === "Bribe") {
        bAmount = b.gauge?.bribes.length;
      } else {
        bAmount = 2;
      }

      if (BigNumber(bAmount).lt(aAmount)) {
        return -1;
      }
      if (BigNumber(bAmount).gt(aAmount)) {
        return 1;
      }
      return 0;

    default:
      return 0;
  }
}

function getComparator(order: "asc" | "desc", orderBy: OrderBy) {
  return order === "desc"
    ? (a: Gauge | VeDistReward, b: Gauge | VeDistReward) =>
        descendingComparator(a, b, orderBy)
    : (a: Gauge | VeDistReward, b: Gauge | VeDistReward) =>
        -descendingComparator(a, b, orderBy);
}

function stableSort(
  array: (Gauge | VeDistReward)[],
  comparator: (a: Gauge | VeDistReward, b: Gauge | VeDistReward) => number
) {
  const stabilizedThis = array.map((el, index) => [el, index] as const);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}
