import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Dialog,
  MenuItem,
  IconButton,
} from "@mui/material";
import { Search, ArrowBack, DeleteOutline } from "@mui/icons-material";
import BigNumber from "bignumber.js";

import { formatCurrency } from "../../utils/utils";
import { EXPLORER_URL } from "../../stores/constants/constants";
import { BaseAsset, Gauge } from "../../stores/types/types";
import { useRemoveLocalAsset } from "../../lib/global/mutations";

import { useBaseAssetWithInfoNoNative, useGauges } from "./lib/queries";
import { useNotifyGauge } from "./lib/mutations";

export default function BribeCreate() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | false>(false);
  const [asset, setAsset] = useState<BaseAsset | null>(null);
  const [gauge, setGauge] = useState<Gauge | null>(null);

  const { mutate: notifyGauge, notifyLoading } = useNotifyGauge();

  const { data: gaugeOptions } = useGauges();
  useEffect(() => {
    if (gaugeOptions && gaugeOptions.length > 0 && gauge == null) {
      setGauge(gaugeOptions[0]);
    }
  }, [gaugeOptions, gauge]);

  const { data: assetOptions } = useBaseAssetWithInfoNoNative();

  useEffect(() => {
    if (assetOptions && assetOptions.length > 0 && asset == null) {
      setAsset(assetOptions[0]);
    }
  }, [assetOptions, asset]);

  const setAmountPercent = (input: string, percent: number) => {
    setAmountError(false);
    if (input === "amount" && asset && asset.balance) {
      let am = BigNumber(asset.balance)
        .times(percent)
        .div(100)
        .toFixed(asset.decimals);
      setAmount(am);
    }
  };

  const onCreate = () => {
    setAmountError(false);

    let error = false;

    if (!amount || amount === "" || isNaN(+amount)) {
      setAmountError("From amount is required");
      error = true;
    } else {
      if (
        !asset?.balance ||
        isNaN(+asset?.balance) ||
        BigNumber(asset?.balance).lte(0)
      ) {
        setAmountError("Invalid balance");
        error = true;
      } else if (BigNumber(amount).lt(0)) {
        setAmountError("Invalid amount");
        error = true;
      } else if (asset && BigNumber(amount).gt(asset.balance)) {
        setAmountError(`Greater than your available balance`);
        error = true;
      }
    }

    if (!asset || asset === null) {
      setAmountError("From asset is required");
      error = true;
    }

    if (!error) {
      notifyGauge({
        asset,
        amount,
        gauge,
      });
    }
  };

  const amountChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmountError(false);
    setAmount(event.target.value);
  };

  const onAssetSelect = (value: BaseAsset) => {
    setAmountError(false);
    setAsset(value);
  };

  const onGaugeSelect = (value: Gauge) => {
    setGauge(value);
  };

  const renderMassiveInput = (
    type: string,
    amountError: string | false,
    amountChanged: (_event: React.ChangeEvent<HTMLInputElement>) => void,
    assetValue: BaseAsset | null,
    assetOptions: BaseAsset[] | undefined,
    onAssetSelect: (_value: BaseAsset) => void
  ) => {
    return (
      <div className="relative mb-1">
        <div className="w-full flex items-center justify-end absolute top-2">
          <div className="flex justify-end pr-3 pb-2 cursor-pointer">
            <Typography
              className="text-xs font-extralight mr-2 mt-2 text-secondary"
              noWrap
              onClick={() => {
                setAmountPercent(type, 100);
              }}
            >
              Balance:
              {assetValue && assetValue.balance
                ? " " + formatCurrency(assetValue.balance)
                : ""}
            </Typography>
          </div>
        </div>
        <div
          className={`flex wrap rounded-lg w-full items-center bg-background ${
            amountError && "border border-error"
          }`}
        >
          <div className="w-32 min-h-[124px] h-full">
            <AssetSelect
              value={assetValue}
              assetOptions={assetOptions}
              onSelect={onAssetSelect}
            />
          </div>
          <div className="h-full flex-[1] p-1">
            <TextField
              placeholder="0.00"
              fullWidth
              error={!!amountError}
              helperText={amountError}
              value={amount}
              onChange={amountChanged}
              disabled={notifyLoading}
              InputProps={{
                style: {
                  fontSize: "46px",
                },
              }}
            />
            <Typography color="textSecondary" className="text-xs mt-1">
              {asset?.symbol}
            </Typography>
          </div>
        </div>
      </div>
    );
  };

  const onBack = () => {
    router.back();
  };

  const renderCreateInfo = () => {
    return (
      <div className="mt-3 p-3 flex flex-wrap rounded-lg w-full items-center">
        <Typography className="w-full pb-3 text-center text-secondary">
          You are creating a bribe of{" "}
          <span className="text-white">
            {formatCurrency(amount)} {asset?.symbol}
          </span>{" "}
          to incentivize Vesters to vote for the{" "}
          <span className="text-white">
            {gauge?.token0?.symbol}/{gauge?.token1?.symbol} Pool
          </span>
        </Typography>
      </div>
    );
  };

  return (
    <div className="relative">
      <Paper
        elevation={0}
        className="m-auto flex w-[calc(100%-40px)] max-w-[485px] flex-col items-end p-0 xl:w-[calc(100%-180px)]"
      >
        <div className="flex items-center justify-center bg-none border border-background rounded-lg w-[calc(100%-52px)] relative m-6 mb-0 min-h-[60px]">
          <Tooltip placement="top" title="Back to Voting">
            <IconButton className="absolute left-1 top-1" onClick={onBack}>
              <ArrowBack className="text-cyan" />
            </IconButton>
          </Tooltip>
          <Typography className="font-bold text-lg">Notify Gauge</Typography>
        </div>
        <div className="pt-6 px-6 w-full">
          <GaugeSelect
            value={gauge}
            gaugeOptions={gaugeOptions}
            onSelect={onGaugeSelect}
          />
          {renderMassiveInput(
            "amount",
            amountError,
            amountChanged,
            asset,
            assetOptions,
            onAssetSelect
          )}
          {renderCreateInfo()}
        </div>
        <div className="grid gap-3 grid-cols-[1fr] w-full h-full mt-3 px-6 pb-6">
          <Button
            variant="contained"
            size="large"
            className={
              notifyLoading
                ? "min-w-[auto]"
                : "w-full min-w-[200px] bg-background font-bold text-primary hover:bg-[rgb(19,44,60)]"
            }
            color="primary"
            disabled={notifyLoading}
            onClick={onCreate}
          >
            <Typography>
              {notifyLoading ? `Notifying` : `Notify Gauge`}
            </Typography>
            {notifyLoading && <CircularProgress size={10} />}
          </Button>
        </div>
      </Paper>
    </div>
  );
}

function GaugeSelect({
  value,
  gaugeOptions,
  onSelect,
}: {
  value: Gauge | null;
  gaugeOptions: Gauge[] | undefined;
  onSelect: (_value: Gauge) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const openSearch = () => {
    setOpen(true);
    setSearch("");
  };

  const onClose = () => {
    setSearch("");
    setOpen(false);
  };

  const onSearchChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const onLocalSelect = (gauge: Gauge) => {
    setSearch("");
    setOpen(false);
    onSelect(gauge);
  };

  const filteredGaugeOptions = useMemo(() => {
    const go = gaugeOptions?.filter((gauge) => {
      if (search && search !== "") {
        return [gauge.address, gauge.token0.symbol, gauge.token1.symbol].some(
          (s) => s.toLowerCase().includes(search.trim().toLowerCase())
        );
      } else {
        return true;
      }
    });

    return go;
  }, [search, gaugeOptions]);

  return (
    <>
      <div
        className="relative mb-1 min-h-[100px] cursor-pointer rounded-lg border border-slate-500 p-3 transition-colors hover:border-slate-400"
        onClick={() => {
          openSearch();
        }}
      >
        <div className="flex w-[calc(100%-24px)] flex-col items-start py-2 px-3 md:flex-row md:items-center">
          <div className="relative box-content flex h-20 w-36 p-3">
            <img
              className="absolute left-0 top-[calc(50%-1.25rem)] h-10 rounded-full border-4 border-background md:top-3 md:h-16"
              alt=""
              src={value && value.token0 ? `${value.token0.logoURI}` : ""}
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null;
                (e.target as HTMLImageElement).src = "/tokens/unknown-logo.png";
              }}
            />
            <img
              className="absolute left-8 top-[calc(50%-1.25rem)] z-10 h-10 rounded-full border-4 border-background md:top-3 md:left-14 md:h-16"
              alt=""
              src={value && value.token1 ? `${value.token1.logoURI}` : ""}
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null;
                (e.target as HTMLImageElement).src = "/tokens/unknown-logo.png";
              }}
            />
          </div>
          <div>
            <Typography className="flex-[1] text-xl md:text-3xl">
              {value ? `${value.token0.symbol}/${value.token1.symbol}` : ""}
            </Typography>
            <Typography color="textSecondary" className="mt-1 text-xs">
              {value?.isStable ? "Stable Pool" : "Volatile Pool"}
            </Typography>
          </div>
        </div>
      </div>
      <Dialog
        onClose={onClose}
        aria-labelledby="simple-dialog-title"
        open={open}
      >
        <div className="h-[600px] overflow-y-scroll p-6">
          <TextField
            autoFocus
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
          <div className="mt-3 flex w-full flex-col md:min-w-[512px]">
            {filteredGaugeOptions?.map((option) => {
              return (
                <MenuItem
                  key={option.address}
                  // ok at runtime if MenuItem is an immediate child of Select since value is transferred to data-value.
                  value={option as any}
                  onClick={() => {
                    onLocalSelect(option);
                  }}
                >
                  <div className="flex w-[calc(100%-24px)] flex-col items-start py-2 px-3 md:flex-row md:items-center">
                    <div className="relative flex h-20 w-36 p-3">
                      <img
                        className="absolute left-0 top-[calc(50%-1.25rem)] h-10 rounded-full border-4 border-background md:top-3 md:h-16"
                        alt=""
                        src={
                          option && option.token0
                            ? `${option.token0.logoURI}`
                            : ""
                        }
                        onError={(e) => {
                          (e.target as HTMLImageElement).onerror = null;
                          (e.target as HTMLImageElement).src =
                            "/tokens/unknown-logo.png";
                        }}
                      />
                      <img
                        className="absolute left-8 top-[calc(50%-1.25rem)] z-10 h-10 rounded-full border-4 border-background md:top-3 md:left-14 md:h-16"
                        alt=""
                        src={
                          option && option.token1
                            ? `${option.token1.logoURI}`
                            : ""
                        }
                        onError={(e) => {
                          (e.target as HTMLImageElement).onerror = null;
                          (e.target as HTMLImageElement).src =
                            "/tokens/unknown-logo.png";
                        }}
                      />
                    </div>
                    <div>
                      <Typography className="flex-[1] text-xl md:text-3xl">
                        {option.token0.symbol}/{option.token1.symbol}
                      </Typography>
                      <Typography
                        color="textSecondary"
                        className="mt-1 text-xs"
                      >
                        {option?.isStable ? "Stable Pool" : "Volatile Pool"}
                      </Typography>
                    </div>
                  </div>
                </MenuItem>
              );
            })}
          </div>
        </div>
      </Dialog>
    </>
  );
}

function AssetSelect({
  value,
  assetOptions,
  onSelect,
}: {
  value: BaseAsset | null;
  assetOptions: BaseAsset[] | undefined;
  onSelect: (_value: BaseAsset) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [manageLocal, setManageLocal] = useState(false);

  const { mutate: deleteOption } = useRemoveLocalAsset();

  const openSearch = () => {
    setOpen(true);
    setSearch("");
  };

  const filteredAssetOptions = useMemo(() => {
    const ao = assetOptions?.filter((asset) => {
      if (search && search !== "") {
        return [asset.address, asset.symbol, asset.name].some((s) =>
          s.toLowerCase().includes(search.trim().toLowerCase())
        );
      } else {
        return true;
      }
    });

    return ao;
  }, [assetOptions, search]);

  const onSearchChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const onLocalSelect = (asset: BaseAsset) => {
    setSearch("");
    setManageLocal(false);
    setOpen(false);
    onSelect(asset);
  };

  const onClose = () => {
    setManageLocal(false);
    setSearch("");
    setOpen(false);
  };

  const toggleLocal = () => {
    setManageLocal(!manageLocal);
  };

  const viewOption = (token: BaseAsset) => {
    window.open(`${EXPLORER_URL}token/${token.address}`, "_blank");
  };

  const renderManageOption = (asset: BaseAsset, idx: number) => {
    return (
      <MenuItem
        key={asset.address + "_" + idx}
        className="flex items-center justify-between px-0"
      >
        <div className="relative mr-3 w-14">
          <img
            className="h-full w-full rounded-[30px] border border-[rgba(126,153,153,0.5)] bg-[rgb(33,43,72)] p-[6px]"
            alt=""
            src={asset ? `${asset.logoURI}` : ""}
            height="60px"
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null;
              (e.target as HTMLImageElement).src = "/tokens/unknown-logo.png";
            }}
          />
        </div>
        <div>
          <Typography variant="h5">{asset ? asset.symbol : ""}</Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {asset ? asset.name : ""}
          </Typography>
        </div>
        <div className="flex flex-[1] justify-end">
          <IconButton
            onClick={() => {
              deleteOption(asset);
            }}
          >
            <DeleteOutline />
          </IconButton>
          <IconButton
            onClick={() => {
              viewOption(asset);
            }}
          >
            ↗
          </IconButton>
        </div>
      </MenuItem>
    );
  };

  const renderAssetOption = (asset: BaseAsset, idx: number) => {
    return (
      <MenuItem
        key={asset.address + "_" + idx}
        className="flex items-center justify-between px-0"
        onClick={() => {
          onLocalSelect(asset);
        }}
      >
        <div className="relative mr-3 w-14">
          <img
            className="h-full w-full rounded-[30px] border border-[rgba(126,153,153,0.5)] bg-[rgb(33,43,72)] p-[6px]"
            alt=""
            src={asset ? `${asset.logoURI}` : ""}
            height="60px"
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null;
              (e.target as HTMLImageElement).src = "/tokens/unknown-logo.png";
            }}
          />
        </div>
        <div>
          <Typography variant="h5">{asset ? asset.symbol : ""}</Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {asset ? asset.name : ""}
          </Typography>
        </div>
        <div className="ml-12 flex flex-[1] flex-col items-end">
          <Typography variant="h5">
            {asset && asset.balance ? formatCurrency(asset.balance) : "0.00"}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {"Balance"}
          </Typography>
        </div>
      </MenuItem>
    );
  };

  const renderManageLocal = () => {
    return (
      <>
        <div className="h-[600px] overflow-y-scroll p-6">
          <TextField
            autoFocus
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
          <div className="mt-3 flex w-full min-w-[390px] flex-col">
            {filteredAssetOptions
              ? filteredAssetOptions
                  .filter((option) => {
                    return option.local === true;
                  })
                  .map((asset, idx) => {
                    return renderManageOption(asset, idx);
                  })
              : []}
          </div>
        </div>
        <div className="flex w-full items-center justify-center p-[6px]">
          <Button onClick={toggleLocal}>Back to Assets</Button>
        </div>
      </>
    );
  };

  const renderOptions = () => {
    return (
      <>
        <div className="h-[600px] overflow-y-scroll p-6">
          <TextField
            autoFocus
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
          <div className="mt-3 flex w-full min-w-[390px] flex-col">
            {filteredAssetOptions
              ? filteredAssetOptions
                  .sort((a, b) => {
                    if (!a.balance || !b.balance) return 0;
                    if (BigNumber(a.balance).lt(b.balance)) return 1;
                    if (BigNumber(a.balance).gt(b.balance)) return -1;
                    if (a.symbol.toLowerCase() < b.symbol.toLowerCase())
                      return -1;
                    if (a.symbol.toLowerCase() > b.symbol.toLowerCase())
                      return 1;
                    return 0;
                  })
                  .map((asset, idx) => {
                    return renderAssetOption(asset, idx);
                  })
              : []}
          </div>
        </div>
        <div className="flex w-full items-center justify-center p-[6px]">
          <Button onClick={toggleLocal}>Manage Local Assets</Button>
        </div>
      </>
    );
  };

  return (
    <>
      <div
        className="min-h-[100px] p-3"
        onClick={() => {
          openSearch();
        }}
      >
        <div className="relative w-full cursor-pointer">
          <img
            className="h-full w-full rounded-[50px] border border-[rgba(126,153,153,0.5)] bg-[#032725] p-[10px]"
            alt=""
            src={value ? `${value.logoURI}` : ""}
            height="100px"
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null;
              (e.target as HTMLImageElement).src = "/tokens/unknown-logo.png";
            }}
          />
        </div>
      </div>
      <Dialog
        onClose={onClose}
        aria-labelledby="simple-dialog-title"
        open={open}
      >
        {!manageLocal && renderOptions()}
        {manageLocal && renderManageLocal()}
      </Dialog>
    </>
  );
}
