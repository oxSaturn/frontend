import React, { useState, useEffect, useMemo } from "react";
import {
  TextField,
  Typography,
  InputAdornment,
  Button,
  MenuItem,
  IconButton,
  Dialog,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  ArrowDownward,
  UpdateOutlined,
  DeleteOutline,
  SettingsOutlined,
  CloseOutlined,
} from "@mui/icons-material";

import { withTheme } from "@mui/styles";

import { formatCurrency } from "../../utils/utils";

import stores from "../../stores";
import {
  ACTIONS,
  ETHERSCAN_URL,
  NATIVE_TOKEN,
  W_NATIVE_ADDRESS,
} from "../../stores/constants/constants";
import BigNumber from "bignumber.js";
import type {
  BaseAsset,
  Path,
  QuoteSwapResponse,
} from "../../stores/types/types";

function Setup() {
  const [, updateState] = React.useState<{}>();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [routesOpen, setRoutesOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const [fromAmountValue, setFromAmountValue] = useState("");
  const [fromAmountValueUsd, setFromAmountValueUsd] = useState("");
  const [fromAmountError, setFromAmountError] = useState<false | string>(false);
  const [fromAssetValue, setFromAssetValue] = useState<BaseAsset>(null);
  const [fromAssetError, setFromAssetError] = useState<false | string>(false);
  const [fromAssetOptions, setFromAssetOptions] = useState<BaseAsset[]>([]);

  const [toAmountValue, setToAmountValue] = useState("");
  const [toAmountValueUsd, setToAmountValueUsd] = useState("");
  const [toAmountError, setToAmountError] = useState(false);
  const [toAssetValue, setToAssetValue] = useState<BaseAsset>(null);
  const [toAssetError, setToAssetError] = useState(false);
  const [toAssetOptions, setToAssetOptions] = useState<BaseAsset[]>([]);

  const [slippage, setSlippage] = useState("2");
  const [slippageError, setSlippageError] = useState(false);

  const [quoteError, setQuoteError] = useState(null);
  const [quote, setQuote] = useState<QuoteSwapResponse>(null);

  const [tokenPrices, setTokenPrices] = useState<Map<string, number>>();

  const isWrapUnwrap =
    (fromAssetValue?.symbol === "WCANTO" && toAssetValue?.symbol === "CANTO") ||
    (fromAssetValue?.symbol === "CANTO" && toAssetValue?.symbol === "WCANTO")
      ? true
      : false;

  const usdDiff = useMemo(() => {
    if (
      fromAmountValueUsd &&
      fromAmountValueUsd === "" &&
      toAmountValueUsd &&
      toAmountValueUsd === ""
    )
      return "";
    if (
      parseFloat(fromAmountValueUsd) === 0 ||
      parseFloat(toAmountValueUsd) === 0
    )
      return "";
    if (parseFloat(fromAmountValueUsd) === parseFloat(toAmountValueUsd)) return;
    if (parseFloat(fromAmountValueUsd) === parseFloat(toAmountValueUsd)) return;
    fromAmountValueUsd &&
      fromAmountValueUsd !== "" &&
      toAmountValueUsd &&
      toAmountValueUsd !== "";

    const increase =
      ((parseFloat(toAmountValueUsd) - parseFloat(fromAmountValueUsd)) /
        parseFloat(fromAmountValueUsd)) *
      100;
    const decrease =
      ((parseFloat(fromAmountValueUsd) - parseFloat(toAmountValueUsd)) /
        parseFloat(fromAmountValueUsd)) *
      100;
    const diff =
      parseFloat(fromAmountValueUsd) > parseFloat(toAmountValueUsd)
        ? -1 * decrease
        : increase;
    return diff.toFixed(2);
  }, [fromAmountValueUsd, toAmountValueUsd]);

  useEffect(() => {
    const errorReturned = () => {
      setLoading(false);
      setApprovalLoading(false);
      setQuoteLoading(false);
    };

    const quoteReturned = (val: QuoteSwapResponse) => {
      if (!val) {
        setQuoteLoading(false);
        setQuote(null);
        setToAmountValue("");
        setToAmountValueUsd("");
        setQuoteError(
          "Insufficient liquidity or no route available to complete swap"
        );
      }
      if (
        val &&
        val.encodedData &&
        val.maxReturn &&
        val.maxReturn.totalFrom ===
          BigNumber(fromAmountValue)
            .multipliedBy(10 ** fromAssetValue.decimals)
            .toFixed(0) &&
        (val.maxReturn.from.toLowerCase() ===
          fromAssetValue.address.toLowerCase() ||
          (val.maxReturn.from ===
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" &&
            fromAssetValue.address === NATIVE_TOKEN.address)) &&
        (val.maxReturn.to.toLowerCase() ===
          toAssetValue.address.toLowerCase() ||
          (val.maxReturn.to === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" &&
            toAssetValue.address === NATIVE_TOKEN.address))
      ) {
        setQuoteLoading(false);
        if (BigNumber(val.maxReturn.totalTo).eq(0)) {
          setQuote(null);
          setToAmountValue("");
          setToAmountValueUsd("");
          setQuoteError(
            "Insufficient liquidity or no route available to complete swap"
          );
          return;
        }

        setToAmountValue(
          BigNumber(val.maxReturn.totalTo)
            .div(10 ** toAssetValue.decimals)
            .toFixed(toAssetValue.decimals, BigNumber.ROUND_DOWN)
        );
        const toAddressLookUp =
          val.maxReturn.to === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
            ? W_NATIVE_ADDRESS.toLowerCase()
            : val.maxReturn.to.toLowerCase();
        const toUsdValue = BigNumber(val.maxReturn.totalTo)
          .div(10 ** toAssetValue.decimals)
          .multipliedBy(tokenPrices.get(toAddressLookUp))
          .toFixed(2);
        setToAmountValueUsd(toUsdValue);
        setQuote(val);
      }
    };

    const ssUpdated = () => {
      const swapAssets = stores.stableSwapStore.getStore("swapAssets");
      const tokenPrices = stores.helper.getTokenPricesMap;

      setToAssetOptions(swapAssets);
      setFromAssetOptions(swapAssets);

      if (swapAssets.length > 0 && toAssetValue == null) {
        setToAssetValue(swapAssets[0]);
      }

      if (swapAssets.length > 0 && fromAssetValue == null) {
        setFromAssetValue(swapAssets[1]);
      }

      if (tokenPrices.size > 0) {
        setTokenPrices(tokenPrices);
      }

      forceUpdate();
    };

    const assetsUpdated = (payload: BaseAsset[]) => {
      if (payload && payload.length > 0) {
        setToAssetOptions(payload);
        setFromAssetOptions(payload);
      } else {
        const swapAssets = stores.stableSwapStore.getStore("swapAssets");
        setToAssetOptions(swapAssets);
        setFromAssetOptions(swapAssets);
      }
    };

    const swapReturned = (event) => {
      setLoading(false);
      setFromAmountValue("");
      setToAmountValue("");
      setFromAmountValueUsd("");
      setToAmountValueUsd("");
      calculateReceiveAmount("", fromAssetValue, toAssetValue);
      setQuote(null);
      setQuoteLoading(false);
    };

    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    stores.emitter.on(ACTIONS.SWAP_RETURNED, swapReturned);
    stores.emitter.on(ACTIONS.QUOTE_SWAP_RETURNED, quoteReturned);
    stores.emitter.on(ACTIONS.SWAP_ASSETS_UPDATED, assetsUpdated);
    // stores.emitter.on(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);
    stores.emitter.on(ACTIONS.WRAP_UNWRAP_RETURNED, swapReturned);

    ssUpdated();

    const interval = setInterval(() => {
      if (!loading && !quoteLoading) updateQuote();
    }, 10000);

    return () => {
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
      stores.emitter.removeListener(ACTIONS.SWAP_RETURNED, swapReturned);
      stores.emitter.removeListener(ACTIONS.WRAP_UNWRAP_RETURNED, swapReturned);
      stores.emitter.removeListener(ACTIONS.QUOTE_SWAP_RETURNED, quoteReturned);
      stores.emitter.removeListener(ACTIONS.SWAP_ASSETS_UPDATED, assetsUpdated);
      clearInterval(interval);
    };
  }, [
    fromAmountValue,
    fromAssetValue,
    toAssetValue,
    slippage,
    loading,
    quoteLoading,
  ]);

  const onAssetSelect = (type, value) => {
    if (type === "From") {
      if (value.address === toAssetValue.address) {
        setToAssetValue(fromAssetValue);
        setFromAssetValue(toAssetValue);
        calculateReceiveAmount(fromAmountValue, toAssetValue, fromAssetValue);
      } else {
        setFromAssetValue(value);
        calculateReceiveAmount(fromAmountValue, value, toAssetValue);
      }
    } else {
      if (value.address === fromAssetValue.address) {
        setFromAssetError(false);
        setToAssetValue(fromAssetValue);
        calculateReceiveAmount(fromAmountValue, toAssetValue, fromAssetValue);
      } else {
        setToAssetValue(value);
        calculateReceiveAmount(fromAmountValue, fromAssetValue, value);
      }
    }

    forceUpdate();
  };

  const fromAmountChanged = (event) => {
    setFromAmountError(false);
    setFromAmountValue(event.target.value);
    if (event.target.value == "") {
      setToAmountValue("");
      setQuote(null);
      setFromAmountValueUsd("");
      setToAmountValueUsd("");
    } else {
      setFromAmountValueUsd(
        (
          parseFloat(event.target.value) *
          tokenPrices.get(
            fromAssetValue.address === "CANTO"
              ? W_NATIVE_ADDRESS.toLowerCase()
              : fromAssetValue.address.toLowerCase()
          )
        ).toFixed(2)
      );
      calculateReceiveAmount(event.target.value, fromAssetValue, toAssetValue);
    }
  };

  const toAmountChanged = (event) => {};

  const onSlippageChanged = (event) => {
    if (event.target.value == "" || !isNaN(event.target.value)) {
      setSlippage(event.target.value);
    }
  };

  const calculateReceiveAmount = (
    amount: string,
    from: BaseAsset,
    to: BaseAsset
  ) => {
    if (
      amount !== "" &&
      !isNaN(+amount) &&
      to != null &&
      parseFloat(amount) !== 0
    ) {
      setQuoteLoading(true);
      setQuoteError(false);

      if (isWrapUnwrap) {
        setQuoteLoading(false);
        setToAmountValue(amount);
        return;
      }

      stores.dispatcher.dispatch({
        type: ACTIONS.QUOTE_SWAP,
        content: {
          fromAsset: from,
          toAsset: to,
          fromAmount: amount,
          slippage: slippage !== "" ? parseFloat(slippage) / 100 : 0.005,
        },
      });
    }
  };

  const updateQuote = () => {
    if (fromAmountValue === "") {
      setToAmountValue("");
      setQuote(null);
      setFromAmountValueUsd("");
      setToAmountValueUsd("");
    }
    calculateReceiveAmount(fromAmountValue, fromAssetValue, toAssetValue);
  };

  const closeSettings = () => {
    setSettingsOpen(false);
    updateQuote();
  };

  const onSwap = () => {
    setFromAmountError(false);
    setFromAssetError(false);
    setToAssetError(false);

    let error = false;

    if (!fromAmountValue || fromAmountValue === "" || isNaN(+fromAmountValue)) {
      setFromAmountError("From amount is required");
      error = true;
    } else {
      if (
        !fromAssetValue.balance ||
        isNaN(+fromAssetValue.balance) || // TODO probably dont neet it
        BigNumber(fromAssetValue.balance).lte(0)
      ) {
        setFromAmountError("Invalid balance");
        error = true;
      } else if (BigNumber(fromAmountValue).lt(0)) {
        setFromAmountError("Invalid amount");
        error = true;
      } else if (
        fromAssetValue &&
        BigNumber(fromAmountValue).gt(fromAssetValue.balance)
      ) {
        setFromAmountError(`Greater than your available balance`);
        error = true;
      }
    }

    if (!fromAssetValue || fromAssetValue === null) {
      setFromAssetError("From asset is required");
      error = true;
    }

    if (!toAssetValue || toAssetValue === null) {
      setFromAssetError("To asset is required");
      error = true;
    }

    if (!error) {
      setLoading(true);

      stores.dispatcher.dispatch({
        type: ACTIONS.SWAP,
        content: {
          fromAsset: fromAssetValue,
          toAsset: toAssetValue,
          quote,
        },
      });
    }
  };

  const onWrapUnwrap = () => {
    setFromAmountError(false);
    setFromAssetError(false);
    setToAssetError(false);

    let error = false;

    if (!fromAmountValue || fromAmountValue === "" || isNaN(+fromAmountValue)) {
      setFromAmountError("From amount is required");
      error = true;
    } else {
      if (
        !fromAssetValue.balance ||
        isNaN(+fromAssetValue.balance) || // TODO probably dont neet it
        BigNumber(fromAssetValue.balance).lte(0)
      ) {
        setFromAmountError("Invalid balance");
        error = true;
      } else if (BigNumber(fromAmountValue).lt(0)) {
        setFromAmountError("Invalid amount");
        error = true;
      } else if (
        fromAssetValue &&
        BigNumber(fromAmountValue).gt(fromAssetValue.balance)
      ) {
        setFromAmountError(`Greater than your available balance`);
        error = true;
      }
    }

    if (!fromAssetValue || fromAssetValue === null) {
      setFromAssetError("From asset is required");
      error = true;
    }

    if (!toAssetValue || toAssetValue === null) {
      setFromAssetError("To asset is required");
      error = true;
    }

    if (!error) {
      setLoading(true);

      stores.dispatcher.dispatch({
        type: ACTIONS.WRAP_UNWRAP,
        content: {
          fromAsset: fromAssetValue,
          toAsset: toAssetValue,
          fromAmount: fromAmountValue,
        },
      });
    }
  };

  const setBalance100 = () => {
    const am = BigNumber(fromAssetValue.balance).toString();
    setFromAmountValue(am);
    setFromAmountValueUsd(
      (
        parseFloat(am) *
        tokenPrices.get(
          fromAssetValue.address === "CANTO"
            ? W_NATIVE_ADDRESS.toLowerCase()
            : fromAssetValue.address.toLowerCase()
        )
      ).toFixed(2)
    );
    calculateReceiveAmount(am, fromAssetValue, toAssetValue);
  };

  const swapAssets = () => {
    const fa = fromAssetValue;
    const ta = toAssetValue;
    setFromAssetValue(ta);
    setToAssetValue(fa);
    calculateReceiveAmount(fromAmountValue, ta, fa);
  };

  const renderSwapInformation = () => {
    if (quoteError) {
      return (
        <div className="flex min-h-full items-center justify-center">
          <Typography className="min-w-full rounded-[10px] border border-cantoGreen bg-[rgb(23,52,72)] p-6 text-xs font-extralight">
            {quoteError}
          </Typography>
        </div>
      );
    }

    if (quoteLoading) {
      return (
        <div className="flex min-h-full items-center justify-center">
          <CircularProgress size={20} className="ml-2 fill-white" />
        </div>
      );
    }

    if (!quote) {
      return null;
    }

    return (
      <div className="mt-3 flex w-full flex-wrap items-center rounded-[10px] p-3">
        <Typography className="w-full border-b border-solid border-[rgba(126,153,176,0.2)] pb-[6px] text-sm font-bold text-cantoGreen">
          Price Info
        </Typography>
        <div className="grid w-full grid-cols-2 gap-3">
          <div className="flex flex-col items-center justify-center py-6 px-0">
            <Typography className="pb-[6px] text-sm font-bold">
              {formatCurrency(
                BigNumber(quote.maxReturn.totalFrom)
                  .div(quote.maxReturn.totalTo)
                  .toFixed(18)
              )}
            </Typography>
            <Typography className="text-xs text-[#7e99b0]">{`${fromAssetValue?.symbol} per ${toAssetValue?.symbol}`}</Typography>
          </div>
          <div className="flex flex-col items-center justify-center py-6 px-0">
            <Typography className="pb-[6px] text-sm font-bold">
              {formatCurrency(
                BigNumber(quote.maxReturn.totalTo)
                  .div(quote.maxReturn.totalFrom)
                  .toFixed(18)
              )}
            </Typography>
            <Typography className="text-xs text-[#7e99b0]">{`${toAssetValue?.symbol} per ${fromAssetValue?.symbol}`}</Typography>
          </div>
        </div>
        <div
          className="flex w-full cursor-pointer items-center justify-between"
          onClick={() => setRoutesOpen(true)}
        >
          <div className="text-sm font-bold text-cantoGreen underline transition-all hover:text-green-300 hover:no-underline">
            Show Routes
          </div>
        </div>
      </div>
    );
  };

  const renderSmallInput = (type, amountValue, amountError, amountChanged) => {
    return (
      <div className="mb-1">
        <label htmlFor="slippage">Slippage</label>
        <div className="flex w-full max-w-[72px] flex-wrap items-center rounded-[10px] bg-[#272826]">
          <TextField
            id="slippage"
            placeholder="0.00"
            fullWidth
            error={!!amountError}
            helperText={amountError}
            value={amountValue}
            onChange={amountChanged}
            disabled={loading}
            autoComplete="off"
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </div>
      </div>
    );
  };

  const renderMassiveInput = (
    type,
    amountValue,
    amountValueUsd,
    diffUsd,
    amountError,
    amountChanged,
    assetValue,
    assetError,
    assetOptions,
    onAssetSelect
  ) => {
    return (
      <div className="relative mb-1">
        <div
          className="absolute top-2 right-2 z-[1] cursor-pointer"
          onClick={() => {
            if (type === "From") {
              setBalance100();
            }
          }}
        >
          <Typography className="text-xs font-thin text-[#7e99b0]" noWrap>
            Balance:
            {assetValue && assetValue.balance
              ? " " + formatCurrency(assetValue.balance)
              : ""}
          </Typography>
        </div>
        {assetValue &&
        assetValue.balance &&
        amountValueUsd &&
        amountValueUsd !== "" ? (
          <div className="absolute bottom-2 right-2 z-[1] cursor-pointer">
            <Typography className="text-xs font-thin text-[#7e99b0]" noWrap>
              {"~$" +
                formatCurrency(amountValueUsd) +
                (type === "To" && diffUsd && diffUsd !== ""
                  ? ` (${diffUsd}%)`
                  : "")}
            </Typography>
          </div>
        ) : null}
        <div
          className={`flex w-full flex-wrap items-center rounded-[10px] bg-[#272826] ${
            (amountError || assetError) && "border border-red-500"
          }`}
        >
          <div className="h-full min-h-[128px] w-32">
            <AssetSelect
              type={type}
              value={assetValue}
              assetOptions={assetOptions}
              onSelect={onAssetSelect}
            />
          </div>
          <div className="h-full flex-[1] flex-grow-[0.98]">
            <TextField
              placeholder="0.00"
              fullWidth
              error={!!amountError}
              helperText={amountError}
              value={amountValue}
              onChange={amountChanged}
              autoComplete="off"
              disabled={loading || type === "To"}
              InputProps={{
                style: {
                  fontSize: "46px !important",
                },
              }}
            />
            <Typography color="textSecondary" className="text-xs">
              {assetValue?.symbol}
            </Typography>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="relative flex w-full flex-col">
        <div
          className={`${
            !settingsOpen
              ? "hidden"
              : "absolute z-20 flex h-full w-full flex-col gap-4 bg-[#040105] p-4"
          }`}
        >
          <div
            onClick={closeSettings}
            className="w-full cursor-pointer text-end"
          >
            <CloseOutlined />
          </div>
          {renderSmallInput(
            "slippage",
            slippage,
            slippageError,
            onSlippageChanged
          )}
        </div>
        <div className="mb-1 flex items-center justify-end">
          <button onClick={updateQuote}>
            <UpdateOutlined className="fill-gray-300 transition-all hover:scale-105 hover:fill-cantoGreen" />
          </button>
          <button onClick={() => setSettingsOpen(true)}>
            <SettingsOutlined className="fill-gray-300 transition-all hover:scale-105 hover:fill-cantoGreen" />
          </button>
        </div>
        {renderMassiveInput(
          "From",
          fromAmountValue,
          fromAmountValueUsd,
          usdDiff,
          fromAmountError,
          fromAmountChanged,
          fromAssetValue,
          fromAssetError,
          fromAssetOptions,
          onAssetSelect
        )}
        <div className="flex h-0 w-full items-center justify-center">
          <div className="z-[1] h-9 rounded-lg bg-[#161b2c]">
            <ArrowDownward
              className="m-1 cursor-pointer rounded-md p-[6px] text-3xl"
              onClick={swapAssets}
            />
          </div>
        </div>
        {renderMassiveInput(
          "To",
          toAmountValue,
          toAmountValueUsd,
          usdDiff,
          toAmountError,
          toAmountChanged,
          toAssetValue,
          toAssetError,
          toAssetOptions,
          onAssetSelect
        )}
        {renderSwapInformation()}
        <div className="mt-3 grid h-full w-full grid-cols-[1fr] gap-3 py-0">
          <Button
            variant="contained"
            size="large"
            color="primary"
            className="bg-[#272826] font-bold text-cantoGreen hover:bg-green-900"
            disabled={loading || quoteLoading || (!quote && !isWrapUnwrap)}
            onClick={!isWrapUnwrap ? onSwap : onWrapUnwrap}
          >
            <Typography className="font-bold capitalize">
              {loading ? `Loading` : isWrapUnwrap ? `Wrap/Unwrap` : `Swap`}
            </Typography>
            {loading && (
              <CircularProgress size={10} className="ml-2 fill-white" />
            )}
          </Button>
        </div>
        <div className="mt-2 text-end text-xs">
          <span className="align-middle text-[#7e99b0]">Powered by </span>
          <a
            href="https://firebird.finance/"
            target="_blank"
            rel="noreferrer noopener"
            className="cursor-pointer grayscale transition-all hover:text-[#f66432] hover:grayscale-0"
          >
            <img src="/images/logo-firebird.svg" className="inline" />{" "}
            <span className="align-middle">Firebird</span>
          </a>
        </div>
      </div>
      <RoutesDialog
        onClose={() => setRoutesOpen(false)}
        open={routesOpen}
        paths={quote?.maxReturn.paths}
        fromAssetValue={fromAssetValue}
        toAssetValue={toAssetValue}
      />
    </>
  );
}

function AssetSelect({ type, value, assetOptions, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredAssetOptions, setFilteredAssetOptions] = useState([]);

  const [manageLocal, setManageLocal] = useState(false);

  const openSearch = () => {
    setSearch("");
    setOpen(true);
  };

  useEffect(() => {
    async function sync() {
      let ao = assetOptions.filter((asset) => {
        if (search && search !== "") {
          return (
            asset.address.toLowerCase().includes(search.toLowerCase()) ||
            asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
            asset.name.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          return true;
        }
      });

      setFilteredAssetOptions(ao);

      //no options in our default list and its an address we search for the address
      if (ao.length === 0 && search && search.length === 42) {
        const baseAsset = await stores.stableSwapStore.getBaseAsset(
          search,
          true,
          true
        );
        if (baseAsset) {
          stores.emitter.emit(ACTIONS.WARNING, {
            warning: "Token is not whitelisted",
          });
        }
      }
    }
    sync();
    return () => {};
  }, [assetOptions, search]);

  const onSearchChanged = async (event) => {
    setSearch(event.target.value);
  };

  const onLocalSelect = (type, asset) => {
    setSearch("");
    setManageLocal(false);
    setOpen(false);
    onSelect(type, asset);
  };

  const onClose = () => {
    setManageLocal(false);
    setSearch("");
    setOpen(false);
  };

  const toggleLocal = () => {
    setManageLocal(!manageLocal);
  };

  const deleteOption = (token) => {
    stores.stableSwapStore.removeBaseAsset(token);
  };

  const viewOption = (token) => {
    window.open(`${ETHERSCAN_URL}token/${token.address}`, "_blank");
  };

  const renderManageOption = (type, asset, idx) => {
    return (
      <MenuItem
        defaultValue={asset.address}
        key={asset.address + "_" + idx}
        className="flex items-center justify-between px-0"
      >
        <div className="relative mr-3 w-14">
          <img
            className="rounded-[30px] border border-[rgba(126,153,153,0.5)] bg-[rgb(33,43,72)] p-[6px]"
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

  const renderAssetOption = (type, asset, idx) => {
    return (
      <MenuItem
        defaultValue={asset.address}
        key={asset.address + "_" + idx}
        className="flex items-center justify-between px-0"
        onClick={() => {
          onLocalSelect(type, asset);
        }}
      >
        <div className="relative mr-3 w-14">
          <img
            className="rounded-[30px] border border-[rgba(126,153,153,0.5)] bg-[rgb(33,43,72)] p-[6px]"
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
            Balance
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
            placeholder="CANTO, MIM, 0x..."
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
                    return renderManageOption(type, asset, idx);
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
            placeholder="CANTO, MIM, 0x..."
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
                    if (BigNumber(a.balance).lt(b.balance)) return 1;
                    if (BigNumber(a.balance).gt(b.balance)) return -1;
                    if (a.symbol.toLowerCase() < b.symbol.toLowerCase())
                      return -1;
                    if (a.symbol.toLowerCase() > b.symbol.toLowerCase())
                      return 1;
                    return 0;
                  })
                  .map((asset, idx) => {
                    return renderAssetOption(type, asset, idx);
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
        aria-labelledby="asset-select-dialog-title"
        open={open}
      >
        {!manageLocal && renderOptions()}
        {manageLocal && renderManageLocal()}
      </Dialog>
    </>
  );
}

function RoutesDialog({
  onClose,
  open,
  paths,
  fromAssetValue,
  toAssetValue,
}: {
  onClose: () => void;
  open: boolean;
  paths: Path[] | undefined;
  fromAssetValue: BaseAsset;
  toAssetValue: BaseAsset;
}) {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      aria-labelledby="routes-presentation"
    >
      {paths ? (
        <div className="relative flex w-full min-w-[576px] flex-col justify-between p-6">
          <div>Routes</div>
          <div className="flex w-full items-center justify-between">
            <img
              className="h-12 rounded-[30px] border border-[rgba(126,153,153,0.5)] bg-[rgb(33,43,72)] p-[6px]"
              alt=""
              src={fromAssetValue ? `${fromAssetValue.logoURI}` : ""}
              height="40px"
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null;
                (e.target as HTMLImageElement).src = "/tokens/unknown-logo.png";
              }}
            />
            <img
              className="h-12 rounded-[30px] border border-[rgba(126,153,153,0.5)] bg-[rgb(33,43,72)] p-[6px]"
              alt=""
              src={toAssetValue ? `${toAssetValue.logoURI}` : ""}
              height="40px"
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null;
                (e.target as HTMLImageElement).src = "/tokens/unknown-logo.png";
              }}
            />
          </div>
          <div className="px-6">
            <div className="relative flex py-6 px-[5%] before:absolute before:left-0 before:top-0 before:h-11 before:w-full before:rounded-b-3xl before:rounded-br-3xl before:border before:border-t-0 before:border-dashed before:border-cantoGreen">
              <div className="relative flex flex-grow">
                <div className="flex flex-grow justify-between gap-4">
                  <div>80%</div>
                  <div>FLOW</div>
                  <div>FLOW</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        "No routes"
      )}
    </Dialog>
  );
}

export default withTheme(Setup);
