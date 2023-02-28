import { Alert } from "@mui/material";
import { withStyles } from "@mui/styles";

const styles = () => ({
  alert: {
    marginTop: "5px",
  },
  infoAlert: {
    backgroundColor: "Orange",
    color: "#000",
  },
});

const SlippageInfo = ({
  slippagePcent,
  classes,
}: {
  slippagePcent: number | undefined;
  classes: any;
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
      className={`${classes.alert} ${
        !isPlusPricing && !isHighNegPricing ? classes.infoAlert : ""
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

export default withStyles(styles)(SlippageInfo);
