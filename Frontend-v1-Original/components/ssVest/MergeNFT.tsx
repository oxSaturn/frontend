import { useState } from "react";
import { useRouter } from "next/router";
import {
  Button,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import Link from "next/link";

import { formatCurrency } from "../../utils/utils";
import { useVeToken, useVestNfts } from "../../lib/global/queries";

import classes from "./ssVest.module.css";
import { useMergeVest } from "./lib/mutations";

export function MergeNFT() {
  const router = useRouter();
  const { id } = router.query;
  const [selectedNFTId, setSelectedNFTId] = useState<string | null>(null);

  const { data: nfts } = useVestNfts();
  const { data: veToken } = useVeToken();

  const { mutate } = useMergeVest(() => {
    router.push("/vest");
  });

  const onMergeNFT = (from: string, to: string | null) => {
    if (to === null) return;
    mutate({
      from,
      to,
    });
  };

  return (
    <div className={classes.vestContainer}>
      <Paper elevation={0} className={classes.container2}>
        <div className="relative flex flex-row items-center justify-center rounded-lg border border-deepBlue py-5">
          <Link
            className="absolute left-[5px]"
            href={`/vest`}
            title="back to vest"
          >
            <IconButton>
              <ArrowBack className={classes.backIcon} />
            </IconButton>
          </Link>
          <Typography className={classes.titleText}>Merge NFT {id}</Typography>
        </div>
        <div className="space-y-2">
          <Typography>Select the NFT to merge #{id} into:</Typography>
          <FormControl fullWidth>
            <Select
              value={selectedNFTId}
              onChange={(e) => {
                setSelectedNFTId(e.target.value);
              }}
            >
              {nfts &&
                nfts
                  .filter((nft) => nft.id !== id) // filter out the current nft
                  .map((nft) => {
                    return (
                      <MenuItem key={nft.id} value={nft.id}>
                        <div className="flex w-full items-center justify-between">
                          <Typography>#{nft.id}</Typography>
                          <div>
                            <Typography>
                              {formatCurrency(nft.lockValue)}
                            </Typography>
                            <Typography color="textSecondary">
                              {veToken?.symbol}
                            </Typography>
                          </div>
                        </div>
                      </MenuItem>
                    );
                  })}
            </Select>
          </FormControl>
          <Button
            disabled={!selectedNFTId}
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            className="bg-primaryBg font-bold text-primary hover:bg-green-900"
            onClick={() => onMergeNFT(id as string, selectedNFTId)}
          >
            Merge
          </Button>
        </div>
      </Paper>
    </div>
  );
}
