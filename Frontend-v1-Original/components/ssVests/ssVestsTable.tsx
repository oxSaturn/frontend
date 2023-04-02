import React, { useState } from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@mui/styles";
import Skeleton from "@mui/lab/Skeleton";
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
  Toolbar,
  Grid,
  Tooltip,
} from "@mui/material";
import { useRouter } from "next/router";
import { EnhancedEncryptionOutlined, Check, Close } from "@mui/icons-material";
import moment from "moment";

import stores from "../../stores";
import { formatCurrency } from "../../utils/utils";
import { ACTIONS } from "../../stores/constants/constants";
import { GovToken, VestNFT, VeToken } from "../../stores/types/types";
import BigNumber from "bignumber.js";

const headCells = [
  { id: "NFT", numeric: false, disablePadding: false, label: "NFT" },
  { id: "Voted", numeric: false, disablePadding: false, label: "Voted" },
  {
    id: "Locked Amount",
    numeric: true,
    disablePadding: false,
    label: "Vest Amount",
  },
  {
    id: "Lock Value",
    numeric: true,
    disablePadding: false,
    label: "Vest Value",
  },
  {
    id: "Lock Expires",
    numeric: true,
    disablePadding: false,
    label: "Vest Expires",
  },
  {
    id: "",
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
    // @ts-expect-error material ui theme is not typed by default
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
  icon: {
    marginRight: "12px",
  },
  textSpaced: {
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
  img1Logo: {
    position: "absolute",
    left: "0px",
    top: "0px",
    borderRadius: "30px",
  },
  img2Logo: {
    position: "absolute",
    left: "20px",
    zIndex: "1",
    top: "0px",
  },
  overrideTableHead: {
    borderBottom: "1px solid rgba(104,108,122,0.2) !important",
  },
  doubleImages: {
    display: "flex",
    position: "relative",
    width: "70px",
    height: "35px",
  },
  buttonOverride: {
    color: "rgb(6, 211, 215)",
    background: "#272826",
    fontWeight: "700",
    width: "100%",
    "&:hover": {
      background: "rgb(19, 44, 60)",
    },
  },
  toolbar: {
    margin: "24px 0px",
    padding: "0px",
  },
  tableContainer: {
    border: "1px solid rgba(104, 108, 122, 0.25)",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  actionButtonText: {
    fontSize: "15px",
    fontWeight: "700",
  },
}));

const EnhancedTableToolbar = () => {
  const classes = useStyles();
  const router = useRouter();

  const onCreate = () => {
    router.push("/vest/create");
  };

  return (
    <Toolbar className={classes.toolbar}>
      <Grid container spacing={1}>
        <Grid lg="auto" md={12} sm={12} xs={12} item>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<EnhancedEncryptionOutlined />}
            size="large"
            className={classes.buttonOverride}
            onClick={onCreate}
          >
            <Typography className={classes.actionButtonText}>
              Create Lock
            </Typography>
          </Button>
        </Grid>
        <Grid item lg={true} md={true} sm={false} xs={false}></Grid>
      </Grid>
    </Toolbar>
  );
};

export default function EnhancedTable({
  vestNFTs,
  govToken,
  veToken,
}: {
  vestNFTs: VestNFT[];
  govToken: GovToken | null;
  veToken: VeToken | null;
}) {
  const classes = useStyles();
  const router = useRouter();

  const [order, setOrder] = React.useState<"asc" | "desc">("desc");
  const [orderBy, setOrderBy] = React.useState<OrderBy>("Lock Value");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (
    event: React.MouseEvent<unknown, MouseEvent>,
    property: OrderBy
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  if (!vestNFTs) {
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

  const onView = (nft: VestNFT) => {
    router.push(`/vest/${nft.id}`);
  };

  const onReset = (nft: {
    lockAmount: string;
    lockValue: string;
    lockEnds: string;
    id: string;
  }) => {
    stores.dispatcher.dispatch({
      type: ACTIONS.RESET_VEST,
      content: { tokenID: nft.id },
    });
  };

  const emptyRows =
    rowsPerPage - Math.min(rowsPerPage, vestNFTs.length - page * rowsPerPage);

  return (
    <div className={classes.root}>
      <EnhancedTableToolbar />
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
              {stableSort(vestNFTs, getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  if (!row) {
                    return null;
                  }
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow key={labelId} className={classes.assetTableRow}>
                      <TableCell className={classes.cell}>
                        <div className={classes.inline}>
                          <div className={classes.doubleImages}>
                            <img
                              className={classes.img1Logo}
                              src={govToken?.logoURI || undefined}
                              width="35"
                              height="35"
                              alt=""
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src =
                                  "/tokens/unknown-logo.png";
                              }}
                            />
                          </div>
                          <div>
                            <Typography
                              variant="h2"
                              className={classes.textSpaced}
                            >
                              {row.id}
                            </Typography>
                            <Typography
                              variant="h5"
                              className={classes.textSpaced}
                              color="textSecondary"
                            >
                              NFT ID
                            </Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={classes.cell}>
                        <Typography variant="h2" className={classes.textSpaced}>
                          {!!row.voted ? <Check /> : <Close />}
                        </Typography>
                      </TableCell>
                      <TableCell className={classes.cell} align="right">
                        <Typography variant="h2" className={classes.textSpaced}>
                          {formatCurrency(row.lockAmount)}
                        </Typography>
                        <Typography
                          variant="h5"
                          className={classes.textSpaced}
                          color="textSecondary"
                        >
                          {govToken?.symbol}
                        </Typography>
                      </TableCell>
                      <TableCell className={classes.cell} align="right">
                        <Typography variant="h2" className={classes.textSpaced}>
                          {formatCurrency(row.lockValue)}
                        </Typography>
                        <Typography
                          variant="h5"
                          className={classes.textSpaced}
                          color="textSecondary"
                        >
                          {veToken?.symbol}
                        </Typography>
                      </TableCell>
                      <TableCell className={classes.cell} align="right">
                        <Typography variant="h2" className={classes.textSpaced}>
                          {moment.unix(+row.lockEnds).format("YYYY-MM-DD")}
                        </Typography>
                        <Typography
                          variant="h5"
                          className={classes.textSpaced}
                          color="textSecondary"
                        >
                          Expires {moment.unix(+row.lockEnds).fromNow()}
                        </Typography>
                      </TableCell>
                      <TableCell className={classes.cell} align="right">
                        <Tooltip
                          title={
                            <div>
                              Only reset it if you want to do NFT merge.
                              <br />
                              Reset disables voting until next epoch.
                            </div>
                          }
                          placement="right"
                          enterTouchDelay={500}
                        >
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => {
                              onReset(row);
                            }}
                            className="mr-2"
                          >
                            Reset
                          </Button>
                        </Tooltip>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => {
                            onView(row);
                          }}
                        >
                          Manage
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
          count={vestNFTs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </div>
  );
}

function descendingComparator(a: VestNFT, b: VestNFT, orderBy: OrderBy) {
  if (!a || !b) {
    return 0;
  }

  switch (orderBy) {
    case "NFT":
      return 0;
    case "Voted":
      if (b.voted && !a.voted) {
        return -1;
      }
      if (!b.voted && a.voted) {
        return 1;
      }
      return 0;
    case "Lock Expires":
      return BigNumber(b.lockEnds).minus(a.lockEnds).toNumber();
    case "Locked Amount":
      return BigNumber(b.lockAmount).minus(a.lockAmount).toNumber();
    case "Lock Value":
      return BigNumber(b.lockValue).minus(a.lockValue).toNumber();
  }

  return 0;
}

function getComparator(order: "asc" | "desc", orderBy: OrderBy) {
  return order === "desc"
    ? (a: VestNFT, b: VestNFT) => descendingComparator(a, b, orderBy)
    : (a: VestNFT, b: VestNFT) => -descendingComparator(a, b, orderBy);
}

function stableSort(
  array: VestNFT[],
  comparator: (a: VestNFT, b: VestNFT) => number
) {
  const stabilizedThis = array.map((el, index) => [el, index] as const);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}
