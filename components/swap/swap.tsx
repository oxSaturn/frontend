import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { Typography, Button, CircularProgress, Paper } from "@mui/material";
import {
  ArrowDownward,
  UpdateOutlined,
  SettingsOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import BigNumber from "bignumber.js";

import { SmallInput } from "../common/smallInput";
import { MassiveInput } from "../common/massiveInput";
import { formatCurrency } from "../../utils/utils";
import {
  NATIVE_TOKEN,
  W_NATIVE_ADDRESS,
  W_NATIVE_SYMBOL,
} from "../../stores/constants/constants";
import type { BaseAsset } from "../../stores/types/types";
import { useTokenPrices } from "../header/lib/queries";

import { useSwapAssets, useQuote } from "./lib/queries";
import { useSwap, useWrapOrUnwrap } from "./lib/mutations";
import { RoutesDialog } from "./routes";
import { usePriceDiff, usePriceImpact } from "./lib/usePriceDiff";
import { useIsWrapUnwrap } from "./lib/useIsWrapUnwrap";

function Swap() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [routesOpen, setRoutesOpen] = useState(false);

  const [fromAmountValue, setFromAmountValue] = useState("");
  const [fromAmountValueUsd, setFromAmountValueUsd] = useState("");
  const [fromAmountError, setFromAmountError] = useState<false | string>(false);
  const [fromAssetValue, setFromAssetValue] = useState<BaseAsset | null>(null);
  const [fromAssetError, setFromAssetError] = useState<false | string>(false);

  const [toAmountValue, setToAmountValue] = useState("");
  const [toAmountValueUsd, setToAmountValueUsd] = useState("");
  const [toAmountError] = useState<string | false>(false);
  const [toAssetValue, setToAssetValue] = useState<BaseAsset | null>(null);

  const [slippage, setSlippage] = useState("0.5");

  const { address } = useAccount();
  const { data: balanceFrom } = useBalance({
    address,
    token:
      fromAssetValue?.address === NATIVE_TOKEN.address
        ? undefined
        : fromAssetValue?.address,
    watch: true,
    enabled: !!fromAssetValue,
  });

  const { isWrapUnwrap, isWrap } = useIsWrapUnwrap({
    fromAssetValue,
    toAssetValue,
  });

  const swapReturned = () => {
    setFromAmountValue("");
    setToAmountValue("");
    setFromAmountValueUsd("");
    setToAmountValueUsd("");
    calculateReceiveAmount("", fromAssetValue, toAssetValue);
    removeQuote();
  };

  const { data: tokenPrices } = useTokenPrices();
  const { data: swapAssetsOptions } = useSwapAssets();

  const { mutate: swap, isLoading: loadingSwap } = useSwap(swapReturned);
  const { mutate: wrapOrUnwrap, isLoading: loadingWrapOrUnwrap } =
    useWrapOrUnwrap(swapReturned);

  const loadingTrade = loadingSwap || loadingWrapOrUnwrap;

  const {
    refetch: refetchQuote,
    isFetching: quoteLoading,
    data: quote,
    remove: removeQuote,
  } = useQuote({
    fromAssetValue,
    toAssetValue,
    fromAmountValue,
    slippage,
    setToAmountValue,
    setToAmountValueUsd,
    loadingTrade,
  });

  useEffect(() => {
    if (
      swapAssetsOptions &&
      swapAssetsOptions.length > 0 &&
      toAssetValue == null
    ) {
      setToAssetValue(swapAssetsOptions[0]);
    }

    if (
      swapAssetsOptions &&
      swapAssetsOptions.length > 0 &&
      fromAssetValue == null
    ) {
      setFromAssetValue(swapAssetsOptions[1]);
    }
  }, [fromAssetValue, swapAssetsOptions, toAssetValue]);

  const usdDiff = usePriceDiff({ fromAmountValueUsd, toAmountValueUsd });
  const priceImpact = usePriceImpact({ fromAssetValue, toAssetValue, quote });

  const onAssetSelect = (type: string, value: BaseAsset) => {
    if (type === "From") {
      let fromAmountValueWithNewDecimals: string | undefined;
      if (
        fromAssetValue &&
        fromAmountValue !== "" &&
        value.decimals < fromAssetValue.decimals
      ) {
        fromAmountValueWithNewDecimals = BigNumber(fromAmountValue).toFixed(
          value.decimals,
          BigNumber.ROUND_DOWN
        );
        setFromAmountValue(fromAmountValueWithNewDecimals);
      }
      if (value.address === toAssetValue?.address) {
        setToAssetValue(fromAssetValue);
        setFromAssetValue(toAssetValue);
        calculateReceiveAmount(
          fromAmountValueWithNewDecimals ?? fromAmountValue,
          toAssetValue,
          fromAssetValue
        );
      } else {
        setFromAssetValue(value);
        calculateReceiveAmount(
          fromAmountValueWithNewDecimals ?? fromAmountValue,
          value,
          toAssetValue
        );
      }
      setFromAmountValueUsd(
        (
          parseFloat(fromAmountValue) *
          (tokenPrices?.get(
            value.address === NATIVE_TOKEN.address
              ? W_NATIVE_ADDRESS.toLowerCase()
              : value.address.toLowerCase()
          ) ?? 0)
        ).toFixed(2)
      );
    } else {
      if (value.address === fromAssetValue?.address) {
        setFromAssetError(false);
        setToAssetValue(fromAssetValue);
        calculateReceiveAmount(fromAmountValue, toAssetValue, fromAssetValue);
      } else {
        setToAssetValue(value);
        calculateReceiveAmount(fromAmountValue, fromAssetValue, value);
      }
    }
  };

  const fromAmountChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFromAmountError(false);
    setFromAmountValue(event.target.value);
    if (event.target.value == "") {
      setToAmountValue("");
      setFromAmountValueUsd("");
      setToAmountValueUsd("");
    } else {
      setFromAmountValueUsd(
        (
          parseFloat(event.target.value) *
          (tokenPrices?.get(
            fromAssetValue?.address === NATIVE_TOKEN.address
              ? W_NATIVE_ADDRESS.toLowerCase()
              : fromAssetValue
              ? fromAssetValue?.address.toLowerCase()
              : ""
          ) ?? 0)
        ).toFixed(2)
      );
      calculateReceiveAmount(event.target.value, fromAssetValue, toAssetValue);
    }
  };

  const onSlippageChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value == "" || !isNaN(+event.target.value)) {
      setSlippage(event.target.value);
    }
  };

  const calculateReceiveAmount = useCallback(
    (amount: string, from: BaseAsset | null, to: BaseAsset | null) => {
      if (
        amount !== "" &&
        !isNaN(+amount) &&
        to !== null &&
        parseFloat(amount) !== 0 &&
        from !== null
      ) {
        const isWrapUnwrap =
          (from?.symbol === W_NATIVE_SYMBOL &&
            to?.symbol === NATIVE_TOKEN.symbol) ||
          (from?.symbol === NATIVE_TOKEN.symbol &&
            to?.symbol === W_NATIVE_SYMBOL)
            ? true
            : false;

        if (isWrapUnwrap) {
          setToAmountValue(amount);
          return;
        }

        refetchQuote();
      }
    },
    [refetchQuote]
  );

  const closeSettings = () => {
    setSettingsOpen(false);
  };

  const prepareTradeCheck = useCallback(() => {
    setFromAmountError(false);
    setFromAssetError(false);

    let error = false;

    if (!fromAmountValue || isNaN(+fromAmountValue)) {
      setFromAmountError("From amount is required");
      error = true;
    } else {
      if (
        fromAssetValue &&
        balanceFrom &&
        BigNumber(fromAmountValue).gt(balanceFrom.formatted)
      ) {
        setFromAmountError(`Greater than your available balance`);
        error = true;
      }
    }

    if (!fromAssetValue) {
      setFromAssetError("From asset is required");
      error = true;
    }

    if (!toAssetValue) {
      setFromAssetError("To asset is required");
      error = true;
    }

    return error;
  }, [balanceFrom, fromAmountValue, fromAssetValue, toAssetValue]);

  const onSwap = () => {
    const error = prepareTradeCheck();
    if (!error) {
      swap({
        quote,
        fromAsset: fromAssetValue,
        toAsset: toAssetValue,
      });
    }
  };

  const onWrapUnwrap = () => {
    const error = prepareTradeCheck();
    if (!error) {
      wrapOrUnwrap({
        fromAsset: fromAssetValue,
        toAsset: toAssetValue,
        fromAmount: fromAmountValue,
      });
    }
  };

  const setBalance100 = useCallback(() => {
    if (!fromAssetValue || fromAssetValue.balance === null) return;
    const am = balanceFrom
      ? formatUnits(balanceFrom.value, balanceFrom.decimals)
      : BigNumber(fromAssetValue.balance).toString();
    setFromAmountValue(am);
    setFromAmountValueUsd(
      (
        parseFloat(am) *
        (tokenPrices?.get(
          fromAssetValue?.address === NATIVE_TOKEN.address
            ? W_NATIVE_ADDRESS.toLowerCase()
            : fromAssetValue
            ? fromAssetValue.address.toLowerCase()
            : ""
        ) ?? 0)
      ).toFixed(2)
    );
    calculateReceiveAmount(am, fromAssetValue, toAssetValue);
  }, [
    balanceFrom,
    fromAssetValue,
    toAssetValue,
    tokenPrices,
    calculateReceiveAmount,
  ]);

  const swapAssets = () => {
    let fromAmountValueWithNewDecimals: string | undefined;
    const fa = fromAssetValue;
    const ta = toAssetValue;
    if (!fa || !ta) return;
    if (fromAmountValue !== "" && ta.decimals < fa.decimals) {
      fromAmountValueWithNewDecimals = BigNumber(fromAmountValue).toFixed(
        ta.decimals,
        BigNumber.ROUND_DOWN
      );
      setFromAmountValue(fromAmountValueWithNewDecimals);
    }
    setFromAssetValue(ta);
    setToAssetValue(fa);
    setFromAmountValueUsd(
      (
        parseFloat(fromAmountValue) *
        (tokenPrices?.get(
          ta.address === NATIVE_TOKEN.address
            ? W_NATIVE_ADDRESS.toLowerCase()
            : ta.address.toLowerCase()
        ) ?? 0)
      ).toFixed(2)
    );
    calculateReceiveAmount(
      fromAmountValueWithNewDecimals ?? fromAmountValue,
      ta,
      fa
    );
  };

  const renderSwapInformation = () => {
    if (quoteLoading) {
      return (
        <div className="flex min-h-full items-center justify-center text-primary">
          <CircularProgress size={20} className="ml-2" color="inherit" />
        </div>
      );
    }

    if (!quote) {
      return (
        <div className="mt-3 flex w-full flex-wrap items-center rounded-[10px] p-3">
          <Typography className="w-full border-b border-solid border-[rgba(126,153,176,0.2)] pb-[6px] text-sm font-bold text-primary">
            Price Info
          </Typography>
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center py-6 px-0">
              <Typography className="pb-[6px] text-sm font-bold">
                {isWrapUnwrap ? "1.00" : "0.00"}
              </Typography>
              <Typography className="text-xs text-secondary">
                {toAssetValue && fromAssetValue
                  ? `${fromAssetValue?.symbol} per ${toAssetValue?.symbol}`
                  : "-"}
              </Typography>
            </div>
            <div className="flex flex-col items-center justify-center py-6 px-0">
              <Typography className="pb-[6px] text-sm font-bold">
                {isWrapUnwrap ? "1.00" : "0.00"}
              </Typography>
              <Typography className="text-xs text-secondary">
                {toAssetValue && fromAssetValue
                  ? `${toAssetValue?.symbol} per ${fromAssetValue?.symbol}`
                  : "-"}
              </Typography>
            </div>
          </div>
          <div className="flex w-full items-center justify-between">
            <div className="text-sm font-bold text-gray-400">Show Routes</div>
          </div>
        </div>
      );
    }
    const totalFromInEth = fromAssetValue
      ? BigNumber(quote.maxReturn.totalFrom).div(10 ** fromAssetValue.decimals)
      : BigNumber(0);
    const totalToInEth = toAssetValue
      ? BigNumber(quote.maxReturn.totalTo).div(10 ** toAssetValue.decimals)
      : BigNumber(0);

    return (
      <div className="mt-3 flex w-full flex-wrap items-center rounded-[10px] p-3">
        <Typography className="w-full border-b border-solid border-[rgba(126,153,176,0.2)] pb-[6px] text-sm font-bold text-primary">
          Price Info
        </Typography>
        <div className="grid w-full grid-cols-2 gap-3">
          <div className="flex flex-col items-center justify-center py-6 px-0">
            <Typography className="pb-[6px] text-sm font-bold">
              {formatCurrency(
                BigNumber(totalFromInEth).div(totalToInEth).toFixed(18)
              )}
            </Typography>
            <Typography className="text-xs text-secondary">{`${fromAssetValue?.symbol} per ${toAssetValue?.symbol}`}</Typography>
          </div>
          <div className="flex flex-col items-center justify-center py-6 px-0">
            <Typography className="pb-[6px] text-sm font-bold">
              {formatCurrency(
                BigNumber(totalToInEth).div(totalFromInEth).toFixed(18)
              )}
            </Typography>
            <Typography className="text-xs text-secondary">{`${toAssetValue?.symbol} per ${fromAssetValue?.symbol}`}</Typography>
          </div>
        </div>
        {((priceImpact !== undefined && priceImpact < -5) ||
          (parseFloat(fromAmountValueUsd) > 0 &&
            parseFloat(toAmountValueUsd) === 0)) && (
          <>
            <h3 className="w-full border-b border-solid border-[rgba(126,153,176,0.2)] pb-[6px] text-sm font-bold text-warning">
              Warning
            </h3>
            <div className="grid w-full grid-cols-1">
              <div className="flex flex-col items-center justify-center py-6 px-0 text-sm text-warning">
                Potential low liquidity swap!{" "}
                {priceImpact !== undefined
                  ? `Price difference is ${priceImpact.toFixed()}%`
                  : "Double check Price Info above"}
              </div>
            </div>
          </>
        )}
        {priceImpact === undefined &&
          ((usdDiff && parseFloat(usdDiff) < -5) ||
            (parseFloat(fromAmountValueUsd) > 0 &&
              parseFloat(toAmountValueUsd) === 0)) && (
            <>
              <h3 className="w-full border-b border-solid border-[rgba(126,153,176,0.2)] pb-[6px] text-sm font-bold text-warning">
                Warning
              </h3>
              <div className="grid w-full grid-cols-1">
                <div className="flex flex-col items-center justify-center py-6 px-0 text-sm text-warning">
                  Potential low liquidity swap!{" "}
                  {usdDiff !== ""
                    ? `Price difference is ${usdDiff}%`
                    : "Double check Price Info above"}
                </div>
              </div>
            </>
          )}
        <div
          className="flex w-full cursor-pointer items-center justify-between"
          onClick={() => setRoutesOpen(true)}
        >
          <div className="text-sm font-bold text-primary underline transition-all hover:text-green-300 hover:no-underline">
            Show Routes
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-32 flex h-full min-h-[calc(100vh-432px)] w-full flex-col items-center justify-evenly sm:mt-0 lg:flex-row">
      <Paper
        elevation={0}
        className="flex w-full max-w-[485px] flex-col bg-transparent p-3 shadow-glow backdrop-blur-sm lg:p-6"
      >
        <div className="relative flex w-full flex-col">
          <div
            className={`${
              !settingsOpen
                ? "hidden"
                : "absolute z-20 flex h-full w-full flex-col gap-4 bg-background p-4"
            }`}
          >
            <div
              onClick={closeSettings}
              className="w-full cursor-pointer text-end"
            >
              <CloseOutlined />
            </div>
            <SmallInput
              amountValue={slippage}
              amountChanged={onSlippageChanged}
              loading={loadingTrade}
            />
          </div>
          <div className="mb-4 flex items-center justify-end space-x-2">
            <button onClick={() => refetchQuote()}>
              <UpdateOutlined className="fill-gray-300 transition-all hover:scale-105 hover:fill-primary" />
            </button>
            <button onClick={() => setSettingsOpen(true)}>
              <SettingsOutlined className="fill-gray-300 transition-all hover:scale-105 hover:fill-primary" />
            </button>
          </div>
          <MassiveInput
            type="From"
            amountValue={fromAmountValue}
            amountValueUsd={fromAmountValueUsd}
            diffUsd={usdDiff}
            amountError={fromAmountError}
            amountChanged={fromAmountChanged}
            assetValue={fromAssetValue}
            assetError={fromAssetError}
            assetOptions={swapAssetsOptions}
            onAssetSelect={onAssetSelect}
            loading={loadingTrade}
            setBalance100={setBalance100}
          />
          <div className="flex h-0 w-full items-center justify-center">
            <div className="z-[1] h-9 rounded-lg bg-[#161b2c]">
              <ArrowDownward
                className="m-1 cursor-pointer rounded-md p-[6px] text-3xl"
                onClick={swapAssets}
              />
            </div>
          </div>
          <MassiveInput
            type="To"
            amountValue={toAmountValue}
            amountValueUsd={toAmountValueUsd}
            diffUsd={usdDiff}
            amountError={toAmountError}
            assetValue={toAssetValue}
            assetError={false}
            assetOptions={swapAssetsOptions}
            onAssetSelect={onAssetSelect}
            loading={loadingTrade}
            setBalance100={setBalance100}
          />
          <div className="flex min-h-[176px] flex-col items-center justify-center">
            {renderSwapInformation()}
          </div>
          <div className="mt-3 grid w-full grid-cols-[1fr] gap-3 py-0">
            <Button
              variant="contained"
              size="large"
              color="primary"
              className="bg-background font-bold text-primary hover:bg-green-900"
              disabled={
                loadingTrade || quoteLoading || (!quote && !isWrapUnwrap)
              }
              onClick={!isWrapUnwrap ? onSwap : onWrapUnwrap}
            >
              <Typography className="font-bold capitalize">
                {loadingTrade
                  ? `Loading`
                  : isWrapUnwrap
                  ? isWrap
                    ? "Wrap"
                    : "Unwrap"
                  : `Swap`}
              </Typography>
              {loadingTrade && (
                <CircularProgress size={10} className="ml-2 fill-white" />
              )}
            </Button>
          </div>
          <div className="mt-2 text-end text-xs">
            <span className="align-middle text-secondary">Powered by </span>
            <a
              href="https://firebird.finance/"
              target="_blank"
              rel="noreferrer noopener"
              className="cursor-pointer grayscale transition-all hover:text-[#f66432] hover:grayscale-0"
            >
              <img
                src="/images/logo-firebird.svg"
                className="inline"
                alt="firebird protocol logo"
              />{" "}
              <span className="align-middle">Firebird</span>
            </a>
          </div>
        </div>
        <RoutesDialog
          onClose={() => setRoutesOpen(false)}
          open={routesOpen}
          quote={quote}
          fromAssetValue={fromAssetValue}
          fromAmountValue={fromAmountValue}
          toAssetValue={toAssetValue}
          toAmountValue={toAmountValue}
        />
      </Paper>
    </div>
  );
}

export default Swap;
