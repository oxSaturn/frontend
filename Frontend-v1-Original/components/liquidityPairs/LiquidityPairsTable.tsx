import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Skeleton,
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
  Tooltip,
  Toolbar,
  IconButton,
  TextField,
  InputAdornment,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
} from "@mui/material";
import { useRouter } from "next/router";
import BigNumber from "bignumber.js";
import {
  Search,
  AddCircleOutline,
  WarningOutlined,
  KeyboardArrowUp,
  KeyboardArrowDown,
  OpenInNewOutlined,
  LocalFireDepartmentOutlined,
} from "@mui/icons-material";

import { formatCurrency } from "../../utils/utils";
import { Pair, hasGauge, isBaseAsset } from "../../stores/types/types";
import tokens from "../../tokens.json";

const headCells = [
  { id: "expand", numeric: false, disablePadding: true, label: "" },
  { id: "pair", numeric: false, disablePadding: false, label: "Pair" },
  {
    id: "balance",
    numeric: true,
    disablePadding: false,
    label: "Wallet",
  },
  {
    id: "poolBalance",
    numeric: true,
    disablePadding: false,
    label: "My Pool Amount",
  },
  {
    id: "stakedBalance",
    numeric: true,
    disablePadding: false,
    label: "My Staked Amount",
  },
  {
    id: "poolAmount",
    numeric: true,
    disablePadding: false,
    label: "Total Pool Amount",
  },
  {
    id: "stakedAmount",
    numeric: true,
    disablePadding: false,
    label: "Total Pool Staked",
  },
  {
    id: "tvl",
    numeric: true,
    disablePadding: false,
    label: "TVL",
  },
  {
    id: "apr",
    numeric: true,
    disablePadding: false,
    label: "APR",
  },
  {
    id: "",
    numeric: true,
    disablePadding: false,
    label: "Actions",
  },
] as const;

type OrderBy = (typeof headCells)[number]["id"];

const lzTokensLowerCase = [
  "0x28a92dde19D9989F39A49905d7C9C2FAc7799bDf",
  "0xcc1b99dDAc1a33c201a742A1851662E87BC7f22C",
  "0xf1648C50d2863f780c57849D812b4B7686031A3D",
  "0x695921034f0387eAc4e11620EE91b1b15A6A09fE",
  "0x91a40C733c97a6e1BF876EaF9ed8c08102eB491f",
].map(x => x.toLowerCase());

function EnhancedTableHead(props: {
  order: "asc" | "desc";
  orderBy: OrderBy;
  onRequestSort: (_e: React.MouseEvent<unknown>, _property: OrderBy) => void;
}) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler =
    (property: OrderBy) => (_e: React.MouseEvent<unknown>) => {
      onRequestSort(_e, property);
    };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            className={`border-b border-b-[rgba(104,108,122,0.2)] ${
              headCell.id === "tvl"
                ? "max-2xl:hidden"
                : headCell.id === "poolAmount" ||
                  headCell.id === "stakedAmount" ||
                  headCell.id === "balance" ||
                  headCell.id === "poolBalance"
                ? "max-md:hidden"
                : ""
            }`}
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

const getLocalState = () => {
  let localState = "all";

  const localToggleString = localStorage.getItem("pairsState-v1");
  if (localToggleString) {
    localState = localToggleString;
  }

  return localState;
};

const setLocalState = (state: string) => {
  localStorage.setItem("pairsState-v1", state);
};

interface PairsTableToolbarProps {
  search: string;
  setSearch: (_search: string) => void;
  filter: string;
  handleFilterChange: (_locatState: string) => void;
}

const EnhancedTableToolbar = ({
  search,
  setSearch,
  filter,
  handleFilterChange,
}: PairsTableToolbarProps) => {
  const router = useRouter();

  const onSearchChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange(event.target.value);
    setLocalState(event.target.value);
  };

  const onCreate = () => {
    router.push("/liquidity/create");
  };

  return (
    <Toolbar className="my-6 mx-0 p-0">
      <div className="flex w-full flex-col items-center justify-between gap-2 lg:flex-row lg:gap-0">
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddCircleOutline />}
          size="large"
          className="flex w-full bg-background font-bold text-primary hover:bg-[rgb(19,44,60)] lg:w-auto lg:flex-grow-[0.3]"
          onClick={onCreate}
        >
          <Typography className="text-base font-bold">Add Liquidity</Typography>
        </Button>
        <div className="w-full lg:w-auto lg:flex-grow-[0.6]">
          <TextField
            className="flex w-full flex-[1]"
            variant="outlined"
            fullWidth
            placeholder="FTM, WFTM, 0x..."
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </div>
        <ul className="flex flex-wrap gap-2 xs:flex-nowrap">
          {[
            "all",
            "layer zero",
            "boosted",
            "deposited",
            "stable",
            "volatile",
          ].map((filterOption) => (
            <li key={filterOption}>
              <input
                type="radio"
                id={filterOption}
                name="filter"
                value={filterOption}
                checked={filter === filterOption}
                onChange={onChange}
                className="peer hidden"
              />
              <label
                htmlFor={filterOption}
                className="flex min-h-[56px] min-w-[108px] cursor-pointer items-center justify-center rounded-lg border border-[rgba(255,255,255,0.23)] px-2 font-medium transition-colors hover:bg-emerald-900 peer-checked:border-emerald-900 peer-checked:bg-background peer-checked:font-semibold peer-checked:text-lime-50"
              >
                <span className="uppercase">{filterOption}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </Toolbar>
  );
};

export default function EnhancedTable({
  pairs,
}: {
  pairs: Pair[] | undefined;
}) {
  const router = useRouter();

  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("stakedBalance");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const localState = getLocalState();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(localState);

  const handleRequestSort = (
    _e: React.MouseEvent<unknown>,
    property: OrderBy
  ) => {
    if (orderBy === property) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrder("desc");
    }
    setOrderBy(property);
  };

  const onView = (pair: Pair) => {
    router.push(`/liquidity/${pair.address}`);
  };

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleFilterChange = (newStateFilter: string) => {
    setPage(0);
    setFilter(newStateFilter);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredPairs = useMemo(
    () =>
      pairs
        ?.filter((pair) => {
          if (
            pair.isAliveGauge === false &&
            pair.balance &&
            parseFloat(pair.balance) === 0 &&
            pair.gauge?.balance &&
            parseFloat(pair.gauge?.balance) === 0
          ) {
            return false;
          }
          return true;
        })
        .filter((pair) => {
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
        })
        .filter((pair) => {
          if (filter === "all") {
            return true;
          }
          if (filter === "layer zero") {
            if (
              !lzTokensLowerCase.includes(pair.token0_address.toLowerCase()) &&
              !lzTokensLowerCase.includes(pair.token1_address.toLowerCase())
            ) {
              return false;
            }
          }
          if (filter === "deposited") {
            if (
              (!pair.gauge?.balance || !BigNumber(pair.gauge?.balance).gt(0)) &&
              (!pair.balance || !BigNumber(pair.balance).gt(0))
            ) {
              return false;
            }
          }
          if (filter === "stable") {
            if (pair.stable !== true) {
              return false;
            }
          }
          if (filter === "volatile") {
            if (pair.stable !== false) {
              return false;
            }
          }
          if (filter === "boosted") {
            if (!pair.oblotr_apr) {
              return false;
            }
          }
          return true;
        }),
    [pairs, filter, search]
  );

  const sortedPairs = useMemo(
    () =>
      stableSort(filteredPairs ?? [], getComparator(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      ),
    [filteredPairs, order, orderBy, page, rowsPerPage]
  );

  const emptyRows = 5 - Math.min(5, filteredPairs?.length ?? 0 - page * 5);

  if (!pairs || pairs.length === 0 || !filteredPairs) {
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
      <EnhancedTableToolbar
        search={search}
        setSearch={setSearch}
        filter={filter}
        handleFilterChange={handleFilterChange}
      />
      <Paper
        elevation={0}
        className="flex w-full flex-col items-end border border-[rgba(126,153,176,0.2)]"
      >
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
              {sortedPairs.map((row) => {
                if (!row) {
                  return null;
                }
                return <Row key={row.address} row={row} onView={onView} />;
              })}
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
          count={filteredPairs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </div>
  );
}

function Row(props: { row: Pair; onView: (_row: Pair) => void }) {
  const { row, onView } = props;
  const [open, setOpen] = useState(false);
  const token0Info =
    tokens[row.token0.address.toLowerCase() as keyof typeof tokens];
  const token1Info =
    tokens[row.token1.address.toLowerCase() as keyof typeof tokens];
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
            <div className="relative flex h-9 w-[70px]">
              <img
                className="absolute top-0 left-0 rounded-[30px] border-[3px] border-[rgb(25,33,56)]"
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
                className="absolute top-0 left-6 z-[1] rounded-[30px] border-[3px] border-[rgb(25,33,56)]"
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
              <Typography
                variant="h2"
                className="text-xs font-extralight"
                noWrap
              >
                <a
                  href={`https://dexscreener.com/fantom/${row.address}`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="hover:underline"
                >
                  {row?.symbol}
                </a>
              </Typography>
              <Typography
                variant="h2"
                className="text-xs font-extralight"
                noWrap
                color="textSecondary"
              >
                {row?.stable ? "Stable Pool" : "Volatile Pool"}
              </Typography>
            </div>
          </div>
        </TableCell>
        <TableCell className="max-md:hidden" align="right">
          {row &&
            row.token0 &&
            "balance" in row.token0 &&
            row.token0.balance && (
              <div className="flex items-center justify-end max-md:block">
                <Typography variant="h2" className="text-xs font-extralight">
                  {formatCurrency(row.token0.balance)}
                </Typography>
                <Typography
                  variant="h5"
                  className={`min-w-[40xp] text-xs font-extralight`}
                  color="textSecondary"
                >
                  {row.token0.symbol}
                </Typography>
              </div>
            )}
          {!(
            row &&
            row.token0 &&
            "balance" in row.token0 &&
            row.token0.balance
          ) && (
            <div className="flex items-center justify-end max-md:block">
              <Skeleton
                variant="rectangular"
                width={120}
                height={16}
                style={{ marginTop: "1px", marginBottom: "1px" }}
              />
            </div>
          )}
          {row &&
            row.token1 &&
            "balance" in row.token1 &&
            row.token1.balance && (
              <div className="flex items-center justify-end max-md:block">
                <Typography variant="h2" className="text-xs font-extralight">
                  {formatCurrency(row.token1.balance)}
                </Typography>
                <Typography
                  variant="h5"
                  className={`min-w-[40xp] text-xs font-extralight`}
                  color="textSecondary"
                >
                  {row.token1.symbol}
                </Typography>
              </div>
            )}
          {!(
            row &&
            row.token1 &&
            "balance" in row.token1 &&
            row.token1.balance
          ) && (
            <div className="flex items-center justify-end max-md:block">
              <Skeleton
                variant="rectangular"
                width={120}
                height={16}
                style={{ marginTop: "1px", marginBottom: "1px" }}
              />
            </div>
          )}
        </TableCell>
        <TableCell className="max-md:hidden" align="right">
          {row && row.balance && (
            <>
              <div className="flex items-center justify-end max-md:block">
                <Typography variant="h2" className="text-xs font-extralight">
                  {formatCurrency(
                    BigNumber(row.balance)
                      .div(row.totalSupply)
                      .times(row.reserve0)
                  )}
                </Typography>
                <Typography
                  variant="h5"
                  className={`min-w-[40xp] text-xs font-extralight`}
                  color="textSecondary"
                >
                  {row.token0.symbol}
                </Typography>
              </div>
              <div className="flex items-center justify-end max-md:block">
                <Typography variant="h5" className="text-xs font-extralight">
                  {formatCurrency(
                    BigNumber(row.balance)
                      .div(row.totalSupply)
                      .times(row.reserve1)
                  )}
                </Typography>
                <Typography
                  variant="h5"
                  className={`min-w-[40xp] text-xs font-extralight`}
                  color="textSecondary"
                >
                  {row.token1.symbol}
                </Typography>
              </div>
            </>
          )}
          {!(row && row.balance) && (
            <div className="flex items-center justify-end max-md:block">
              <Skeleton
                variant="rectangular"
                width={120}
                height={16}
                style={{ marginTop: "1px", marginBottom: "1px" }}
              />
            </div>
          )}
        </TableCell>
        {row && hasGauge(row) && (
          <TableCell align="right">
            {row.gauge.reserve0 && row.gauge.reserve1 && row.gauge.balance && (
              <>
                <div className="flex items-center justify-end max-md:block">
                  <Typography variant="h2" className="text-xs font-extralight">
                    {formatCurrency(
                      BigNumber(row.gauge.balance)
                        .div(row.gauge.totalSupply)
                        .times(row.gauge.reserve0)
                    )}
                  </Typography>
                  <Typography
                    variant="h5"
                    className={`min-w-[40xp] text-xs font-extralight`}
                    color="textSecondary"
                  >
                    {row.token0.symbol}
                  </Typography>
                </div>
                <div className="flex items-center justify-end max-md:block">
                  <Typography variant="h5" className="text-xs font-extralight">
                    {formatCurrency(
                      BigNumber(row.gauge.balance)
                        .div(row.gauge.totalSupply)
                        .times(row.gauge.reserve1)
                    )}
                  </Typography>
                  <Typography
                    variant="h5"
                    className={`min-w-[40xp] text-xs font-extralight`}
                    color="textSecondary"
                  >
                    {row.token1.symbol}
                  </Typography>
                </div>
              </>
            )}
            {!(row && row.gauge && row.gauge.balance) && (
              <div className="flex items-center justify-end max-md:block">
                <Skeleton
                  variant="rectangular"
                  width={120}
                  height={16}
                  style={{
                    marginTop: "1px",
                    marginBottom: "1px",
                  }}
                />
              </div>
            )}
          </TableCell>
        )}
        {!(row && row.gauge && row.gauge.address) && (
          <TableCell align="right">
            <Typography variant="h2" className="text-xs font-extralight">
              Gauge not available
            </Typography>
          </TableCell>
        )}
        <TableCell className="max-md:hidden" align="right">
          {row && row.token0 && (
            <div className="flex items-center justify-end max-md:block">
              <Typography variant="h2" className="text-xs font-extralight">
                {formatCurrency(row.reserve0)}
              </Typography>
              <Typography
                variant="h5"
                className={`min-w-[40xp] text-xs font-extralight`}
                color="textSecondary"
              >
                {row.token0.symbol}
              </Typography>
            </div>
          )}
          {!(row && row.token0) && (
            <div className="flex items-center justify-end max-md:block">
              <Skeleton
                variant="rectangular"
                width={120}
                height={16}
                style={{ marginTop: "1px", marginBottom: "1px" }}
              />
            </div>
          )}
          {row && row.token1 && (
            <div className="flex items-center justify-end max-md:block">
              <Typography variant="h2" className="text-xs font-extralight">
                {formatCurrency(row.reserve1)}
              </Typography>
              <Typography
                variant="h5"
                className={`min-w-[40xp] text-xs font-extralight`}
                color="textSecondary"
              >
                {row.token1.symbol}
              </Typography>
            </div>
          )}
          {!(row && row.token1) && (
            <div className="flex items-center justify-end max-md:block">
              <Skeleton
                variant="rectangular"
                width={120}
                height={16}
                style={{ marginTop: "1px", marginBottom: "1px" }}
              />
            </div>
          )}
        </TableCell>
        {row && row.gauge && row.gauge.address && (
          <TableCell className="max-md:hidden" align="right">
            {row && row.gauge && row.gauge.reserve0 && row.token0 && (
              <div className="flex items-center justify-end max-md:block">
                <Typography variant="h2" className="text-xs font-extralight">
                  {formatCurrency(row.gauge.reserve0)}
                </Typography>
                <Typography
                  variant="h5"
                  className={`min-w-[40xp] text-xs font-extralight`}
                  color="textSecondary"
                >
                  {row.token0.symbol}
                </Typography>
              </div>
            )}
            {!(row && row.gauge && row.gauge.reserve0 && row.token0) && (
              <div className="flex items-center justify-end max-md:block">
                <Skeleton
                  variant="rectangular"
                  width={120}
                  height={16}
                  style={{
                    marginTop: "1px",
                    marginBottom: "1px",
                  }}
                />
              </div>
            )}
            {row && row.gauge && row.gauge.reserve1 && row.token1 && (
              <div className="flex items-center justify-end max-md:block">
                <Typography variant="h2" className="text-xs font-extralight">
                  {formatCurrency(row.gauge.reserve1)}
                </Typography>
                <Typography
                  variant="h5"
                  className={`min-w-[40xp] text-xs font-extralight`}
                  color="textSecondary"
                >
                  {row.token1.symbol}
                </Typography>
              </div>
            )}
            {!(row && row.gauge && row.gauge.reserve1 && row.token1) && (
              <div className="flex items-center justify-end max-md:block">
                <Skeleton
                  variant="rectangular"
                  width={120}
                  height={16}
                  style={{
                    marginTop: "1px",
                    marginBottom: "1px",
                  }}
                />
              </div>
            )}
          </TableCell>
        )}
        {!(row && row.gauge && row.gauge.address) && (
          <TableCell className="max-md:hidden" align="right">
            <Typography variant="h2" className="text-xs font-extralight">
              Gauge not available
            </Typography>
          </TableCell>
        )}
        <TableCell className="max-2xl:hidden" align="right">
          <Typography variant="h2" className="text-xs font-extralight">
            {formatTVL(row.tvl)}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <div className="flex items-center justify-end gap-1">
            {row.isAliveGauge === false && (
              <Tooltip title="Gauge has been killed">
                <WarningOutlined className="ml-2 text-base text-yellow-300" />
              </Tooltip>
            )}
            {row.oblotr_apr > 0 && (
              <Tooltip
                title={`oFVM APR BOOST ${row.oblotr_apr.toFixed(
                  2
                )}%. Use at Options page`}
              >
                <Link href={`/options`}>
                  <LocalFireDepartmentOutlined className="ml-2 text-base text-orange-600" />
                </Link>
              </Tooltip>
            )}
            <Typography variant="h2" className="text-xs font-extralight">
              {(row.apr + row.oblotr_apr).toFixed(2)}%
            </Typography>
          </div>
        </TableCell>
        <TableCell align="right">
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
}

function descendingComparator(a: Pair, b: Pair, orderBy: OrderBy) {
  if (!a || !b) {
    return 0;
  }

  switch (orderBy) {
    case "pair":
      let caseA = a.symbol.toLowerCase();
      let caseB = b.symbol.toLowerCase();
      if (caseB < caseA) {
        return -1;
      }
      if (caseB > caseA) {
        return 1;
      }
      return 0;

    case "balance":
      if (
        !isBaseAsset(a.token0) ||
        !isBaseAsset(b.token0) ||
        a.token0.balance === null ||
        b.token0.balance === null ||
        !isBaseAsset(a.token1) ||
        !isBaseAsset(b.token1) ||
        a.token1.balance === null ||
        b.token1.balance === null
      ) {
        return 0;
      }
      let balanceA = BigNumber(a.token0.balance)
        .plus(a.token1.balance)
        .toNumber();
      let balanceB = BigNumber(b.token0.balance)
        .plus(b.token1.balance)
        .toNumber();

      if (BigNumber(balanceB).lt(balanceA)) {
        return -1;
      }
      if (BigNumber(balanceB).gt(balanceA)) {
        return 1;
      }
      return 0;

    case "apr":
      const bApr = b.apr + b.oblotr_apr;
      const aApr = a.apr + a.oblotr_apr;
      if (BigNumber(bApr).lt(aApr)) {
        return -1;
      }
      if (BigNumber(bApr).gt(aApr)) {
        return 1;
      }
      return 0;

    case "poolBalance":
      if (!a.balance || !b.balance) {
        return 0;
      }
      if (BigNumber(b.balance).lt(a.balance)) {
        return -1;
      }
      if (BigNumber(b.balance).gt(a.balance)) {
        return 1;
      }
      return 0;

    case "stakedBalance":
      if (!hasGauge(a)) {
        return 1;
      }

      if (!hasGauge(b)) {
        return -1;
      }

      if (!a.gauge.balance) {
        return 1;
      }
      if (!b.gauge.balance) {
        return -1;
      }

      if (BigNumber(b.gauge.balance).lt(a.gauge.balance)) {
        return -1;
      }
      if (BigNumber(b.gauge.balance).gt(a.gauge.balance)) {
        return 1;
      }
      return 0;

    case "tvl":
    case "poolAmount":
      let reserveA = a.tvl;
      let reserveB = b.tvl;

      if (reserveB < reserveA) {
        return -1;
      }
      if (reserveB > reserveA) {
        return 1;
      }
      return 0;

    case "stakedAmount":
      if (!hasGauge(a)) {
        return 1;
      }

      if (!hasGauge(b)) {
        return -1;
      }

      if (!a.gauge.reserve0 || !a.gauge.reserve1) {
        return 1;
      }
      if (!b.gauge.reserve0 || !b.gauge.reserve1) {
        return -1;
      }

      let reserveAA = BigNumber(a.gauge.reserve0)
        .plus(a.gauge.reserve1)
        .toNumber();
      let reserveBB = BigNumber(b.gauge.reserve0)
        .plus(b.gauge.reserve1)
        .toNumber();

      if (BigNumber(reserveBB).lt(reserveAA)) {
        return -1;
      }
      if (BigNumber(reserveBB).gt(reserveAA)) {
        return 1;
      }
      return 0;

    default:
      return 0;
  }
}

function getComparator(order: "asc" | "desc", orderBy: OrderBy) {
  return order === "desc"
    ? (a: Pair, b: Pair) => descendingComparator(a, b, orderBy)
    : (a: Pair, b: Pair) => -descendingComparator(a, b, orderBy);
}

function stableSort(array: Pair[], comparator: (_a: Pair, _b: Pair) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as const);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

export function formatTVL(dataNumber: number) {
  if (dataNumber < 1_000) {
    return "< $1k";
  } else if (dataNumber < 1_000_000) {
    return "$" + (dataNumber / 1_000).toFixed(2) + "k";
  } else if (dataNumber < 1_000_000_000) {
    return "$" + (dataNumber / 1_000_000).toFixed(2) + "m";
  } else {
    return "$" + (dataNumber / 1_000_000_000).toFixed(2) + "b";
  }
}
