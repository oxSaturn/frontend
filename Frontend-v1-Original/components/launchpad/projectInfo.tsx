import { useState } from "react";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
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
import { formatCurrency } from "../../utils/utils";
import { ACTIONS, ZERO_ADDRESS } from "../../stores/constants/constants";

import {
  useLaunchpadProject,
  useNoteAsset,
  useUserClaimableAndClaimableRefEarnings,
} from "./queries";

export default function LaunchpadProjectInfo() {
  const router = useRouter();
  const { address: userAddress } = useAccount();
  const { address, refCode } = router.query;

  const { isFetching: isFetchingProjectData, data: projectData } =
    useLaunchpadProject(address);
  const { data: claimableData, isFetching: isFetchingClaimable } =
    useUserClaimableAndClaimableRefEarnings(userAddress, address);
  const { data: asset } = useNoteAsset(userAddress);

  const [refCodeValue, setRefCodeValue] = useState(
    refCode && !Array.isArray(refCode) ? refCode : ""
  );
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<false | string>(false);

  const [buyLoading, setBuyLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  const onBack = () => {
    router.push("/launchpad");
  };

  const onCopyReferralLink = () => {
    if (!userAddress) return;
    setCopied(true);
    const url = window.location.href;
    navigator.clipboard.writeText(url + `?refCode=${userAddress}`);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  const onBuy = () => {
    if (
      !projectData ||
      projectData.hasEnded ||
      buyLoading ||
      isFetchingProjectData
    ) {
      return;
    }
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
        type: ACTIONS.BUY,
        content: {
          amount: amount,
          refCode: refCodeValue,
          projectAddress: address,
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
      type: ACTIONS.CLAIM_EARNED,
      content: {
        projectAddress: address,
      },
    });
  };

  const onClaimRefEarnings = () => {
    if (!projectData || !projectData.hasEnded) {
      return;
    }
    setClaimLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.CLAIM_REF_EARNED,
      content: {
        projectAddress: address,
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
    if (asset && asset.balance && projectData) {
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
        <Grid container>
          <Grid xs={6}>
            <Typography variant="h1" className="mb-6 uppercase">
              Project Name -{" "}
              {isFetchingProjectData
                ? "Loading..."
                : projectData
                ? projectData.tokenSymbol
                : "Not Found"}
            </Typography>
          </Grid>
          <Grid xs={3}>
            <Typography variant="body2">Expect to claim:</Typography>
            <Typography>
              {isFetchingClaimable || isFetchingProjectData
                ? "Loading..."
                : claimableData && projectData
                ? formatCurrency(claimableData.claimableEarnings) +
                  projectData.tokenSymbol
                : "Not Found"}
            </Typography>
          </Grid>
          <Grid xs={3}>
            <Typography variant="body2">Referral Claim:</Typography>
            <Typography>
              {isFetchingClaimable || isFetchingProjectData
                ? "Loading..."
                : claimableData && projectData
                ? formatCurrency(claimableData.claimedRefEarnings) +
                  projectData.tokenSymbol
                : "Not Found"}
            </Typography>
          </Grid>
        </Grid>
        <Grid container>
          <Grid xs={true}>
            <Typography variant="body2">Time Left:</Typography>
            <Typography>
              {isFetchingProjectData
                ? "Loading..."
                : projectData
                ? projectData.hasEnded
                  ? "Ended"
                  : projectData.remainingTime
                : "Not Found"}
            </Typography>
          </Grid>
          <Grid xs={true}>
            <Typography variant="body2">Token Price:</Typography>
            <Typography>
              {isFetchingProjectData
                ? "Loading..."
                : projectData
                ? formatCurrency(projectData.tokenPrice) + " NOTE"
                : "Not Found"}
            </Typography>
          </Grid>
          <Grid xs={true}>
            <Typography variant="body2">Target Raise:</Typography>
            <Typography>
              {isFetchingProjectData
                ? "Loading..."
                : projectData
                ? formatCurrency(projectData.minNoteToRaise) + " NOTE"
                : "Not Found"}
            </Typography>
          </Grid>
          <Grid xs={true}>
            <Typography variant="body2">Total Raised:</Typography>
            <Typography>
              {isFetchingProjectData
                ? "Loading..."
                : projectData
                ? formatCurrency(projectData.totalRaised) + " NOTE"
                : "Not Found"}
            </Typography>
          </Grid>
          <Grid xs={true}>
            <Typography variant="body2">Max Raise:</Typography>
            <Typography>
              {isFetchingProjectData
                ? "Loading..."
                : projectData
                ? formatCurrency(projectData.maxRaiseAmount) + " NOTE"
                : "Not Found"}
            </Typography>
          </Grid>
          <Grid>
            <Button
              variant="outlined"
              className={`min-w-[156px] border-cantoGreen text-lime-50 transition-shadow ${
                copied ? "shadow-glow" : ""
              }`}
              onClick={onCopyReferralLink}
            >
              {copied ? "Copied" : "Copy Referral Link"}
            </Button>
          </Grid>
        </Grid>
        <div className="mt-12 flex justify-between gap-2">
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
          {projectData?.hasEnded ? (
            <div className="relative flex flex-grow-[0.9] flex-col justify-between gap-4">
              <Button
                variant="contained"
                size="large"
                color="primary"
                className="bg-[#272826] font-bold text-cantoGreen hover:bg-green-900"
                disabled={claimLoading}
                onClick={onClaim}
              >
                <Typography className="font-bold capitalize">
                  {claimLoading ? `Loading` : `Claim`}
                </Typography>
                {claimLoading && (
                  <CircularProgress size={10} className="ml-2 fill-white" />
                )}
              </Button>
              <Button
                variant="contained"
                size="large"
                color="primary"
                className="bg-[#272826] font-bold text-cantoGreen hover:bg-green-900"
                disabled={claimLoading}
                onClick={onClaimRefEarnings}
              >
                <Typography className="font-bold capitalize">
                  {claimLoading ? `Loading` : `Claim ref earnings`}
                </Typography>
                {claimLoading && (
                  <CircularProgress size={10} className="ml-2 fill-white" />
                )}
              </Button>
            </div>
          ) : (
            <div className="relative flex flex-grow-[0.9] flex-col justify-between gap-4">
              <div className="flex flex-col gap-5">
                <div
                  className="absolute top-2 right-2 z-[1] cursor-pointer"
                  onClick={setMaxAmount}
                >
                  <Typography
                    className="text-xs font-thin text-[#7e99b0]"
                    noWrap
                  >
                    Balance:
                    {asset && asset.balance
                      ? " " + formatCurrency(asset.balance) + " NOTE"
                      : ""}
                  </Typography>
                </div>
                <div
                  className={`flex w-full flex-wrap items-center rounded-[10px] ${
                    amountError && "border border-red-500"
                  }`}
                >
                  <div className="p-2">
                    <img
                      className="h-10 w-10 rounded-[50px] border border-[rgba(126,153,153,0.5)] bg-[#032725] p-2"
                      alt=""
                      src={asset?.logoURI}
                      height="100px"
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src =
                          "/tokens/unknown-logo.png";
                      }}
                    />
                  </div>
                  <div className="h-full flex-grow">
                    <TextField
                      placeholder="0.00 NOTE"
                      fullWidth
                      error={!!amountError}
                      helperText={amountError}
                      value={amount}
                      onChange={amountChanged}
                      autoComplete="off"
                      disabled={buyLoading || !projectData}
                      InputProps={{
                        style: {
                          fontSize: "46px !important",
                        },
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Typography className="text-md">Referral code</Typography>
                  <TextField
                    placeholder={ZERO_ADDRESS}
                    fullWidth
                    value={refCodeValue}
                    onChange={refCodeValueChanged}
                    autoComplete="off"
                    disabled={buyLoading || !projectData}
                    InputProps={{
                      style: {
                        fontSize: "46px !important",
                      },
                    }}
                  />
                </div>
              </div>
              <Button
                variant="contained"
                size="large"
                color="primary"
                className="bg-[#272826] font-bold text-cantoGreen hover:bg-green-900"
                disabled={
                  buyLoading ||
                  !projectData ||
                  projectData.hasEnded ||
                  isFetchingProjectData
                }
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
          )}
        </div>
      </Paper>
    </div>
  );
}
