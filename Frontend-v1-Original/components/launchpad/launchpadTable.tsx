import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  Paper,
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
  TextField,
  InputAdornment,
  Skeleton,
} from "@mui/material";
import { Search } from "@mui/icons-material";

import { formatCurrency } from "../../utils/utils";

import { useLaunchpadProjects } from "./queries";

interface Project {
  address: `0x${string}`;
  name: string;
  type: string;
  status: string;
  totalRaised: string;
  userAllocation: string;
}

const headCells = [
  { id: "project", numeric: false, disablePadding: false, label: "Project" },
  {
    id: "type",
    numeric: false,
    disablePadding: false,
    label: "Type",
  },
  {
    id: "status",
    numeric: false,
    disablePadding: false,
    label: "Status",
  },
  {
    id: "totalRaised",
    numeric: true,
    disablePadding: false,
    label: "Total Raised",
  },
  {
    id: "userAllocation",
    numeric: true,
    disablePadding: false,
    label: "Your Allocation",
  },
] as const;

type OrderBy = (typeof headCells)[number]["id"];

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

interface LaunchpadToolbarProps {
  setSearch: (_search: string) => void;
}

const EnhancedTableToolbar = (props: LaunchpadToolbarProps) => {
  const [search, setSearch] = useState("");

  const onSearchChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    props.setSearch(event.target.value);
  };

  return (
    <Toolbar className="my-6 mx-0 p-0">
      <TextField
        className="flex w-full flex-[1]"
        variant="outlined"
        fullWidth
        placeholder="CANTO, NOTE, 0x..."
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
    </Toolbar>
  );
};

export default function EnhancedTable() {
  const { address } = useAccount();
  const { data: projects, isFetching } = useLaunchpadProjects(address);

  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("project");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const [search, setSearch] = useState("");

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

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null,
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

  const filteredProjects = useMemo(
    () =>
      projects?.filter((project) => {
        if (!search || search === "") {
          return true;
        }

        const searchLower = search.toLowerCase();

        if (
          project.address.toLowerCase().includes(searchLower) ||
          project.name.toLowerCase().includes(searchLower) ||
          project.status.toLowerCase().includes(searchLower) ||
          project.type.toLowerCase().includes(searchLower)
        ) {
          return true;
        }

        return false;
      }),
    [projects, search]
  );

  const sortedProjects = useMemo(() => {
    if (filteredProjects) {
      return stableSort(filteredProjects, getComparator(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      );
    }
  }, [filteredProjects, order, orderBy, page, rowsPerPage]);

  const emptyRows = filteredProjects
    ? 5 - Math.min(5, filteredProjects.length - page * 5)
    : 1;

  return (
    <div className="m-auto w-full max-w-[1400px]">
      <EnhancedTableToolbar setSearch={setSearch} />
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
              {isFetching ? (
                <TableRow>
                  <TableCell>
                    <Skeleton height={56} />
                  </TableCell>
                  <TableCell className="max-md:hidden" align="right">
                    <Skeleton height={56} />
                  </TableCell>
                  <TableCell className="max-md:hidden" align="right">
                    <Skeleton height={56} />
                  </TableCell>
                  <TableCell className="max-md:hidden" align="right">
                    <Skeleton height={56} />
                  </TableCell>
                  <TableCell className="max-md:hidden" align="right">
                    <Skeleton height={56} />
                  </TableCell>
                </TableRow>
              ) : null}
              {sortedProjects?.map((project) => {
                return (
                  <Link
                    key={project.address}
                    href={`/launchpad/${project.address}`}
                  >
                    <TableRow className="hover:bg-[rgba(104,108,122,0.05)]">
                      <TableCell>{project.name}</TableCell>
                      <TableCell className="max-md:hidden" align="right">
                        {project.type}
                      </TableCell>
                      <TableCell className="max-md:hidden" align="right">
                        {project.status}
                      </TableCell>
                      <TableCell className="max-md:hidden" align="right">
                        {formatCurrency(project.totalRaised)}
                      </TableCell>
                      <TableCell className="max-md:hidden" align="right">
                        {formatCurrency(project.userAllocation)}
                      </TableCell>
                    </TableRow>
                  </Link>
                );
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
          count={filteredProjects?.length ?? 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </div>
  );
}

function descendingComparator(a: Project, b: Project, orderBy: OrderBy) {
  if (!a || !b) {
    return 0;
  }

  switch (orderBy) {
    case "project":
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameB < nameA) {
        return -1;
      }
      if (nameB > nameA) {
        return 1;
      }
      return 0;
    case "type":
      const typeA = a.type.toLowerCase();
      const typeB = b.type.toLowerCase();
      if (typeB < typeA) {
        return -1;
      }
      if (typeB > typeA) {
        return 1;
      }
      return 0;
    case "status":
      const statusA = a.status.toLowerCase();
      const statusB = b.status.toLowerCase();
      if (statusB < statusA) {
        return -1;
      }
      if (statusB > statusA) {
        return 1;
      }
      return 0;

    case "totalRaised":
      const reserveA = a.totalRaised;
      const reserveB = b.totalRaised;

      if (reserveB < reserveA) {
        return -1;
      }
      if (reserveB > reserveA) {
        return 1;
      }
      return 0;

    case "userAllocation":
      const allocA = a.userAllocation;
      const allocB = b.userAllocation;

      if (allocB < allocA) {
        return -1;
      }
      if (allocB > allocA) {
        return 1;
      }
      return 0;

    default:
      return 0;
  }
}

function getComparator(order: "asc" | "desc", orderBy: OrderBy) {
  return order === "desc"
    ? (a: Project, b: Project) => descendingComparator(a, b, orderBy)
    : (a: Project, b: Project) => -descendingComparator(a, b, orderBy);
}

function stableSort(
  array: Project[],
  comparator: (_a: Project, _b: Project) => number
) {
  const stabilizedThis = array.map((el, index) => [el, index] as const);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}
