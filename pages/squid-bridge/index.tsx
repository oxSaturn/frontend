import { Typography } from "@mui/material";

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
      <div className="flex items-center justify-center">
        <iframe
          title="squid_widget"
          src="https://widget.squidrouter.com/iframe?config=%7B%22integratorId%22%3A%22velocimeter-swap-widget%22%2C%22companyName%22%3A%22Fantom%20Velocimeter%22%2C%22style%22%3A%7B%22neutralContent%22%3A%22%237e99b0%22%2C%22baseContent%22%3A%22%23f7fee7%22%2C%22base100%22%3A%22%23232323%22%2C%22base200%22%3A%22%233f6212%22%2C%22base300%22%3A%22%231e2e0c%22%2C%22error%22%3A%22%23ED6A5E%22%2C%22warning%22%3A%22%23FFB155%22%2C%22success%22%3A%22%232EAEB0%22%2C%22primary%22%3A%22%2300E8CA%22%2C%22secondary%22%3A%22%234d7c0f%22%2C%22secondaryContent%22%3A%22%23FFFFFF%22%2C%22neutral%22%3A%22%23021716%22%2C%22roundedBtn%22%3A%224px%22%2C%22roundedBox%22%3A%226px%22%2C%22roundedDropDown%22%3A%226px%22%2C%22displayDivider%22%3Afalse%2C%22advanced%22%3A%7B%22transparentWidget%22%3Atrue%7D%7D%2C%22slippage%22%3A1%2C%22instantExec%22%3Atrue%2C%22infiniteApproval%22%3Afalse%2C%22apiUrl%22%3A%22https%3A%2F%2Fapi.0xsquid.com%22%2C%22priceImpactWarnings%22%3A%7B%22warning%22%3A5%2C%22critical%22%3A9%7D%2C%22mainLogoUrl%22%3A%22%22%2C%22titles%22%3A%7B%22swap%22%3A%22Bridge%22%2C%22allTokens%22%3A%22%22%2C%22chains%22%3A%22%22%2C%22destination%22%3A%22%22%2C%22history%22%3A%22%22%2C%22settings%22%3A%22%22%2C%22tokens%22%3A%22%22%2C%22transaction%22%3A%22%22%2C%22wallets%22%3A%22%22%7D%2C%22hideAnimations%22%3Atrue%2C%22initialToChainId%22%3A250%2C%22style%22%3A%7B%22neutralContent%22%3A%22%237e99b0%22%2C%22baseContent%22%3A%22%23f7fee7%22%2C%22base100%22%3A%22%23232323%22%2C%22base200%22%3A%22%233f6212%22%2C%22base300%22%3A%22%231e2e0c%22%2C%22primary%22%3A%22%2300E8CA%22%2C%22secondary%22%3A%22%234d7c0f%22%2C%22secondaryFocus%22%3A%22%2352525b%22%2C%22neutral%22%3A%22%23021716%22%2C%22roundedBtn%22%3A%224px%22%2C%22roundedBox%22%3A%226px%22%2C%22roundedDropDown%22%3A%226px%22%2C%22displayDivider%22%3Afalse%2C%22advanced%22%3A%7B%22transparentWidget%22%3Atrue%7D%7D%7D"
          width="420"
          height="684"
          sandbox="allow-same-origin allow-scripts"
          className="shadow-glow rounded-lg"
        />
      </div>
    </div>
  );
}

export default SquidBridgePage;
