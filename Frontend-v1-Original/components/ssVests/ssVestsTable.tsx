import React, { useState } from "react";
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
  Alert,
  Menu,
  MenuItem,
  Skeleton,
} from "@mui/material";
import { useRouter } from "next/router";
import {
  EnhancedEncryptionOutlined,
  Check,
  Close,
  KeyboardArrowDown,
  KeyboardArrowUp,
  RestartAlt,
  Merge,
  TrendingUp,
} from "@mui/icons-material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import BigNumber from "bignumber.js";
import Link from "next/link";

import { formatCurrency } from "../../utils/utils";
import { GovToken, VestNFT, VeToken } from "../../stores/types/types";
import { useResetVest } from "../ssVest/lib/mutations";

dayjs.extend(relativeTime);

dayjs.extend(relativeTime);

const headCells = [
  { id: "NFT", numeric: false, disablePadding: false, label: "NFT" },
  {
    id: "Voted",
    numeric: false,
    disablePadding: false,
    label: "Voted This Epoch",
  },
  {
    id: "Reset",
    numeric: false,
    disablePadding: false,
    label: "Reset",
  },
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
    id: "Influence",
    numeric: true,
    disablePadding: false,
    label: "Voting Power",
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
  onRequestSort: (
    _event: React.MouseEvent<unknown>,
    _property: OrderBy
  ) => void;
}) {
  const createSortHandler =
    (property: OrderBy) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
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
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              <Typography variant="h5" className="text-xs font-extralight">
                {headCell.label}
              </Typography>
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

const EnhancedTableToolbar = () => {
  const router = useRouter();

  const onCreate = () => {
    router.push("/vest/create");
  };

  return (
    <Toolbar className="my-6 mx-0 p-0">
      <Grid container spacing={1}>
        <Grid lg="auto" md={12} sm={12} xs={12} item>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<EnhancedEncryptionOutlined />}
            size="large"
            className="w-full bg-primaryBg font-bold text-cantoGreen hover:bg-[rgb(19,44,60)]"
            onClick={onCreate}
          >
            <Typography className="text-base font-bold">Create Lock</Typography>
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
  vestNFTs: VestNFT[] | undefined;
  govToken: GovToken | undefined;
  veToken: VeToken | undefined;
}) {
  const router = useRouter();
  const { mutate: resetNft } = useResetVest();
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

  const onView = (nft: VestNFT) => {
    router.push(`/vest/${nft.id}`);
  };

  const onReset = (nft: {
    lockAmount: string;
    lockValue: string;
    lockEnds: string;
    id: string;
  }) => {
    resetNft(nft.id);
  };

  // const emptyRows =
  //   rowsPerPage - Math.min(rowsPerPage, vestNFTs.length - page * rowsPerPage);

  if (!vestNFTs) {
    return (
      <div className="w-full">
        <Skeleton
          variant="rectangular"
          width={"100%"}
          height={40}
          className="mb-3 mt-6"
        />
        <Skeleton
          variant="rectangular"
          width={"100%"}
          height={40}
          className="my-3"
        />
        <Skeleton
          variant="rectangular"
          width={"100%"}
          height={40}
          className="my-3"
        />
        <Skeleton
          variant="rectangular"
          width={"100%"}
          height={40}
          className="my-3"
        />
        <Skeleton
          variant="rectangular"
          width={"100%"}
          height={40}
          className="my-3"
        />
        <Skeleton
          variant="rectangular"
          width={"100%"}
          height={40}
          className="my-3"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <EnhancedTableToolbar />
      <Paper
        elevation={0}
        className="flex w-full flex-col items-end border border-[rgba(104,108,122,0.25)]"
      >
        <Alert
          severity="info"
          className="w-full rounded-br-none rounded-bl-none"
        >
          A reset NFT can still be used to vote, but the opposite is not true.
          NFTs that have been used to vote in the past must be reset before they
          can be merged.
        </Alert>
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
                  return (
                    <MyTableRow
                      key={row.id}
                      row={row}
                      index={index}
                      govToken={govToken}
                      veToken={veToken}
                      onReset={onReset}
                      onView={onView}
                    />
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

function MyTableRow(props: {
  row: VestNFT;
  index: number;
  govToken: GovToken | undefined;
  veToken: VeToken | undefined;
  onReset: any;
  onView: any;
}) {
  const { row, index, govToken, veToken, onReset, onView } = props;
  const influence =
    row.influence * 100 > 0.001
      ? `${(row.influence * 100).toFixed(3)}%`
      : "<0.001%";
  const labelId = `enhanced-table-checkbox-${index}`;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <TableRow key={labelId} className="hover:bg-[rgba(104,108,122,0.05)]">
      <TableCell>
        <div className="flex items-center">
          <div className="relative flex h-9 w-[70px]">
            <img
              className="absolute left-0 top-0 rounded-[30px]"
              src={govToken?.logoURI || undefined}
              width="35"
              height="35"
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null;
                (e.target as HTMLImageElement).src = "/tokens/unknown-logo.png";
              }}
            />
          </div>
          <div>
            <Typography variant="h2" className="text-xs font-extralight">
              {row.id}
            </Typography>
            <Typography
              variant="h5"
              className="text-xs font-extralight"
              color="textSecondary"
            >
              NFT ID
            </Typography>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Typography variant="h2" className="text-xs font-extralight">
          {row.votedInCurrentEpoch ? (
            <Check className="fill-green-500" />
          ) : (
            <Close className="fill-red-500" />
          )}
        </Typography>
        {row.votedInCurrentEpoch ? (
          <Typography
            variant="h5"
            className="text-xs font-extralight"
            color="textSecondary"
          >
            Voted on: {new Date(Number(row.lastVoted) * 1000).toLocaleString()}
          </Typography>
        ) : null}
        {/* show last voted so users can tell to reset or not */}
        {!row.votedInCurrentEpoch && Number(row.lastVoted) !== 0 ? (
          <Typography
            variant="h5"
            className="text-xs font-extralight"
            color="textSecondary"
          >
            Last Voted:{" "}
            {new Date(Number(row.lastVoted) * 1000).toLocaleString()}
          </Typography>
        ) : null}
      </TableCell>
      <TableCell>
        <Typography variant="h2" className="text-xs font-extralight">
          {row.reset ? (
            <Check className="fill-green-500" />
          ) : (
            <Close className="fill-red-500" />
          )}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="h2" className="text-xs font-extralight">
          {formatCurrency(row.lockAmount)}
        </Typography>
        <Typography
          variant="h5"
          className="text-xs font-extralight"
          color="textSecondary"
        >
          {govToken?.symbol}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="h2" className="text-xs font-extralight">
          {formatCurrency(row.lockValue)}
        </Typography>
        <Typography
          variant="h5"
          className="text-xs font-extralight"
          color="textSecondary"
        >
          {veToken?.symbol}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="h2" className="text-xs font-extralight">
          {dayjs.unix(+row.lockEnds).format("YYYY-MM-DD")}
        </Typography>
        <Typography
          variant="h5"
          className="text-xs font-extralight"
          color="textSecondary"
        >
          Expires {dayjs.unix(+row.lockEnds).fromNow()}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Tooltip title={`${(row.influence * 100).toFixed(7)}%`}>
          <Typography variant="h2" className="text-xs font-extralight">
            {influence}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell
        align="right"
        className="flex flex-col space-y-2 lg:flex-row lg:justify-end lg:space-y-0 lg:space-x-2"
      >
        <Button
          variant="outlined"
          color="primary"
          endIcon={open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          onClick={handleClick}
        >
          Menu
        </Button>
        <Menu
          sx={{
            "& .MuiPaper-root": {
              minWidth: "150px",
            },
          }}
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          elevation={0}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem
            disableRipple
            disabled={row.votedInCurrentEpoch}
            onClick={() => {
              handleClose();
              onReset(row);
            }}
          >
            <RestartAlt className="mr-2" /> <span>Reset</span>
          </MenuItem>
          {/*
          disabled when:
      1. voted in current epoch
      2. actioned in past epoch, and voted is true, i.e., not reset yet
       */}
          <MenuItem
            disableRipple
            disabled={row.votedInCurrentEpoch || row.reset === false}
          >
            <Link href={`/vest/${row.id}/merge`} className="flex items-center">
              <Merge className="mr-2" /> <span>Merge</span>
            </Link>
          </MenuItem>
          <MenuItem disableRipple onClick={() => onView(row)}>
            <TrendingUp className="mr-2" /> Manage
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
}

function descendingComparator(a: VestNFT, b: VestNFT, orderBy: OrderBy) {
  if (!a || !b) {
    return 0;
  }

  switch (orderBy) {
    case "NFT":
      return BigNumber(b.id).minus(a.id).toNumber();
    case "Voted":
      if (b.votedInCurrentEpoch && !a.votedInCurrentEpoch) {
        return -1;
      }
      if (!b.votedInCurrentEpoch && a.votedInCurrentEpoch) {
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
  comparator: (_a: VestNFT, _b: VestNFT) => number
) {
  const stabilizedThis = array.map((el, index) => [el, index] as const);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}
