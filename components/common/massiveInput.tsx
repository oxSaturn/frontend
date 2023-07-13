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
  type: "From" | "To" | "amount0" | "amount1";
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
    <div className="relative my-5">
      <div
        className={`flex w-full items-center rounded-[10px] gap-x-2 sm:gap-x-3 ${
          amountError || assetError ? "border border-red-500" : ""
        }`}
      >
        <div className="flex-shrink-0">
          <AssetSelect
            type={type}
            value={assetValue}
            assetOptions={assetOptions}
            onSelect={onAssetSelect}
          />
        </div>
        <div className="h-full flex-[1] flex-grow-[0.98] space-y-1">
          <div>
            <Typography
              className="text-xs font-thin text-secondary flex items-center"
              noWrap
            >
              {assetValue?.symbol} balance:
              {assetValue && (balanceInfo || assetValue.balance)
                ? " " +
                  formatCurrency(balanceInfo?.formatted ?? assetValue.balance)
                : ""}{" "}
              {type === "From" ? (
                <button
                  type="button"
                  className="text-cyan ml-2"
                  onClick={() => {
                    if (type === "From") {
                      setBalance100();
                    }
                  }}
                >
                  Max
                </button>
              ) : null}
              {assetValue &&
              balanceInfo &&
              amountValueUsd &&
              amountValueUsd !== "" ? (
                <span className="text-xs font-thin text-secondary ml-auto">
                  {"~$" +
                    formatCurrency(amountValueUsd) +
                    (type === "To" && diffUsd && diffUsd !== ""
                      ? ` (${diffUsd}%)`
                      : "")}
                </span>
              ) : null}
            </Typography>
          </div>
          <TextField
            placeholder="0.00"
            fullWidth
            error={!!amountError}
            helperText={amountError}
            value={amountValue}
            onChange={amountChanged}
            autoComplete="off"
            disabled={loading || type === "To"}
            inputProps={{
              sx: {
                fontSize: "16px", // prevent zoom on mobile Safari
              },
            }}
            InputProps={{
              sx: {
                borderRadius: 0, // not quite sure about this, love round corners, but it makes the alignment a bit off visually
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};
