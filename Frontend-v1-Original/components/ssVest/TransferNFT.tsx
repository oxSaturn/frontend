import { ArrowBack } from "@mui/icons-material";
import {
  Alert,
  Button,
  FormControl,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";
import { useReducer } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";

import { useTransferVest } from "./lib/mutations";
import { useNftById } from "./lib/queries";

export function TransferNFT() {
  const router = useRouter();
  const { id } = router.query;
  const { address } = useAccount();
  const { data } = useNftById(id);
  const [state, dispatch] = useReducer(
    function (
      state: { address: string; helperText: string; error: boolean },
      action: { type: string; payload: string }
    ) {
      switch (action.type) {
        case "address":
          let helperText = "";
          let error = false;
          const { payload } = action;
          if (payload === "") {
            helperText = "";
            error = false;
          } else {
            if (!isAddress(payload)) {
              helperText = "Invalid Address";
              error = true;
            } else if (payload.toLowerCase() === address?.toLowerCase()) {
              helperText = "Cannot transfer to self";
              error = true;
            }
          }
          return { ...state, address: action.payload, helperText, error };
        default:
          return state;
      }
    },
    {
      address: "",
      helperText: "",
      error: false,
    }
  );
  const { mutate } = useTransferVest(() => {
    router.push("/vest");
  });
  const transferNFT = (nftId: string, to: `0x${string}`) => {
    mutate({
      nftId,
      to,
    });
  };

  return (
    <div className="relative my-0 mx-auto w-full md:min-w-[485px] lg:max-w-[700px]">
      <Paper elevation={0} className="mx-5 space-y-4 p-[24px] md:mx-8">
        <div className="relative flex w-full flex-row items-center justify-center rounded-lg border border-solid border-deepBlue py-5">
          <Link
            className="absolute left-[5px]"
            href={`/vest`}
            title="back to vest"
          >
            <IconButton>
              <ArrowBack />
            </IconButton>
          </Link>
          <Typography>Transfer NFT {id}</Typography>
        </div>
        {!(
          data?.lastVoted === 0n ||
          (data?.actionedInCurrentEpoch && data?.reset)
        ) ? (
          <Alert severity="error" className="bg-transparent">
            Please reset NFT {id} first.
          </Alert>
        ) : null}
        <div className="space-y-2">
          <Typography>Transfer to Address:</Typography>
          <FormControl fullWidth>
            <TextField
              helperText={state.helperText}
              error={state.error}
              className="flex w-full"
              placeholder="0x...."
              variant="outlined"
              value={state.address}
              onChange={(e) =>
                dispatch({ type: "address", payload: e.target.value })
              }
            />
          </FormControl>
        </div>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={state.error || state.address === ""}
          onClick={() =>
            transferNFT(id as string, state.address as `0x${string}`)
          }
        >
          Transfer
        </Button>
      </Paper>
    </div>
  );
}
