import { useEffect, useState, useMemo } from "react";
import { isAddress } from "viem";
import {
  Button,
  Dialog,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { DeleteOutline, Search } from "@mui/icons-material";
import BigNumber from "bignumber.js";
import Image from "next/image";

import { BaseAsset } from "../../stores/types/types";
import { ETHERSCAN_URL } from "../../stores/constants/constants";
import { formatCurrency } from "../../utils/utils";
import {
  useAddLocalAsset,
  useRemoveLocalAsset,
} from "../../lib/global/mutations";

export function AssetSelect({
  type,
  value,
  assetOptions,
  onSelect,
}: {
  type: string;
  value: BaseAsset | null;
  assetOptions: BaseAsset[] | undefined;
  onSelect: (_type: string, _asset: BaseAsset) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [manageLocal, setManageLocal] = useState(false);

  const { mutate: deleteOption } = useRemoveLocalAsset();
  const { mutate: addOption } = useAddLocalAsset();

  const openSearch = () => {
    setSearch("");
    setOpen(true);
  };

  const filteredAssetOptions = useMemo(() => {
    return assetOptions?.filter((asset) => {
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

  const renderManageOption = (type: string, asset: BaseAsset, idx: number) => {
    return (
      <MenuItem
        defaultValue={asset.address}
        key={asset.address + "_" + idx}
        className="flex items-center justify-between px-0"
      >
        <div className="relative mr-3 w-14 h-14">
          <Image
            className="h-full w-full rounded-[30px] border border-[rgba(126,153,153,0.5)] bg-[rgb(33,43,72)] p-[6px]"
            alt={asset ? asset.symbol : ""}
            src={asset ? `${asset.logoURI}` : ""}
            fill
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
        defaultValue={asset.address}
        key={asset.address + "_" + idx}
        className="flex items-center justify-between px-5"
        onClick={() => {
          onLocalSelect(type, asset);
        }}
      >
        <div className="relative mr-3 w-14 h-14">
          <Image
            className="h-full w-full rounded-[30px] border border-[rgba(126,153,153,0.5)] bg-[rgb(33,43,72)] p-1"
            alt={asset ? asset.symbol : ""}
            src={asset ? `${asset.logoURI}` : ""}
            fill
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null;
              (e.target as HTMLImageElement).src = "/tokens/unknown-logo.png";
            }}
          />
        </div>
        <div className="space-y-1">
          <Typography variant="h5">{asset ? asset.symbol : ""}</Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {asset ? asset.name : ""}
          </Typography>
        </div>
        <div className="ml-5 flex flex-[1] flex-col items-end">
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
        <div className="h-[600px] overflow-y-scroll py-5">
          <div className="px-5">
            <TextField
              autoFocus
              variant="outlined"
              fullWidth
              placeholder="FTM, WFTM, 0x..."
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
          </div>

          <div className="mt-3 flex w-full max-w-full min-w-[300px] sm:min-w-[390px] flex-col">
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
        <div className="h-[600px] overflow-y-scroll py-5">
          <div className="px-5">
            <TextField
              autoFocus
              variant="outlined"
              fullWidth
              placeholder="FTM, WFTM, 0x..."
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
          </div>

          <div className="mt-3 flex w-full min-w-[300px] sm:min-w-[390px] flex-col">
            {filteredAssetOptions
              ? filteredAssetOptions
                  .sort((a, b) => {
                    if (BigNumber(a.balance || 0).lt(b.balance || 0)) return 1;
                    if (BigNumber(a.balance || 0).gt(b.balance || 0)) return -1;
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
        onClick={() => {
          openSearch();
        }}
      >
        <div className="relative w-[60px] cursor-pointer h-[60px] sm:w-[100px] sm:h-[100px]">
          <Image
            quality={100}
            className="h-full w-full rounded-[50px] border border-cyan/20 bg-[#032725] p-2"
            alt={value ? `${value.symbol}` : ""}
            src={value ? `${value.logoURI}` : ""}
            fill
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
