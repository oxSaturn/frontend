import { useEffect, useState } from "react";
import {
  useAccount,
  useNetwork,
  useSwitchNetwork,
  useWalletClient,
} from "wagmi";
import Head from "next/head";
import { pulsechain } from "viem/chains";
import { Alert, AlertTitle, Button, Snackbar, Typography } from "@mui/material";

import Header from "../header/header";
import MobileHeader from "../header/mobileHeader";
import SnackbarController from "../snackbar/snackbarController";
import stores from "../../stores";
import { ACTIONS } from "../../stores/constants/constants";

import classes from "./layout.module.css";

export default function Layout({
  children,
  configure,
}: {
  children: React.ReactNode;
  configure?: boolean;
}) {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({ chainId: pulsechain.id });
  const { data: walletClient } = useWalletClient({
    chainId: pulsechain.id,
  });

  const [alert, setAlert] = useState(true);
  useEffect(() => {
    if (walletClient && address) {
      stores.dispatcher.dispatch({ type: ACTIONS.CONFIGURE_SS });
    }
  }, [walletClient, address]);

  return (
    <div className={classes.container}>
      <Head>
        <link rel="icon" href="/images/logo-icon.png" />
        <meta
          name="description"
          content="Velocimeter allows low cost, near 0 slippage trades on uncorrelated or tightly correlated assets built on pulsechain."
        />
        <meta name="og:title" content="Velocimeter" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <div className={classes.background} />
      <div className={classes.greyGlow} />
      <div className={classes.greenGlow} />
      <div className={classes.content}>
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
                check that your wallet is connected to pulsechain Mainnet.`}
              </Typography>
              <Button
                className="scale-90 rounded-3xl border border-solid border-green-300 bg-green-300 px-6 pt-3 pb-4 font-bold transition-all duration-300 hover:scale-95 hover:bg-emerald-300"
                variant="contained"
                onClick={() => switchNetwork?.()}
              >
                Switch to Pulse
              </Button>
            </div>
          </div>
        )}
      </div>
      {alert ? (
        <Snackbar
          open
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          className="max-w-md"
        >
          <Alert severity="warning" onClose={() => setAlert(false)}>
            <AlertTitle>Notice</AlertTitle>
            <div className="space-y-4">
              <p>
                oFLOW redemption discount has been temporarily decreased in
                preparation for the FLOW MAXXING gauge.
              </p>{" "}
              <p>
                We reccomend waiting for the gauge to go live before redeeming
                as the discount for zapping into the gauge will be setup back to
                50%
              </p>{" "}
              <p>
                The FLOW MAXXING gauge is designed to reward FLOW-PLS LPs by
                flowing PLS earned from oFLOW redemptions to stakers in that
                guage.
              </p>{" "}
              <p>
                Those who redeem now are paying PLS to those who redeem by
                zapping into the FLOW MAXXING gauge later.
              </p>{" "}
              <p>Transferring PLS from weak to strong hands.</p>{" "}
              <p>
                The FLOW MAXXING Gauge will also have the highest oFLOW APR of
                any gauge at all times & will give users access to the absolute
                best discounts on oFLOW redemptions.
              </p>
            </div>
          </Alert>
        </Snackbar>
      ) : null}
    </div>
  );
}
