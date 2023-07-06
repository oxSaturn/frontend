import { Dialog } from "@mui/material";

import { BaseAsset, QuoteSwapResponse } from "../../stores/types/types";
import { formatCurrency } from "../../utils/utils";

export function RoutesDialog({
  onClose,
  open,
  quote,
  fromAssetValue,
  toAssetValue,
  fromAmountValue,
  toAmountValue,
}: {
  onClose: () => void;
  open: boolean;
  quote: QuoteSwapResponse | undefined;
  fromAssetValue: BaseAsset | null;
  toAssetValue: BaseAsset | null;
  fromAmountValue: string;
  toAmountValue: string;
}) {
  const handleClose = () => {
    onClose();
  };

  const paths = quote?.maxReturn.paths;
  const tokens = quote?.maxReturn.tokens;

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
          <div className="px-6">
            {paths.map((path, idx) => (
              <div
                key={path.amountFrom + idx}
                className="relative flex border-primary py-6 px-[5%] before:absolute before:left-0 before:top-0 before:h-12 before:w-full before:rounded-b-3xl before:rounded-br-3xl before:border-b before:border-dashed before:border-primary after:w-16 first:pt-7 last:before:border-l last:before:border-r [&:not(:last-child)]:border-x [&:not(:last-child)]:border-dashed"
              >
                <div className="relative flex flex-grow">
                  <div className="flex flex-grow justify-between gap-4">
                    <div>
                      {(
                        (parseFloat(path.amountFrom) /
                          parseFloat(quote.maxReturn.totalFrom)) *
                        100
                      ).toFixed()}
                      %
                    </div>
                    {path.swaps.map((swap, idx) => {
                      if (idx === path.swaps.length - 1) return null;
                      return (
                        tokens && (
                          <div key={swap.to + idx}>
                            {tokens[swap.to].symbol}
                          </div>
                        )
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        "No routes"
      )}
    </Dialog>
  );
}
