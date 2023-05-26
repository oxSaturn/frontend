import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  TextField,
  Typography,
  InputAdornment,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  ArrowDownward,
  UpdateOutlined,
  SettingsOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import BigNumber from "bignumber.js";

import { formatCurrency } from "../../utils/utils";
import {
  NATIVE_TOKEN,
  QUERY_KEYS,
  W_NATIVE_ADDRESS,
} from "../../stores/constants/constants";
import type { BaseAsset } from "../../stores/types/types";
import { useTokenPrices } from "../header/queries";

import { quoteSwap, useSwapAssets } from "./queries";
import { useSwap, useWrapOrUnwrap } from "./mutations";
import { AssetSelect } from "./select";
import { RoutesDialog } from "./routes";
import { usePriceDiff } from "./lib/usePriceDiff";
import { useIsWrapUnwrap } from "./lib/useIsWrapUnwrap";

function Setup() {
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

  const [slippage, setSlippage] = useState("2");

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
  const loading = loadingSwap || loadingWrapOrUnwrap;
  const { address } = useAccount();

  const {
    refetch: refetchQuote,
    isFetching: quoteLoading,
    data: quote,
    remove: removeQuote,
  } = useQuery({
    queryKey: [
      QUERY_KEYS.QUOTE_SWAP,
      address,
      fromAssetValue,
      toAssetValue,
      fromAmountValue,
      slippage,
    ],
    queryFn: () =>
      quoteSwap(address, {
        fromAsset: fromAssetValue,
        toAsset: toAssetValue,
        fromAmount: fromAmountValue,
        slippage,
      }),
    enabled:
      !!fromAssetValue &&
      !!toAssetValue &&
      fromAmountValue !== "" &&
      !isWrapUnwrap,
    onError: () => {
      setToAmountValue("");
      setToAmountValueUsd("");
    },
    onSuccess: (firebirdQuote) => {
      if (!fromAssetValue || !toAssetValue) {
        setToAmountValue("");
        setToAmountValueUsd("");
        return;
      }
      if (
        firebirdQuote.encodedData &&
        firebirdQuote.maxReturn &&
        firebirdQuote.maxReturn.totalFrom ===
          BigNumber(fromAmountValue)
            .multipliedBy(10 ** fromAssetValue.decimals)
            .toFixed(0) &&
        (firebirdQuote.maxReturn.from.toLowerCase() ===
          fromAssetValue.address.toLowerCase() ||
          (firebirdQuote.maxReturn.from ===
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" &&
            fromAssetValue.address === NATIVE_TOKEN.address)) &&
        (firebirdQuote.maxReturn.to.toLowerCase() ===
          toAssetValue.address.toLowerCase() ||
          (firebirdQuote.maxReturn.to ===
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" &&
            toAssetValue.address === NATIVE_TOKEN.address))
      ) {
        if (BigNumber(firebirdQuote.maxReturn.totalTo).eq(0)) {
          setToAmountValue("");
          setToAmountValueUsd("");
          return;
        }

        setToAmountValue(
          BigNumber(firebirdQuote.maxReturn.totalTo)
            .div(10 ** toAssetValue.decimals)
            .toFixed(toAssetValue.decimals, BigNumber.ROUND_DOWN)
        );
        const toAddressLookUp =
          firebirdQuote.maxReturn.to ===
          "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
            ? W_NATIVE_ADDRESS.toLowerCase()
            : firebirdQuote.maxReturn.to.toLowerCase();
        const toUsdValue = BigNumber(firebirdQuote.maxReturn.totalTo)
          .div(10 ** toAssetValue.decimals)
          .multipliedBy(tokenPrices?.get(toAddressLookUp) ?? 0)
          .toFixed(2);
        setToAmountValueUsd(toUsdValue);
      }
    },
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
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

  const toAmountChanged = () => {};

  const onSlippageChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value == "" || !isNaN(+event.target.value)) {
      setSlippage(event.target.value);
    }
  };

  const calculateReceiveAmount = (
    amount: string,
    from: BaseAsset | null,
    to: BaseAsset | null
  ) => {
    if (
      amount !== "" &&
      !isNaN(+amount) &&
      to !== null &&
      parseFloat(amount) !== 0 &&
      from !== null
    ) {
      const isWrapUnwrap =
        (from?.symbol === "WCANTO" && to?.symbol === "CANTO") ||
        (from?.symbol === "CANTO" && to?.symbol === "WCANTO") ||
        (from?.symbol === "CANTO" && to?.symbol === "CANTOE") ||
        (from?.symbol === "CANTOE" && to?.symbol === "CANTO")
          ? true
          : false;

      if (isWrapUnwrap) {
        setToAmountValue(amount);
        return;
      }

      refetchQuote();
    }
  };

  const closeSettings = () => {
    setSettingsOpen(false);
  };

  const onSwap = () => {
    setFromAmountError(false);
    setFromAssetError(false);

    let error = false;

    if (!fromAmountValue || fromAmountValue === "" || isNaN(+fromAmountValue)) {
      setFromAmountError("From amount is required");
      error = true;
    } else {
      if (
        !fromAssetValue?.balance ||
        isNaN(+fromAssetValue?.balance) || // TODO probably dont neet it
        BigNumber(fromAssetValue?.balance).lte(0)
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
      swap({
        quote,
        fromAsset: fromAssetValue,
        toAsset: toAssetValue,
      });
    }
  };

  const onWrapUnwrap = () => {
    setFromAmountError(false);
    setFromAssetError(false);

    let error = false;

    if (!fromAmountValue || fromAmountValue === "" || isNaN(+fromAmountValue)) {
      setFromAmountError("From amount is required");
      error = true;
    } else {
      if (
        !fromAssetValue?.balance ||
        isNaN(+fromAssetValue?.balance) || // TODO probably dont neet it
        BigNumber(fromAssetValue?.balance).lte(0)
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
      wrapOrUnwrap({
        fromAsset: fromAssetValue,
        toAsset: toAssetValue,
        fromAmount: fromAmountValue,
      });
    }
  };

  const setBalance100 = () => {
    if (!fromAssetValue || fromAssetValue.balance === null) return;
    const am = BigNumber(fromAssetValue.balance).toString();
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
  };

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
        <div className="flex min-h-full items-center justify-center text-cantoGreen">
          <CircularProgress size={20} className="ml-2" color="inherit" />
        </div>
      );
    }

    if (!quote) {
      return (
        <div className="mt-3 flex w-full flex-wrap items-center rounded-[10px] p-3">
          <Typography className="w-full border-b border-solid border-[rgba(126,153,176,0.2)] pb-[6px] text-sm font-bold text-cantoGreen">
            Price Info
          </Typography>
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center py-6 px-0">
              <Typography className="pb-[6px] text-sm font-bold">
                {isWrapUnwrap ? "1.00" : "0.00"}
              </Typography>
              <Typography className="text-xs text-secondaryGray">
                {toAssetValue && fromAssetValue
                  ? `${fromAssetValue?.symbol} per ${toAssetValue?.symbol}`
                  : "-"}
              </Typography>
            </div>
            <div className="flex flex-col items-center justify-center py-6 px-0">
              <Typography className="pb-[6px] text-sm font-bold">
                {isWrapUnwrap ? "1.00" : "0.00"}
              </Typography>
              <Typography className="text-xs text-secondaryGray">
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
        <Typography className="w-full border-b border-solid border-[rgba(126,153,176,0.2)] pb-[6px] text-sm font-bold text-cantoGreen">
          Price Info
        </Typography>
        <div className="grid w-full grid-cols-2 gap-3">
          <div className="flex flex-col items-center justify-center py-6 px-0">
            <Typography className="pb-[6px] text-sm font-bold">
              {formatCurrency(
                BigNumber(totalFromInEth).div(totalToInEth).toFixed(18)
              )}
            </Typography>
            <Typography className="text-xs text-secondaryGray">{`${fromAssetValue?.symbol} per ${toAssetValue?.symbol}`}</Typography>
          </div>
          <div className="flex flex-col items-center justify-center py-6 px-0">
            <Typography className="pb-[6px] text-sm font-bold">
              {formatCurrency(
                BigNumber(totalToInEth).div(totalFromInEth).toFixed(18)
              )}
            </Typography>
            <Typography className="text-xs text-secondaryGray">{`${toAssetValue?.symbol} per ${fromAssetValue?.symbol}`}</Typography>
          </div>
        </div>
        {((usdDiff && Math.abs(parseFloat(usdDiff)) > 10) ||
          (parseFloat(fromAmountValueUsd) > 0 &&
            parseFloat(toAmountValueUsd) === 0)) && (
          <>
            <Typography className="w-full border-b border-solid border-[rgba(126,153,176,0.2)] pb-[6px] text-sm font-bold text-red-500">
              Warning
            </Typography>
            <div className="grid w-full grid-cols-1">
              <div className="flex flex-col items-center justify-center py-6 px-0 text-sm font-bold text-red-500">
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
          <div className="text-sm font-bold text-cantoGreen underline transition-all hover:text-green-300 hover:no-underline">
            Show Routes
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
              : "absolute z-20 flex h-full w-full flex-col gap-4 bg-deepPurple p-4"
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
            loading={loading}
          />
        </div>
        <div className="mb-4 flex items-center justify-end space-x-2">
          <button onClick={() => refetchQuote()}>
            <UpdateOutlined className="fill-gray-300 transition-all hover:scale-105 hover:fill-cantoGreen" />
          </button>
          <button onClick={() => setSettingsOpen(true)}>
            <SettingsOutlined className="fill-gray-300 transition-all hover:scale-105 hover:fill-cantoGreen" />
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
          loading={loading}
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
          amountChanged={toAmountChanged}
          assetValue={toAssetValue}
          assetError={false}
          assetOptions={swapAssetsOptions}
          onAssetSelect={onAssetSelect}
          loading={loading}
          setBalance100={setBalance100}
        />
        <div className="flex min-h-[176px] flex-col items-center justify-center">
          {renderSwapInformation()}
        </div>
        <div className="mt-3 grid h-full w-full grid-cols-[1fr] gap-3 py-0">
          <Button
            variant="contained"
            size="large"
            color="primary"
            className="bg-primaryBg font-bold text-cantoGreen hover:bg-green-900"
            disabled={loading || quoteLoading || (!quote && !isWrapUnwrap)}
            onClick={!isWrapUnwrap ? onSwap : onWrapUnwrap}
          >
            <Typography className="font-bold capitalize">
              {loading
                ? `Loading`
                : isWrapUnwrap
                ? isWrap
                  ? "Wrap"
                  : "Unwrap"
                : `Swap`}
            </Typography>
            {loading && (
              <CircularProgress size={10} className="ml-2 fill-white" />
            )}
          </Button>
        </div>
        <div className="mt-2 text-end text-xs">
          <span className="align-middle text-secondaryGray">Powered by </span>
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
        paths={quote?.maxReturn.paths}
        tokens={quote?.maxReturn.tokens}
        fromAssetValue={fromAssetValue}
        fromAmountValue={fromAmountValue}
        toAssetValue={toAssetValue}
        toAmountValue={toAmountValue}
      />
    </>
  );
}

const SmallInput = ({
  amountValue,
  amountChanged,
  loading,
}: {
  amountValue: string;
  amountChanged: (_event: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}) => {
  return (
    <div className="mb-1">
      <label htmlFor="slippage">Slippage</label>
      <div className="flex w-full max-w-[72px] flex-wrap items-center rounded-[10px] bg-primaryBg">
        <TextField
          id="slippage"
          placeholder="0.00"
          fullWidth
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

const MassiveInput = ({
  type,
  amountValue,
  amountValueUsd,
  diffUsd,
  amountError,
  amountChanged,
  assetValue,
  assetError,
  assetOptions,
  onAssetSelect,
  loading,
  setBalance100,
}: {
  type: string;
  amountValue: string;
  amountValueUsd: string;
  diffUsd: string | undefined;
  amountError: string | false;
  amountChanged: (_event: React.ChangeEvent<HTMLInputElement>) => void;
  assetValue: BaseAsset | null;
  assetError: string | false;
  assetOptions: BaseAsset[] | undefined;
  onAssetSelect: (_type: string, _value: BaseAsset) => void;
  loading: boolean;
  setBalance100: () => void;
}) => {
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
        <Typography className="text-xs font-thin text-secondaryGray" noWrap>
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
          <Typography className="text-xs font-thin text-secondaryGray" noWrap>
            {"~$" +
              formatCurrency(amountValueUsd) +
              (type === "To" && diffUsd && diffUsd !== ""
                ? ` (${diffUsd}%)`
                : "")}
          </Typography>
        </div>
      ) : null}
      <div
        className={`flex w-full flex-wrap items-center rounded-[10px] bg-primaryBg ${
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

export default Setup;
