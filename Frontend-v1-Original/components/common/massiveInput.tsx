import { useAccount, useBalance } from "wagmi";
import { Typography, TextField } from "@mui/material";

import { BaseAsset } from "../../stores/types/types";
import { NATIVE_TOKEN } from "../../stores/constants/constants";
import { formatCurrency } from "../../utils/utils";

import { AssetSelect } from "./select";

export const MassiveInput = ({
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
  assetValue: BaseAsset | null;
  assetError: string | false;
  assetOptions: BaseAsset[] | undefined;
  onAssetSelect: (_type: string, _value: BaseAsset) => void;
  loading: boolean;
  setBalance100: () => void;
  amountChanged?: (_event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const { address } = useAccount();
  const { data: balanceInfo } = useBalance({
    address,
    token:
      assetValue?.address === NATIVE_TOKEN.address
        ? undefined
        : assetValue?.address,
    watch: true,
    enabled: !!assetValue,
  });
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
        <Typography className="text-xs font-thin text-secondary" noWrap>
          Balance:
          {assetValue && (balanceInfo || assetValue.balance)
            ? " " + formatCurrency(balanceInfo?.formatted ?? assetValue.balance)
            : ""}
        </Typography>
      </div>
      {assetValue && balanceInfo && amountValueUsd && amountValueUsd !== "" ? (
        <div className="absolute bottom-2 right-2 z-[1] cursor-pointer">
          <Typography className="text-xs font-thin text-secondary" noWrap>
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
