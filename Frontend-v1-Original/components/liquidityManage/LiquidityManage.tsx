import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useRouter } from "next/router";
import {
  Paper,
  Grid,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
  IconButton,
  MenuItem,
  Dialog,
} from "@mui/material";
import {
  Add,
  ArrowDownward,
  ArrowBack,
  Search,
  DeleteOutline,
} from "@mui/icons-material";
import BigNumber from "bignumber.js";
import { isAddress } from "viem";

import { ETHERSCAN_URL, NATIVE_TOKEN } from "../../stores/constants/constants";
import { formatCurrency } from "../../utils/utils";
import {
  BaseAsset,
  hasGauge,
  isBaseAsset,
  Pair,
} from "../../stores/types/types";
import { useBaseAssetWithInfo } from "../../lib/global/queries";
import {
  useAddLocalAsset,
  useRemoveLocalAsset,
} from "../../lib/global/mutations";
import { SmallInput } from "../common/smallInput";

import {
  useGetPair,
  usePairsWithGaugesOnlyWithBalance,
  useQuoteAddLiquidity,
  useQuoteRemoveLiquidity,
} from "./lib/queries";
import { useAmounts } from "./lib/useAmounts";
import {
  useAddLiquidity,
  useAddLiquidityAndStake,
  useCreateGauge,
  useRemoveLiquidity,
  useStakeLiquidity,
  useUnstakeAndRemoveLiquidity,
  useUnstakeLiquidity,
} from "./lib/mutations";

export default function LiquidityManage() {
  const router = useRouter();
  const amount0Ref = useRef<HTMLInputElement>(null);
  const amount1Ref = useRef<HTMLInputElement>(null);

  const { amount0, amount1, setAmount0, setAmount1, setActiveInput } =
    useAmounts();
  const [amount0Error, setAmount0Error] = useState<string | false>(false);
  const [amount1Error, setAmount1Error] = useState<string | false>(false);

  const [stable, setStable] = useState(false);

  const [asset0, setAsset0] = useState<BaseAsset | null>(null);
  const [asset1, setAsset1] = useState<BaseAsset | null>(null);

  const [withdrawAsset, setWithdrawAsset] = useState<Pair | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAmountError, setWithdrawAmountError] = useState<
    string | false
  >(false);

  const [activeTab, setActiveTab] = useState("deposit");

  const [slippage, setSlippage] = useState("2");

  const { data: withdrawAssetOptions } = usePairsWithGaugesOnlyWithBalance();

  const { data: assetOptions } = useBaseAssetWithInfo();

  const { data: pair, isFetching: isLoadingPair } = useGetPair(
    router.query.address
  );

  const { data: quote, remove: removeQuote } = useQuoteAddLiquidity(
    router.query.address
  );

  const { data: withdrawQuote, remove: removeWithdrawQuote } =
    useQuoteRemoveLiquidity(withdrawAmount, router.query.address);

  const onLoadActionSuccess = useCallback(() => {
    setAmount0("");
    setAmount1("");
    removeQuote();
    router.push("/liquidity");
  }, [removeQuote, router, setAmount0, setAmount1]);

  const onUnloadActionSuccess = useCallback(() => {
    setAmount0("");
    setAmount1("");
    setWithdrawAmount("");
    removeWithdrawQuote();
    router.push("/liquidity");
  }, [removeWithdrawQuote, router, setAmount0, setAmount1]);

  const { mutate: addLiquidity, isLoading: isAddLiqLoading } =
    useAddLiquidity(onLoadActionSuccess);

  const { mutate: stakeLiquidity, isLoading: isStakeLiqLoading } =
    useStakeLiquidity(onLoadActionSuccess);

  const { mutate: addLiquidityAndStake, isLoading: isAddLiqAndStakeLoading } =
    useAddLiquidityAndStake(onLoadActionSuccess);

  const { mutate: removeLiquidity, isLoading: isRemoveLiqLoading } =
    useRemoveLiquidity(onUnloadActionSuccess);

  const {
    mutate: unstakeAndRemoveLiquidity,
    isLoading: isUnstakeAndRemoveLiqLoading,
  } = useUnstakeAndRemoveLiquidity(onUnloadActionSuccess);

  const { mutate: unstakeLiquidity, isLoading: isUnstakeLiqLoading } =
    useUnstakeLiquidity(onUnloadActionSuccess);

  const { mutate: createGauge, isLoading: isCreateGaugeLoading } =
    useCreateGauge();

  const loading =
    isAddLiqLoading ||
    isStakeLiqLoading ||
    isAddLiqAndStakeLoading ||
    isRemoveLiqLoading ||
    isUnstakeAndRemoveLiqLoading ||
    isUnstakeLiqLoading ||
    isCreateGaugeLoading;

  useEffect(() => {
    if (
      router.query.address &&
      !Array.isArray(router.query.address) &&
      isAddress(router.query.address)
    ) {
      if (pair && isBaseAsset(pair.token0) && isBaseAsset(pair.token1)) {
        setWithdrawAsset(pair);
        setAsset0(pair.token0);
        setAsset1(pair.token1);
        setStable(pair.stable);
      }
    }
  }, [router.query.address, pair]);

  const onBack = useCallback(() => {
    router.push("/liquidity");
  }, [router]);

  const onSlippageChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value == "" || !isNaN(+event.target.value)) {
      setSlippage(event.target.value);
    }
  };

  const setAmountPercent = (input: string, percent: number) => {
    setAmount0Error(false);
    setAmount1Error(false);

    if (!asset0?.balance || !asset1?.balance || !pair) {
      return;
    }

    if (input === "amount0") {
      let am = BigNumber(asset0.balance)
        .times(percent)
        .div(100)
        .toFixed(asset0.decimals);
      handleAmount0Input(am);
      if (!!amount0Ref.current) amount0Ref.current.focus();
    } else if (input === "amount1") {
      let am = BigNumber(asset1.balance)
        .times(percent)
        .div(100)
        .toFixed(asset1.decimals);
      handleAmount1Input(am);
      if (!!amount1Ref.current) amount1Ref.current.focus();
    } else if (input === "withdraw") {
      let am = "";
      if (pair && pair.gauge && pair.gauge.balance) {
        am = BigNumber(pair.gauge.balance).times(percent).div(100).toFixed(18);
        setWithdrawAmount(am);
      } else if (pair.balance) {
        am = BigNumber(pair.balance).times(percent).div(100).toFixed(18);
        setWithdrawAmount(am);
      }
    }
  };

  const onDeposit = () => {
    setAmount0Error(false);
    setAmount1Error(false);

    let error = false;

    if (!amount0 || amount0 === "" || isNaN(+amount0)) {
      setAmount0Error("Amount 0 is required");
      error = true;
    } else {
      if (
        !asset0?.balance ||
        isNaN(+asset0?.balance) ||
        BigNumber(asset0?.balance).lte(0)
      ) {
        setAmount0Error("Invalid balance");
        error = true;
      } else if (BigNumber(amount0).lte(0)) {
        setAmount0Error("Invalid amount");
        error = true;
      } else if (asset0 && BigNumber(amount0).gt(asset0.balance)) {
        setAmount0Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!amount1 || amount1 === "" || isNaN(+amount1)) {
      setAmount1Error("Amount 0 is required");
      error = true;
    } else {
      if (
        !asset1?.balance ||
        isNaN(+asset1?.balance) ||
        BigNumber(asset1?.balance).lte(0)
      ) {
        setAmount1Error("Invalid balance");
        error = true;
      } else if (BigNumber(amount1).lte(0)) {
        setAmount1Error("Invalid amount");
        error = true;
      } else if (asset1 && BigNumber(amount1).gt(asset1.balance)) {
        setAmount1Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!error) {
      addLiquidity({
        token0: asset0,
        token1: asset1,
        amount0: amount0,
        amount1: amount1,
        pair: pair,
        slippage: slippage && slippage != "" ? slippage : "2",
      });
    }
  };

  const onStake = () => {
    setAmount0Error(false);
    setAmount1Error(false);

    let error = false;

    if (!error) {
      stakeLiquidity({ pair });
    }
  };

  const onDepositAndStake = () => {
    setAmount0Error(false);
    setAmount1Error(false);

    let error = false;

    if (!amount0 || amount0 === "" || isNaN(+amount0)) {
      setAmount0Error("Amount 0 is required");
      error = true;
    } else {
      if (
        !asset0?.balance ||
        isNaN(+asset0?.balance) ||
        BigNumber(asset0?.balance).lte(0)
      ) {
        setAmount0Error("Invalid balance");
        error = true;
      } else if (BigNumber(amount0).lte(0)) {
        setAmount0Error("Invalid amount");
        error = true;
      } else if (asset0 && BigNumber(amount0).gt(asset0.balance)) {
        setAmount0Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!amount1 || amount1 === "" || isNaN(+amount1)) {
      setAmount1Error("Amount 0 is required");
      error = true;
    } else {
      if (
        !asset1?.balance ||
        isNaN(+asset1?.balance) ||
        BigNumber(asset1?.balance).lte(0)
      ) {
        setAmount1Error("Invalid balance");
        error = true;
      } else if (BigNumber(amount1).lte(0)) {
        setAmount1Error("Invalid amount");
        error = true;
      } else if (asset1 && BigNumber(amount1).gt(asset1.balance)) {
        setAmount1Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!error) {
      addLiquidityAndStake({
        token0: asset0,
        token1: asset1,
        amount0: amount0,
        amount1: amount1,
        pair: pair,
        slippage: slippage && slippage != "" ? slippage : "2",
        minLiquidity: quote ? quote : "0",
      });
    }
  };

  const onWithdraw = () => {
    setWithdrawAmountError(false);

    let error = false;

    if (!withdrawAsset || withdrawAsset === null) {
      setWithdrawAmountError("Asset is required");
      error = true;
    }

    if (!pair) {
      setWithdrawAmountError("Pair is required");
      error = true;
    }

    if (!error && pair) {
      removeLiquidity({
        pair: pair,
        token0: pair.token0,
        token1: pair.token1,
        slippage: slippage && slippage != "" ? slippage : "2",
      });
    }
  };

  const onUnstakeAndWithdraw = () => {
    setWithdrawAmountError(false);

    let error = false;

    if (!withdrawAmount || withdrawAmount === "" || isNaN(+withdrawAmount)) {
      setWithdrawAmountError("Amount is required");
      error = true;
    } else {
      if (
        withdrawAsset &&
        withdrawAsset.gauge &&
        (!withdrawAsset.gauge.balance ||
          isNaN(+withdrawAsset.gauge.balance) ||
          BigNumber(withdrawAsset.gauge.balance).lte(0))
      ) {
        setWithdrawAmountError("Invalid balance");
        error = true;
      } else if (BigNumber(withdrawAmount).lte(0)) {
        setWithdrawAmountError("Invalid amount");
        error = true;
      } else if (
        withdrawAsset &&
        withdrawAsset.gauge?.balance &&
        BigNumber(withdrawAmount).gt(withdrawAsset.gauge.balance)
      ) {
        setWithdrawAmountError(`Greater than your available balance`);
        error = true;
      }
    }

    if (!withdrawAsset || withdrawAsset === null) {
      setWithdrawAmountError("From asset is required");
      error = true;
    }
    if (!pair) {
      setWithdrawAmountError("Pair is not selected");
      error = true;
    }

    if (!error && pair && hasGauge(pair)) {
      unstakeAndRemoveLiquidity({
        pair: pair,
        token0: pair.token0,
        token1: pair.token1,
        amount: withdrawAmount,
        amount0: withdrawQuote?.amount0,
        amount1: withdrawQuote?.amount1,
        slippage: slippage && slippage != "" ? slippage : "2",
      });
    }
  };

  const onUnstake = () => {
    if (!pair || !hasGauge(pair)) return;
    unstakeLiquidity({
      amount: withdrawAmount,
      pair,
    });
  };

  const onCreateGauge = () => {
    createGauge(pair);
  };

  const toggleDeposit = () => {
    if (loading) return;
    setActiveTab("deposit");
  };

  const toggleWithdraw = () => {
    if (loading) return;
    setActiveTab("withdraw");
  };

  const handleAmount0Input = (input: string) => {
    if (!pair || !pair.token0 || !pair.token1) {
      return setAmount0(input);
    }

    const { token0, token1 } = pair;

    let invert = false;

    let addy0 = token0.address;
    let addy1 = token1.address;
    if (token0.address === NATIVE_TOKEN.address) {
      // @ts-expect-error workaround for NativeToken
      addy0 = W_NATIVE_ADDRESS;
    }
    if (token1.address === NATIVE_TOKEN.address) {
      // @ts-expect-error workaround for NativeToken
      addy1 = W_NATIVE_ADDRESS;
    }

    if (
      addy1.toLowerCase() === pair.token0.address.toLowerCase() &&
      addy0.toLowerCase() === pair.token1.address.toLowerCase()
    ) {
      invert = true;
    }

    if (input === "") {
      setAmount0("");
      setAmount1("");
      return;
    }
    setAmount0(input);

    let newAmount1: string;
    if (invert) {
      newAmount1 = BigNumber(input)
        .times(pair.reserve0)
        .div(pair.reserve1)
        .toFixed(pair.token0.decimals);
    } else {
      newAmount1 = BigNumber(input)
        .times(pair.reserve1)
        .div(pair.reserve0)
        .toFixed(pair.token1.decimals);
    }
    setAmount1(newAmount1);
  };

  const amount0Changed = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount0Error(false);
    handleAmount0Input(event.target.value);
  };

  const handleAmount1Input = (input: string) => {
    if (!pair || !pair.token0 || !pair.token1) {
      return setAmount1(input);
    }

    const { token0, token1 } = pair;

    let invert = false;

    let addy0 = token0.address;
    let addy1 = token1.address;
    if (token0.address === NATIVE_TOKEN.address) {
      // @ts-expect-error workaround for NativeToken
      addy0 = W_NATIVE_ADDRESS;
    }
    if (token1.address === NATIVE_TOKEN.address) {
      // @ts-expect-error workaround for NativeToken
      addy1 = W_NATIVE_ADDRESS;
    }

    if (
      addy1.toLowerCase() === pair.token0.address.toLowerCase() &&
      addy0.toLowerCase() === pair.token1.address.toLowerCase()
    ) {
      invert = true;
    }

    if (input === "") {
      setAmount0("");
      setAmount1("");
      return;
    }
    setAmount1(input);

    let newAmount0: string;
    if (invert) {
      newAmount0 = BigNumber(input)
        .times(pair.reserve1)
        .div(pair.reserve0)
        .toFixed(pair.token1.decimals);
    } else {
      newAmount0 = BigNumber(input)
        .times(pair.reserve0)
        .div(pair.reserve1)
        .toFixed(pair.token0.decimals);
    }
    setAmount0(newAmount0);
  };

  const amount1Changed = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount1Error(false);
    handleAmount1Input(event.target.value);
  };

  const amount0Focused = (_event: React.FocusEvent<HTMLInputElement>) => {
    setActiveInput("0");
  };

  const amount1Focused = (_event: React.FocusEvent<HTMLInputElement>) => {
    setActiveInput("1");
  };

  const onAssetSelect = async (type: string, value: Pair | BaseAsset) => {
    if (type === "amount0" && isBaseAsset(value)) {
      setAsset0(value);
    } else if (type === "amount1" && isBaseAsset(value)) {
      setAsset1(value);
    } else if (type === "withdraw" && !isBaseAsset(value)) {
      setWithdrawAsset(value);
    }
  };

  const setStab = async (val: boolean) => {
    setStable(val);
  };

  const withdrawAmountChanged = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setWithdrawAmountError(false);
    setWithdrawAmount(event.target.value);
    if (event.target.value === "") {
      removeQuote();
    }
  };

  const renderMediumInput = (
    value: string | undefined,
    logo: string | null | undefined,
    symbol: string | undefined
  ) => {
    return (
      <div className="relative mb-1">
        <div className="flex min-h-[50px] w-full flex-wrap items-center rounded-[10px] bg-background">
          <div className="w-20">
            <div className="h-20 p-3">
              <div className="relative w-12">
                {logo && (
                  <img
                    className="rounded-[50px] border border-[rgba(128,128,128,0.5)] bg-[#032523] p-1"
                    alt=""
                    src={logo}
                    height="50px"
                    onError={(e) => {
                      (e.target as HTMLImageElement).onerror = null;
                      (e.target as HTMLImageElement).src =
                        "/tokens/unknown-logo.png";
                    }}
                  />
                )}
                {!logo && (
                  <img
                    className="rounded-[50px] border border-[rgba(128,128,128,0.5)] bg-[#032523] p-1"
                    alt=""
                    src={"/tokens/unknown-logo.png"}
                    height="50px"
                    onError={(e) => {
                      (e.target as HTMLImageElement).onerror = null;
                      (e.target as HTMLImageElement).src =
                        "/tokens/unknown-logo.png";
                    }}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="h-full flex-[1] p-1 pl-0">
            <TextField
              placeholder="0.00"
              fullWidth
              value={value}
              disabled={true}
              InputProps={{
                style: { fontSize: "32px !important" },
              }}
            />
            <Typography color="textSecondary" className="mb-1 -mt-1 text-xs">
              {symbol}
            </Typography>
          </div>
        </div>
      </div>
    );
  };

  const renderMassiveInput = (
    type: string,
    amountValue: string,
    amountError: string | false,
    amountChanged: (_event: React.ChangeEvent<HTMLInputElement>) => void,
    assetValue: BaseAsset | Pair | null,
    assetOptions: BaseAsset[] | Pair[] | undefined,
    onAssetSelect: (_type: string, _asset: BaseAsset) => void,
    onFocus: React.FocusEventHandler<
      HTMLTextAreaElement | HTMLInputElement
    > | null,
    inputRef: React.RefObject<HTMLInputElement> | null
  ) => {
    return (
      <div className="relative mb-1">
        <div className="absolute top-2 flex w-full items-center justify-end">
          <div className="z-[4] flex cursor-pointer justify-end pr-3 pb-[6px]">
            {type !== "withdraw" && (
              <Typography
                className="text-xs font-thin text-secondary"
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
            )}
            {type === "withdraw" && !isBaseAsset(assetValue) && (
              <Typography
                className="text-xs font-thin text-secondary"
                noWrap
                onClick={() => {
                  setAmountPercent(type, 100);
                }}
              >
                Balance:
                {assetValue && assetValue.gauge && assetValue.gauge.balance
                  ? " " + formatCurrency(assetValue.gauge.balance)
                  : assetValue && assetValue.balance
                  ? " " + formatCurrency(assetValue.balance)
                  : "0.00"}
              </Typography>
            )}
          </div>
        </div>
        <div
          className={`flex w-full flex-wrap items-center rounded-[10px] bg-background ${
            amountError && "border border-red-500"
          }`}
        >
          <div className="h-full min-h-[128px] w-32">
            <AssetSelect
              type={type}
              value={assetValue}
              assetOptions={assetOptions}
              onSelect={onAssetSelect}
              disabled={true}
            />
          </div>
          <div className="h-full flex-[1] flex-grow-[0.98]">
            <TextField
              inputRef={inputRef}
              placeholder="0.00"
              fullWidth
              error={!!amountError}
              helperText={amountError}
              value={amountValue}
              onChange={amountChanged}
              disabled={isCreateGaugeLoading}
              onFocus={onFocus ? onFocus : undefined}
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

  const renderDepositInformation = () => {
    if (!pair) {
      return (
        <div className="mt-3 flex w-full flex-wrap items-center rounded-[10px] p-3">
          <Typography className="w-full border-b border-solid border-[rgba(126,153,176,0.2)] pb-[6px] text-sm font-bold text-primary">
            Starting Liquidity Info
          </Typography>
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center py-6 px-0">
              <Typography className="pb-[6px] text-sm font-bold">
                {BigNumber(amount1).gt(0)
                  ? formatCurrency(BigNumber(amount0).div(amount1))
                  : "0.00"}
              </Typography>
              <Typography className="text-xs text-secondary">{`${asset0?.symbol} per ${asset1?.symbol}`}</Typography>
            </div>
            <div className="flex flex-col items-center justify-center py-6 px-0">
              <Typography className="pb-[6px] text-sm font-bold">
                {BigNumber(amount0).gt(0)
                  ? formatCurrency(BigNumber(amount1).div(amount0))
                  : "0.00"}
              </Typography>
              <Typography className="text-xs text-secondary">{`${asset1?.symbol} per ${asset0?.symbol}`}</Typography>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="mt-3 flex w-full flex-wrap items-center rounded-[10px] p-3">
          <Typography className="w-full border-b border-solid border-[rgba(126,153,176,0.2)] pb-[6px] text-sm font-bold text-primary">
            Reserve Info
          </Typography>
          <div className="grid w-full grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center py-6 px-0">
              <Typography className="pb-[6px] text-sm font-bold">
                {formatCurrency(pair?.reserve0)}
              </Typography>
              <Typography className="text-xs text-secondary">{`${pair?.token0?.symbol}`}</Typography>
            </div>
            <div className="flex flex-col items-center justify-center py-6 px-0">
              <Typography className="pb-[6px] text-sm font-bold">
                {formatCurrency(pair?.reserve1)}
              </Typography>
              <Typography className="text-xs text-secondary">{`${pair?.token1?.symbol}`}</Typography>
            </div>
            <div className="flex flex-col items-center justify-center py-6 px-0">
              <SmallInput
                amountValue={slippage}
                amountChanged={onSlippageChanged}
                loading={loading}
              />
            </div>
          </div>
          <Typography className="w-full border-b border-solid border-[rgba(126,153,176,0.2)] pb-[6px] text-sm font-bold text-primary">
            Your Balances
          </Typography>
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center py-6 px-0">
              <Typography className="pb-[6px] text-sm font-bold">
                {formatCurrency(pair?.balance)}
              </Typography>
              <Typography className="text-xs text-secondary">{`Pooled ${pair?.symbol}`}</Typography>
            </div>
            <div className="flex flex-col items-center justify-center py-6 px-0">
              <Typography className="pb-[6px] text-sm font-bold">
                {formatCurrency(pair?.gauge?.balance)}
              </Typography>
              <Typography className="text-xs text-secondary">{`Staked ${pair?.symbol} `}</Typography>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderWithdrawInformation = () => {
    return (
      <div className="mt-2 flex w-full flex-wrap items-center rounded-[10px] p-3">
        <Typography className="w-full border-b border-solid border-[rgba(126,153,176,0.2)] pb-[6px] text-sm font-bold text-primary">
          Reserve Info
        </Typography>
        <div className="grid w-full grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center py-6 px-0">
            <Typography className="pb-[6px] text-sm font-bold">
              {formatCurrency(pair?.reserve0)}
            </Typography>
            <Typography className="text-xs text-secondary">{`${pair?.token0?.symbol}`}</Typography>
          </div>
          <div className="flex flex-col items-center justify-center py-6 px-0">
            <Typography className="pb-[6px] text-sm font-bold">
              {formatCurrency(pair?.reserve1)}
            </Typography>
            <Typography className="text-xs text-secondary">{`${pair?.token1?.symbol}`}</Typography>
          </div>
          <div className="flex flex-col items-center justify-center py-6 px-0">
            <SmallInput
              amountValue={slippage}
              amountChanged={onSlippageChanged}
              loading={loading}
            />
          </div>
        </div>
        <Typography className="w-full border-b border-solid border-[rgba(126,153,176,0.2)] pb-[6px] text-sm font-bold text-primary">
          Your Balances
        </Typography>
        <div className="grid w-full grid-cols-2 gap-3">
          <div className="flex flex-col items-center justify-center py-6 px-0">
            <Typography className="pb-[6px] text-sm font-bold">
              {formatCurrency(pair?.balance)}
            </Typography>
            <Typography className="text-xs text-secondary">{`Pooled ${pair?.symbol}`}</Typography>
          </div>
          <div className="flex flex-col items-center justify-center py-6 px-0">
            <Typography className="pb-[6px] text-sm font-bold">
              {formatCurrency(pair?.gauge?.balance)}
            </Typography>
            <Typography className="text-xs text-secondary">{`Staked ${pair?.symbol} `}</Typography>
          </div>
        </div>
        <div className="flex min-h-[100px] items-center justify-center">
          <Typography className="border border-primary bg-[#0e110c] p-6 text-sm font-extralight">
            We are very sad to see you are no longer going with the FLOW
          </Typography>
        </div>
      </div>
    );
  };

  const renderMediumInputToggle = () => {
    return (
      <div className="relative mb-1">
        <div className="flex min-h-[50px] w-full flex-wrap items-center rounded-[10px] bg-background">
          <div className="grid w-full grid-cols-[1fr_1fr] p-1">
            <div
              className={`cursor-pointer rounded-lg p-5 text-secondary hover:bg-[rgb(23,52,72)] hover:text-primary ${
                stable &&
                "border border-primary bg-[rgb(23,52,72)] text-primary"
              }`}
              onClick={() => {
                setStab(true);
              }}
            >
              <Typography className="text-center">Stable</Typography>
            </div>
            <div
              className={`cursor-pointer rounded-lg p-5 text-secondary hover:bg-[rgb(23,52,72)] hover:text-primary ${
                !stable &&
                "border border-primary bg-[rgb(23,52,72)] text-primary"
              }`}
              onClick={() => {
                setStab(false);
              }}
            >
              <Typography className="text-center">Volatile</Typography>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <Paper
        elevation={0}
        className="m-auto mt-0 flex w-[calc(100%-60px)] max-w-[485px] flex-col items-start bg-transparent shadow-glow"
      >
        <div className="flex w-full flex-col rounded-t-lg rounded-r-lg rounded-b-none rounded-l-none text-primary">
          <Grid container spacing={0}>
            <Grid item lg={6} md={6} sm={6} xs={6}>
              <Paper
                className={`cursor-pointer rounded-t-lg rounded-r-none rounded-b-none rounded-l-none border bg-transparent font-medium text-secondary outline-0 ${
                  activeTab === "deposit"
                    ? " border-primary text-white"
                    : "border-transparent hover:bg-[hsla(0,0%,100%,.04)]"
                } flex items-center justify-center py-6`}
                onClick={toggleDeposit}
              >
                <Typography variant="h5">Deposit</Typography>
              </Paper>
            </Grid>
            <Grid item lg={6} md={6} sm={6} xs={6}>
              <Paper
                className={`cursor-pointer rounded-t-lg rounded-r-none rounded-b-none rounded-l-none border bg-transparent font-medium text-secondary outline-0 ${
                  activeTab === "withdraw"
                    ? " border-primary text-white"
                    : "border-transparent hover:bg-[hsla(0,0%,100%,.04)]"
                } flex items-center justify-center py-6`}
                onClick={toggleWithdraw}
              >
                <Typography variant="h5">Withdraw</Typography>
              </Paper>
            </Grid>
          </Grid>
        </div>
        <div className="relative mt-5 mr-6 mb-0 ml-6 flex min-h-[60px] w-[calc(100%-50px)] items-center justify-center rounded-[10px] border border-background bg-none">
          <Tooltip title="Back to Liquidity" placement="top">
            <IconButton className="absolute left-1" onClick={onBack}>
              <ArrowBack className="text-primary" />
            </IconButton>
          </Tooltip>
          <Typography className="text-lg font-bold">
            Manage Liquidity Pair
          </Typography>
          {isLoadingPair && (
            <CircularProgress size={10} className="ml-2 fill-white" />
          )}
        </div>
        <div className="w-full py-6 px-0">
          <div className="py-0 px-6">
            {activeTab === "deposit" && (
              <>
                {renderMassiveInput(
                  "amount0",
                  amount0,
                  amount0Error,
                  amount0Changed,
                  asset0,
                  assetOptions,
                  onAssetSelect,
                  amount0Focused,
                  amount0Ref
                )}
                <div className="z-[9] flex h-0 w-full items-center justify-center">
                  <div className="z-[1] h-9 rounded-[9px] bg-[#161b2c]">
                    <Add className="m-1 cursor-pointer rounded-md bg-[rgb(33,43,72)] p-[6px] text-3xl" />
                  </div>
                </div>
                {renderMassiveInput(
                  "amount1",
                  amount1,
                  amount1Error,
                  amount1Changed,
                  asset1,
                  assetOptions,
                  onAssetSelect,
                  amount1Focused,
                  amount1Ref
                )}
                {renderMediumInputToggle()}
                {renderDepositInformation()}
              </>
            )}
            {activeTab === "withdraw" && (
              <>
                {renderMassiveInput(
                  "withdraw",
                  withdrawAmount,
                  withdrawAmountError,
                  withdrawAmountChanged,
                  withdrawAsset,
                  withdrawAssetOptions,
                  onAssetSelect,
                  null,
                  null
                )}
                <div className="z-[9] flex h-0 w-full items-center justify-center">
                  <div className="z-[1] h-9 rounded-[9px] bg-[#161b2c]">
                    <ArrowDownward className="m-1 cursor-pointer rounded-md bg-[rgb(33,43,72)] p-[6px] text-3xl" />
                  </div>
                </div>
                <div className="grid grid-cols-[repeat(2,1fr)] gap-1">
                  {renderMediumInput(
                    withdrawQuote?.amount0,
                    pair?.token0?.logoURI,
                    pair?.token0?.symbol
                  )}
                  {renderMediumInput(
                    withdrawQuote?.amount1,
                    pair?.token1?.logoURI,
                    pair?.token1?.symbol
                  )}
                </div>
                {renderWithdrawInformation()}
              </>
            )}
          </div>
          {activeTab === "deposit" && (
            <div className="mt-3 grid h-full w-full grid-cols-[1fr] gap-3 py-0 px-6">
              {
                // There is no Gauge on the pair yet. Can only deposit
                pair && !(pair && pair.gauge && pair.gauge.address) && (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      className={
                        (amount0 === "" && amount1 === "") || loading
                          ? "min-w-[auto]"
                          : "bg-background font-bold text-primary hover:bg-green-900"
                      }
                      color="primary"
                      disabled={(amount0 === "" && amount1 === "") || loading}
                      onClick={onDeposit}
                    >
                      <Typography className="font-bold capitalize">
                        {isAddLiqLoading ? `Depositing` : `Deposit`}
                      </Typography>
                      {isAddLiqLoading || (
                        <CircularProgress
                          size={10}
                          className="ml-2 fill-white"
                        />
                      )}
                    </Button>
                    {isBaseAsset(pair.token0) &&
                      isBaseAsset(pair.token1) &&
                      pair.token0.isWhitelisted &&
                      pair.token1.isWhitelisted && (
                        <Button
                          variant="contained"
                          size="large"
                          className={
                            loading
                              ? "min-w-[auto]"
                              : "bg-background font-bold text-primary hover:bg-green-900"
                          }
                          color="primary"
                          disabled={loading}
                          onClick={onCreateGauge}
                        >
                          <Typography className="font-bold capitalize">
                            {isCreateGaugeLoading ? `Creating` : `Create Gauge`}
                          </Typography>
                          {isCreateGaugeLoading && (
                            <CircularProgress
                              size={10}
                              className="ml-2 fill-white"
                            />
                          )}
                        </Button>
                      )}
                  </>
                )
              }
              {
                // There is a Gauge on the pair. Can deposit and stake
                pair && pair && pair.gauge && pair.gauge.address && (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      className={
                        (amount0 === "" && amount1 === "") || loading
                          ? "min-w-[auto]"
                          : "bg-background font-bold text-primary hover:bg-green-900"
                      }
                      color="primary"
                      disabled={(amount0 === "" && amount1 === "") || loading}
                      onClick={onDepositAndStake}
                    >
                      <Typography className="font-bold capitalize">
                        {isAddLiqAndStakeLoading
                          ? `Depositing`
                          : `Deposit & Stake`}
                      </Typography>
                      {isAddLiqAndStakeLoading && (
                        <CircularProgress
                          size={10}
                          className="ml-2 fill-white"
                        />
                      )}
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      className={
                        (amount0 === "" && amount1 === "") || loading
                          ? "min-w-[auto]"
                          : "bg-background font-bold text-primary hover:bg-green-900"
                      }
                      color="primary"
                      disabled={(amount0 === "" && amount1 === "") || loading}
                      onClick={onDeposit}
                    >
                      <Typography className="font-bold capitalize">
                        {isAddLiqLoading ? `Depositing` : `Deposit LP`}
                      </Typography>
                      {isAddLiqLoading && (
                        <CircularProgress
                          size={10}
                          className="ml-2 fill-white"
                        />
                      )}
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      className={
                        (pair.balance && BigNumber(pair.balance).eq(0)) ||
                        loading
                          ? "min-w-[auto]"
                          : "bg-background font-bold text-primary hover:bg-green-900"
                      }
                      color="primary"
                      disabled={
                        (pair.balance && BigNumber(pair.balance).eq(0)) ||
                        loading
                      }
                      onClick={onStake}
                    >
                      <Typography className="font-bold capitalize">
                        {pair.balance && BigNumber(pair.balance).gt(0)
                          ? isStakeLiqLoading
                            ? `Staking`
                            : `Stake ${formatCurrency(pair.balance)} LP`
                          : `Nothing Unstaked`}
                      </Typography>
                      {isStakeLiqLoading && (
                        <CircularProgress
                          size={10}
                          className="ml-2 fill-white"
                        />
                      )}
                    </Button>
                  </>
                )
              }
            </div>
          )}
          {activeTab === "withdraw" && (
            <div className="mt-3 grid h-full w-full grid-cols-[1fr] gap-3 py-0 px-6">
              {!(pair && pair.gauge && pair.gauge.address) && (
                <Button
                  variant="contained"
                  size="large"
                  color="primary"
                  className={
                    loading || withdrawAmount === ""
                      ? "min-w-[auto]"
                      : "bg-background font-bold text-primary hover:bg-green-900"
                  }
                  disabled={loading || withdrawAmount === ""}
                  onClick={onWithdraw}
                >
                  <Typography className="font-bold capitalize">
                    {isRemoveLiqLoading ? `Withdrawing` : `Withdraw`}
                  </Typography>
                  {isRemoveLiqLoading && (
                    <CircularProgress size={10} className="ml-2 fill-white" />
                  )}
                </Button>
              )}
              {pair && pair.gauge && pair.gauge.address && (
                <>
                  <Button
                    variant="contained"
                    size="large"
                    color="primary"
                    className={
                      loading || withdrawAmount === ""
                        ? "min-w-[auto]"
                        : "bg-background font-bold text-primary hover:bg-green-900"
                    }
                    disabled={loading || withdrawAmount === ""}
                    onClick={onUnstakeAndWithdraw}
                  >
                    <Typography className="font-bold capitalize">
                      {isUnstakeAndRemoveLiqLoading
                        ? `Withdrawing`
                        : `Unstake and Withdraw`}
                    </Typography>
                    {isUnstakeAndRemoveLiqLoading && (
                      <CircularProgress size={10} className="ml-2 fill-white" />
                    )}
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    className={
                      withdrawAmount === "" || loading
                        ? "min-w-[auto]"
                        : "bg-background font-bold text-primary hover:bg-green-900"
                    }
                    color="primary"
                    disabled={withdrawAmount === "" || loading}
                    onClick={onUnstake}
                  >
                    <Typography className="font-bold capitalize">
                      {isUnstakeLiqLoading ? `Unstaking` : `Unstake LP`}
                    </Typography>
                    {isUnstakeLiqLoading && (
                      <CircularProgress size={10} className="ml-2 fill-white" />
                    )}
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    className={
                      (pair.balance && BigNumber(pair.balance).eq(0)) || loading
                        ? "min-w-[auto]"
                        : "bg-background font-bold text-primary hover:bg-green-900"
                    }
                    color="primary"
                    disabled={
                      (pair.balance && BigNumber(pair.balance).eq(0)) || loading
                    }
                    onClick={onWithdraw}
                  >
                    <Typography className="font-bold capitalize">
                      {pair.balance && BigNumber(pair.balance).gt(0)
                        ? isRemoveLiqLoading
                          ? `Withdrawing`
                          : `Withdraw ${formatCurrency(pair.balance)} LP`
                        : `Nothing Unstaked`}
                    </Typography>
                    {isRemoveLiqLoading && (
                      <CircularProgress size={10} className="ml-2 fill-white" />
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </Paper>
    </div>
  );
}

function AssetSelect({
  type,
  value,
  assetOptions,
  onSelect,
  disabled,
}: {
  type: string;
  value: BaseAsset | Pair | null;
  assetOptions: BaseAsset[] | Pair[] | undefined;
  onSelect: (_type: string, _asset: BaseAsset) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [manageLocal, setManageLocal] = useState(false);

  const { mutate: deleteOption } = useRemoveLocalAsset();
  const { mutate: addOption } = useAddLocalAsset();

  const openSearch = () => {
    if (disabled) {
      return false;
    }
    setSearch("");
    setOpen(true);
  };

  const filteredAssetOptions = useMemo(() => {
    return (assetOptions as BaseAsset[] | undefined)
      ?.filter((asset) => {
        if (search && search !== "") {
          return (
            asset.address.toLowerCase().includes(search.toLowerCase()) ||
            asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
            asset.name.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          return true;
        }
      })
      .sort((a, b) => {
        if (a.balance && b.balance && BigNumber(a.balance).lt(b.balance))
          return 1;
        if (a.balance && b.balance && BigNumber(a.balance).gt(b.balance))
          return -1;
        if (a.symbol < b.symbol) return -1;
        if (a.symbol > b.symbol) return 1;
        return 0;
      });
  }, [assetOptions, search]);

  useEffect(() => {
    if (
      filteredAssetOptions &&
      filteredAssetOptions.length === 0 &&
      search &&
      search.length === 42 &&
      isAddress(search)
    ) {
      addOption(search);
    }
  }, [assetOptions, search, addOption, filteredAssetOptions]);

  const onSearchChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const onLocalSelect = (type: string, asset: BaseAsset) => {
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

  const viewOption = (token: BaseAsset) => {
    window.open(`${ETHERSCAN_URL}token/${token.address}`, "_blank");
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

  const renderAssetOption = (type: string, asset: BaseAsset, idx: number) => {
    return (
      <MenuItem
        key={asset.address + "_" + idx}
        className="flex items-center justify-between px-0"
        onClick={() => {
          onLocalSelect(type, asset);
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
            placeholder="PLS, HEX, 0x..."
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
            placeholder="PLS, HEX, 0x..."
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
                    if (
                      a.balance &&
                      b.balance &&
                      BigNumber(a.balance).lt(b.balance)
                    )
                      return 1;
                    if (
                      a.balance &&
                      b.balance &&
                      BigNumber(a.balance).gt(b.balance)
                    )
                      return -1;
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
        <div className="relative w-full">
          <img
            className="h-full w-full rounded-[50px] border border-[rgba(126,153,153,0.5)] bg-[#032725] p-[10px]"
            alt=""
            src={value && isBaseAsset(value) ? `${value.logoURI}` : ""}
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
