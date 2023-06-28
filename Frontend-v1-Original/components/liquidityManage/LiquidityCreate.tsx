import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import {
  Paper,
  Typography,
  Button,
  CircularProgress,
  Tooltip,
  IconButton,
} from "@mui/material";
import { ArrowBack, Add, ArrowForward } from "@mui/icons-material";
import BigNumber from "bignumber.js";

import { formatCurrency } from "../../utils/utils";
import { BaseAsset, isBaseAsset, Pair } from "../../stores/types/types";
import { useBaseAssetWithInfo } from "../../lib/global/queries";

import { MassiveInput } from "../common/massiveInput";

import { useAmounts } from "./lib/useAmounts";
import { usePairExistance } from "./lib/queries";
import { useCreatePairDeposit, useCreatePairStake } from "./lib/mutations";

export default function LiquidityManage() {
  const router = useRouter();

  const { amount0, amount1, setAmount0, setAmount1 } = useAmounts();
  const [amount0Error, setAmount0Error] = useState<string | false>(false);
  const [amount1Error, setAmount1Error] = useState<string | false>(false);

  const [stable, setStable] = useState(false);

  const [asset0, setAsset0] = useState<BaseAsset | null>(null);
  const [asset1, setAsset1] = useState<BaseAsset | null>(null);

  const { data: assetOptions } = useBaseAssetWithInfo();

  const { data: pairExistanceData, isFetching: isLoadingPairExistance } =
    usePairExistance({
      token0Address: asset0?.address,
      token1Address: asset1?.address,
      stable,
    });

  const onBack = () => {
    router.push("/liquidity");
  };

  const { mutate: createPairDeposit, isLoading: createPairDepositLoading } =
    useCreatePairDeposit(onBack);
  const { mutate: createPairStake, isLoading: createPairStakeLoading } =
    useCreatePairStake(onBack);

  const loading =
    createPairDepositLoading ||
    createPairStakeLoading ||
    isLoadingPairExistance;

  const goToExistingPair = () => {
    router.push(`/liquidity/${pairExistanceData?.pairAddress}`);
  };

  const checkInputValid = useCallback(() => {
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

    if (!asset0 || asset0 === null) {
      setAmount0Error("Asset is required");
      error = true;
    }

    if (!asset1 || asset1 === null) {
      setAmount1Error("Asset is required");
      error = true;
    }

    return error;
  }, [amount0, amount1, asset0, asset1]);

  const onCreateAndStake = () => {
    const error = checkInputValid();

    if (!error) {
      createPairStake({
        token0: asset0,
        token1: asset1,
        amount0,
        amount1,
        isStable: stable,
        slippage: "2",
      });
    }
  };

  const onCreateAndDeposit = () => {
    const error = checkInputValid();

    if (!error) {
      createPairDeposit({
        token0: asset0,
        token1: asset1,
        amount0,
        amount1,
        isStable: stable,
        slippage: "2",
      });
    }
  };

  const amount0Changed = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount0Error(false);
    setAmount0(event.target.value);
  };

  const amount1Changed = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount1Error(false);
    setAmount1(event.target.value);
  };

  const onAssetSelect = async (type: string, value: Pair | BaseAsset) => {
    if (type === "amount0" && isBaseAsset(value)) {
      setAsset0(value);
      if (!asset1?.address) return;
    } else if (type === "amount1" && isBaseAsset(value)) {
      setAsset1(value);
      if (!asset0?.address) return;
    }
  };

  const setStab = async (val: boolean) => {
    setStable(val);
    if (!asset0?.address || !asset1?.address) return;
  };

  return (
    <div className="relative">
      <Paper
        elevation={0}
        className="m-auto mt-0 flex w-[calc(100%-60px)] max-w-[485px] flex-col items-start bg-transparent shadow-glow backdrop-blur-sm"
      >
        <div className="flex w-full flex-col rounded-t-lg rounded-r-lg rounded-b-none rounded-l-none text-primary">
          <Paper className="flex cursor-pointer items-center justify-center rounded-t-lg rounded-r-none rounded-b-none rounded-l-none border bg-transparent py-6 font-medium text-secondary outline-0">
            <Typography variant="h5">Deposit</Typography>
          </Paper>
        </div>
        <div className="relative mt-5 mr-6 mb-0 ml-6 flex min-h-[60px] w-[calc(100%-50px)] items-center justify-center rounded-[10px] border border-background bg-none">
          <Tooltip title="Back to Liquidity" placement="top">
            <IconButton className="absolute left-1" onClick={onBack}>
              <ArrowBack className="text-primary" />
            </IconButton>
          </Tooltip>
          <Typography className="text-lg font-bold">
            Create Liquidity Pair
          </Typography>
          {isLoadingPairExistance && (
            <CircularProgress size={10} className="ml-2 fill-white" />
          )}
        </div>
        {pairExistanceData?.pairExists && (
          <div className="relative mt-5 mr-6 mb-0 ml-6 flex min-h-[60px] w-[calc(100%-50px)] items-center justify-center rounded-[10px] border border-background bg-none">
            <Tooltip title="Manage existing pair" placement="top">
              <IconButton
                className="absolute right-1"
                onClick={goToExistingPair}
              >
                <ArrowForward className="text-primary" />
              </IconButton>
            </Tooltip>
            <Typography className="text-lg font-bold">
              Pair already exists
            </Typography>
          </div>
        )}
        <div className="w-full py-6 px-0">
          <div className="py-0 px-6">
            <MassiveInput
              amountValue={amount0}
              amountError={amount0Error}
              assetOptions={assetOptions}
              assetValue={asset0}
              onAssetSelect={onAssetSelect}
              amountChanged={amount0Changed}
              amountValueUsd=""
              assetError={false}
              diffUsd=""
              type="amount0"
              loading={loading}
              setBalance100={() => {}}
            />
            <div className="z-[9] flex h-0 w-full items-center justify-center">
              <div className="z-[1] h-9 rounded-[9px] bg-[#161b2c]">
                <Add className="m-1 cursor-pointer rounded-md bg-[rgb(33,43,72)] p-[6px] text-3xl" />
              </div>
            </div>
            <MassiveInput
              amountValue={amount1}
              amountError={amount1Error}
              assetOptions={assetOptions}
              assetValue={asset1}
              onAssetSelect={onAssetSelect}
              amountChanged={amount1Changed}
              type="amount1"
              loading={loading}
              setBalance100={() => {}}
              amountValueUsd=""
              assetError={false}
              diffUsd=""
            />
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
          </div>
          <div className="mt-3 grid h-full w-full grid-cols-[1fr] gap-3 py-0 px-6">
            {asset0 &&
              asset0.isWhitelisted === true &&
              asset1 &&
              asset1.isWhitelisted === true && (
                <>
                  <Button
                    variant="contained"
                    size="large"
                    className={
                      createPairStakeLoading || createPairDepositLoading
                        ? "min-w-[auto]"
                        : "bg-background font-bold text-primary hover:bg-green-900"
                    }
                    color="primary"
                    disabled={
                      createPairStakeLoading ||
                      createPairDepositLoading ||
                      pairExistanceData?.pairExists
                    }
                    onClick={onCreateAndStake}
                  >
                    <Typography className="font-bold capitalize">
                      {createPairStakeLoading
                        ? `Creating`
                        : `Create Pair & Stake`}
                    </Typography>
                    {createPairStakeLoading && (
                      <CircularProgress size={10} className="ml-2 fill-white" />
                    )}
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    className={
                      createPairStakeLoading || createPairDepositLoading
                        ? "min-w-[auto]"
                        : "bg-background font-bold text-primary hover:bg-green-900"
                    }
                    color="primary"
                    disabled={
                      createPairStakeLoading ||
                      createPairDepositLoading ||
                      pairExistanceData?.pairExists
                    }
                    onClick={onCreateAndDeposit}
                  >
                    <Typography className="font-bold capitalize">
                      {createPairDepositLoading
                        ? `Depositing`
                        : `Create Pair & Deposit`}
                    </Typography>
                    {createPairDepositLoading && (
                      <CircularProgress size={10} className="ml-2 fill-white" />
                    )}
                  </Button>
                </>
              )}
            {!(
              asset0 &&
              asset0.isWhitelisted === true &&
              asset1 &&
              asset1.isWhitelisted === true
            ) && (
              <>
                <Button
                  variant="contained"
                  size="large"
                  className={
                    createPairStakeLoading || createPairDepositLoading
                      ? "min-w-[auto]"
                      : "bg-background font-bold text-primary hover:bg-green-900"
                  }
                  color="primary"
                  disabled={
                    createPairStakeLoading ||
                    createPairDepositLoading ||
                    pairExistanceData?.pairExists
                  }
                  onClick={onCreateAndDeposit}
                >
                  <Typography className="font-bold capitalize">
                    {createPairDepositLoading
                      ? `Depositing`
                      : `Create Pair & Deposit`}
                  </Typography>
                  {createPairDepositLoading && (
                    <CircularProgress size={10} className="ml-2 fill-white" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </Paper>
    </div>
  );
}
