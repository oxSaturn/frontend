import { useState } from "react";
import { useRouter } from "next/router";
import {
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import BigNumber from "bignumber.js";

import stores from "../../stores";
import { useAccount } from "../../hooks/useAccount";
import { formatCurrency } from "../../utils/utils";
import { ACTIONS, ZERO_ADDRESS } from "../../stores/constants/constants";

import {
  useLaunchpadProject,
  useNoteAsset,
  useUserClaimableAndClaimableRefEarnings,
} from "./queries";

export default function LaunchpadProjectInfo() {
  const router = useRouter();
  const account = useAccount();
  const { address, refCode } = router.query;

  const { isFetching: isFetchingProjectData, data: projectData } =
    useLaunchpadProject(address);
  const { data: claimableData } = useUserClaimableAndClaimableRefEarnings(
    account?.address,
    address
  );

  const [refCodeValue, setRefCodeValue] = useState(
    refCode && !Array.isArray(refCode) ? refCode : ""
  );
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<false | string>(false);

  const { data: asset } = useNoteAsset(account?.address);

  const [buyLoading, setBuyLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  const onBack = () => {
    router.push("/launchpad");
  };

  const onCopyReferralLink = () => {
    if (!account?.address) return;
    const url = window.location.href;
    navigator.clipboard.writeText(url + `?refCode=${account?.address}`);
  };

  const onBuy = () => {
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

    if (!asset) {
      setAmountError("From asset is required");
      error = true;
    }

    if (!error) {
      setBuyLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.CREATE_BRIBE,
        content: {
          asset: asset,
          amount: amount,
        },
      });
    }
  };

  const onClaim = () => {
    if (!projectData || !projectData.hasEnded) {
      return;
    }
    setClaimLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.CREATE_BRIBE,
      content: {
        asset: asset,
        amount: amount,
      },
    });
  };

  const onClaimRefEarnings = () => {
    if (!projectData || !projectData.hasEnded) {
      return;
    }
    setClaimLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.CREATE_BRIBE,
      content: {
        asset: asset,
        amount: amount,
      },
    });
  };

  const amountChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmountError(false);
    setAmount(event.target.value);
  };

  const refCodeValueChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRefCodeValue(event.target.value);
  };

  const setMaxAmount = () => {
    setAmountError(false);
    if (asset && asset.balance) {
      setAmount(asset.balance);
    }
  };

  return (
    <div className="relative p-10">
      <IconButton className="absolute right-9 top-9 mt-8 mr-8" onClick={onBack}>
        <ArrowBack className="text-cantoGreen" />
      </IconButton>
      <Paper
        elevation={0}
        className="m-auto mt-0 flex flex-col bg-transparent p-8 shadow-glow"
      >
        <Typography variant="h1">Project Name</Typography>
        <Grid container>
          <Grid xs={true}>
            <Typography variant="body2">Time Left:</Typography>
            <Typography>7d 4h 5m</Typography>
          </Grid>
          <Grid xs={true}>
            <Typography variant="body2">Token Price:</Typography>
            <Typography>{formatCurrency(0.05)} NOTE</Typography>
          </Grid>
          <Grid xs={true}>
            <Typography variant="body2">Total Raised:</Typography>
            <Typography>{formatCurrency(6000000)} NOTE</Typography>
          </Grid>
          <Grid>
            <Button
              variant="outlined"
              className="border-cantoGreen text-lime-50"
              onClick={onCopyReferralLink}
            >
              Copy your referral link
            </Button>
          </Grid>
        </Grid>
        <div className="my-1 flex justify-between gap-2">
          <div className="relative flex-grow-[0.9]">
            <>
              <div
                className="absolute top-2 right-2 z-[1] cursor-pointer"
                onClick={setMaxAmount}
              >
                <Typography className="text-xs font-thin text-[#7e99b0]" noWrap>
                  Balance:
                  {asset && asset.balance
                    ? " " + formatCurrency(asset.balance)
                    : ""}
                </Typography>
              </div>
              <div
                className={`flex w-full flex-wrap items-center rounded-[10px] ${
                  amountError && "border border-red-500"
                }`}
              >
                <img
                  className="h-16 w-16 rounded-[50px] border border-[rgba(126,153,153,0.5)] bg-[#032725] p-[10px]"
                  alt=""
                  src={asset?.logoURI}
                  height="100px"
                  onError={(e) => {
                    (e.target as HTMLImageElement).onerror = null;
                    (e.target as HTMLImageElement).src =
                      "/tokens/unknown-logo.png";
                  }}
                />
                <div className="h-full flex-grow">
                  <TextField
                    placeholder="0.00"
                    fullWidth
                    error={!!amountError}
                    helperText={amountError}
                    value={amount}
                    onChange={amountChanged}
                    autoComplete="off"
                    disabled={buyLoading || claimLoading}
                    InputProps={{
                      style: {
                        fontSize: "46px !important",
                      },
                    }}
                  />
                  <Typography color="textSecondary" className="text-xs">
                    {asset?.symbol}
                  </Typography>
                </div>
              </div>
              <div>
                <TextField
                  placeholder={ZERO_ADDRESS}
                  fullWidth
                  value={refCodeValue}
                  onChange={refCodeValueChanged}
                  autoComplete="off"
                  disabled={buyLoading}
                  InputProps={{
                    style: {
                      fontSize: "46px !important",
                    },
                  }}
                />
                <Typography color="textSecondary" className="text-xs">
                  Referral code
                </Typography>
              </div>
            </>
            <Button
              variant="contained"
              size="large"
              color="primary"
              className="bg-[#272826] font-bold text-cantoGreen hover:bg-green-900"
              disabled={buyLoading}
              onClick={onBuy}
            >
              <Typography className="font-bold capitalize">
                {buyLoading ? `Loading` : `Buy`}
              </Typography>
              {buyLoading && (
                <CircularProgress size={10} className="ml-2 fill-white" />
              )}
            </Button>
          </div>
          <div className="relative max-w-[50%]">
            {`It is a long established fact that a reader will be distracted by
            the readable content of a page when looking at its layout. The point
            of using Lorem Ipsum is that it has a more-or-less normal
            distribution of letters, as opposed to using 'Content here, content
            here', making it look like readable English. Many desktop publishing
            packages and web page editors now use Lorem Ipsum as their default
            model text, and a search for 'lorem ipsum' will uncover many web
            sites still in their infancy. Various versions have evolved over the
            years, sometimes by accident, sometimes on purpose (injected humour
            and the like).`}
          </div>
        </div>
        {/* {isFetching ? "Loading ..." : null}
        {data && data.hasStarted && (
          <>
            <div className="relative mb-1">
              <div
                className="absolute top-2 right-2 z-[1] cursor-pointer"
                onClick={setMaxAmount}
              >
                <Typography className="text-xs font-thin text-[#7e99b0]" noWrap>
                  Balance:
                  {asset && asset.balance
                    ? " " + formatCurrency(asset.balance)
                    : ""}
                </Typography>
              </div>
              {asset && asset.balance && amountInUsd && amountInUsd !== "" ? (
                <div className="absolute bottom-2 right-2 z-[1] cursor-pointer">
                  <Typography
                    className="text-xs font-thin text-[#7e99b0]"
                    noWrap
                  >
                    {"~$" + formatCurrency(amountInUsd)}
                  </Typography>
                </div>
              ) : null}
              <div
                className={`flex w-full flex-wrap items-center rounded-[10px] bg-[#272826] ${
                  amountError && "border border-red-500"
                }`}
              >
                <div className="h-full min-h-[128px] w-32"></div>
                <div className="h-full flex-[1] flex-grow-[0.98]">
                  <TextField
                    placeholder="0.00"
                    fullWidth
                    error={!!amountError}
                    helperText={amountError}
                    value={amount}
                    onChange={amountChanged}
                    autoComplete="off"
                    disabled={buyLoading || claimLoading}
                    InputProps={{
                      style: {
                        fontSize: "46px !important",
                      },
                    }}
                  />
                  <Typography color="textSecondary" className="text-xs">
                    {asset?.symbol}
                  </Typography>
                </div>
              </div>
            </div>
            <div>input ref code</div>
            <button>Buy</button>
          </>
        )}
        {data && data.hasEnded && (
          <>
            <div>You got: getExpectedClaimAmount()</div>
            <button onClick={onClaim}>Claim</button>
          </>
        )} */}
      </Paper>
    </div>
  );
}
