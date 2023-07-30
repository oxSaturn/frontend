import { Dialog } from "@mui/material";

import { BaseAsset, LegacyQuote } from "../../stores/types/types";
import { formatCurrency } from "../../utils/utils";

export function RoutesDialog({
  onClose,
  open,
  paths,
  fromAssetValue,
  toAssetValue,
  fromAmountValue,
  toAmountValue,
}: {
  onClose: () => void;
  open: boolean;
  paths: LegacyQuote | undefined;
  fromAssetValue: BaseAsset | null;
  toAssetValue: BaseAsset | null;
  fromAmountValue: string;
  toAmountValue: string;
}) {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      aria-labelledby="routes-presentation"
    >
      {paths && fromAssetValue && toAssetValue ? (
        <div className="relative flex w-full min-w-[576px] flex-col justify-between p-6">
          <div className="text-center">Routes</div>
          <div className="flex w-full items-center justify-between">
            <div>
              <img
                className="inline-block h-12 rounded-[30px] border border-[rgba(126,153,153,0.5)] bg-[#032725] p-[6px]"
                alt=""
                src={fromAssetValue ? `${fromAssetValue.logoURI}` : ""}
                height="40px"
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src =
                    "/tokens/unknown-logo.png";
                }}
              />
              <span className="ml-1 align-middle text-sm">
                {formatCurrency(fromAmountValue)} {fromAssetValue.symbol}
              </span>
            </div>
            {`->`}
            {paths.output.routeAsset && (
              <>
                <div>
                  <span className="mr-1 align-middle text-sm">
                    {paths.output.routeAsset.symbol}
                  </span>
                  <img
                    className="inline-block h-12 rounded-[30px] border border-[rgba(126,153,153,0.5)] bg-[#032725] p-[6px]"
                    alt=""
                    src={paths.output.routeAsset.logoURI || ""}
                    height="40px"
                    onError={(e) => {
                      (e.target as HTMLImageElement).onerror = null;
                      (e.target as HTMLImageElement).src =
                        "/tokens/unknown-logo.png";
                    }}
                  />
                </div>
                {`->`}
              </>
            )}
            <div>
              <span className="mr-1 align-middle text-sm">
                {formatCurrency(toAmountValue)} {toAssetValue.symbol}
              </span>
              <img
                className="inline-block h-12 rounded-[30px] border border-[rgba(126,153,153,0.5)] bg-[#032725] p-[6px]"
                alt=""
                src={toAssetValue ? `${toAssetValue.logoURI}` : ""}
                height="40px"
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src =
                    "/tokens/unknown-logo.png";
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        "No routes"
      )}
    </Dialog>
  );
}
