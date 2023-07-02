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
import { type Address } from "viem";
import { useAccount } from "wagmi";

import { useTransferVest } from "./lib/mutations";
import { useNftById } from "./lib/queries";

import { transferNftReducer as reducer } from "./reducers";

export function TransferNFT() {
  const router = useRouter();
  const { id } = router.query;
  const { address } = useAccount();
  const { data } = useNftById(id);
  const [state, dispatch] = useReducer(reducer, {
    currentAddress: address,
    address: "",
    helperText: "",
    error: false,
  });
  const { mutate } = useTransferVest(() => {
    router.push("/vest");
  });
  const transferNFT = (nftId: string, to: Address) => {
    mutate({
      nftId,
      to,
    });
  };

  return (
    <div className="relative my-0 mx-auto w-full md:min-w-[485px] lg:max-w-[700px]">
      <Paper elevation={0} className="mx-5 space-y-4 p-[24px] md:mx-8">
        <div className="relative flex w-full flex-row items-center justify-center rounded-lg border border-solid border-background py-5">
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
        {data?.votedInCurrentEpoch || data?.reset === false ? (
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
          onClick={() => {
            if (id) {
              if (Array.isArray(id)) {
                transferNFT(id[0], state.address as Address);
              } else {
                transferNFT(id, state.address as Address);
              }
            }
          }}
        >
          Transfer
        </Button>
      </Paper>
    </div>
  );
}
