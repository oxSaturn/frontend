import { Alert } from "@mui/material";

const SlippageInfo = ({
  slippagePcent,
}: {
  slippagePcent: number | undefined;
}) => {
  if (typeof slippagePcent === "undefined") return null;

  const isPlusPricing = slippagePcent >= 0;
  const isNegPricing = slippagePcent < 0;
  const isHighNegPricing = slippagePcent < -0.5;
  const isVeryHighSlippage = slippagePcent < -10 || slippagePcent > 10;

  const formattedSlippagePcent = `${
    isPlusPricing ? "+" : ""
  }${slippagePcent.toFixed(2)}%`;

  return (
    <Alert
      icon={false}
      color={isPlusPricing ? "success" : isHighNegPricing ? "error" : "info"}
      variant={isHighNegPricing ? "filled" : "standard"}
      className={`mt-1 ${
        !isPlusPricing && !isHighNegPricing ? "bg-orange text-black" : ""
      }`}
    >
      {isPlusPricing && "Bonus"}
      {isNegPricing && !isHighNegPricing && "Slippage"}
      {isNegPricing && isHighNegPricing && "Warning! High slippage"} (incl.
      pricing): <strong>{formattedSlippagePcent}</strong>
      {isVeryHighSlippage && (
        <>
          <br />
          (Calculated assuming a value of 1 for all assets)
        </>
      )}
    </Alert>
  );
};

export default SlippageInfo;
