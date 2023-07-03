import { useNetwork, useSwitchNetwork } from "wagmi";
import Head from "next/head";
import { fantom } from "viem/chains";
import { Button, Typography } from "@mui/material";

import Header from "../header/header";
import MobileHeader from "../header/mobileHeader";
import SnackbarController from "../snackbar/snackbarController";

export default function Layout({
  children,
  configure,
}: {
  children: React.ReactNode;
  configure?: boolean;
}) {
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({ chainId: fantom.id });

  return (
    <div className="relative flex h-full min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden md:overflow-x-auto lg:flex-row">
      <Head>
        <link rel="icon" href="/images/logo-icon.png" />
        <meta
          name="description"
          content="FVM by Velocimeter allows low cost, near 0 slippage trades on uncorrelated or tightly correlated assets built on fantom."
        />
        <meta name="og:title" content="FVM" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <div className="pointer-events-none absolute top-0 right-0 -z-10 h-full w-full bg-appBackground" />
      <div className="pointer-events-none absolute top-0 right-0 -z-10 hidden h-full w-full bg-waves bg-cover bg-no-repeat xs:block" />
      <div className="flex h-full min-h-screen flex-[1] flex-col">
        {!configure && (
          <>
            <div className="block md:hidden">
              <MobileHeader />
            </div>
            <div className="sticky top-0 z-10 hidden md:block">
              <Header />
            </div>
          </>
        )}
        <SnackbarController />
        {!chain?.unsupported ? (
          <main>{children}</main>
        ) : (
          <div className="flex flex-grow items-center justify-center text-center">
            <div className="space-y-2">
              <Typography className="max-w-md text-2xl text-white">
                {`The chain you're connected to isn't supported. Please
                check that your wallet is connected to fantom Mainnet.`}
              </Typography>
              <Button
                className="scale-90 rounded-3xl border border-solid border-green-300 bg-green-300 px-6 pt-3 pb-4 font-bold transition-all duration-300 hover:scale-95 hover:bg-emerald-300"
                variant="contained"
                onClick={() => switchNetwork?.()}
              >
                Switch to fantom
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
