import { SquidWidget } from "@0xsquid/widget";
import { AppConfig as SquidWidgetConfig } from "@0xsquid/widget/widget/core/types/config";
import { Typography } from "@mui/material";

const config = {
  companyName: "Fantom Velocimeter",
  integratorId: "velocimeter-swap-widget",
  slippage: 1,
  instantExec: true,
  infiniteApproval: false,
  apiUrl: "https://api.0xsquid.com",
  priceImpactWarnings: {
    warning: 5,
    critical: 9,
  },
  mainLogoUrl: "",
  titles: {
    swap: "Bridge",
    allTokens: "",
    chains: "",
    destination: "",
    history: "",
    settings: "",
    tokens: "",
    transaction: "",
    wallets: "",
  },
  hideAnimations: true,
  initialToChainId: 250,
  style: {
    neutralContent: "#7e99b0", // Neutral text color
    baseContent: "#f7fee7", // Main text color
    base100: "#232323", // Background for chain and token dropdowns and secondary buttons
    base200: "#3f6212", // "From" section background and "Settings" section background
    base300: "#1e2e0c", // "To" section background and main widget background on all other views
    primary: "#00E8CA", // Background color for primary buttons
    secondary: "#4d7c0f", // Hover background for secondary buttons
    // secondaryContent: ColorType, // Hover content for secondary buttons
    secondaryFocus: "#52525b", // Button background color for chains and tokens dropdowns
    neutral: "#021716", // Text with less visibility (price balance)
    roundedBtn: "4px",
    roundedBox: "6px",
    roundedDropDown: "6px",
    displayDivider: false, // displays a divider between the "from and "to" section
    advanced: {
      transparentWidget: true, // When "true", the widget becomes slightly transparent
    },
  },
} as SquidWidgetConfig;

function SquidBridgePage() {
  return (
    <div className="relative mt-0 flex h-full w-full flex-col">
      <div className="relative z-10">
        <Typography
          className="text-center font-['Monument'] text-2xl font-thin text-white sm:text-3xl"
          variant="h1"
        >
          Bridge
        </Typography>
        <Typography
          className="my-7 mx-auto max-w-3xl text-center text-base text-secondary sm:text-lg"
          variant="body2"
        >
          Bridge using Squid Router
        </Typography>
      </div>
      <div className="flex items-center justify-center [&>div]:!w-auto [&>div]:!shadow-glow [&>div]:!rounded-lg">
        <SquidWidget config={config} />
      </div>
    </div>
  );
}

export default SquidBridgePage;
