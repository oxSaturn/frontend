import { useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import Head from "next/head";
import { canto } from "viem/chains";

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
  const { data: walletClient } = useWalletClient({
    chainId: canto.id,
  });
  useEffect(() => {
    if (walletClient && address) {
      stores.accountStore.setStore({ walletClient });
      stores.accountStore.setStore({ address });
      stores.dispatcher.dispatch({ type: ACTIONS.CONFIGURE_SS });
    }
  }, [walletClient, address]);

  return (
    <div className={classes.container}>
      <Head>
        <link rel="icon" href="/images/logo-icon.png" />
        <link
          rel="preload"
          href="/fonts/Inter/Inter-Regular.ttf"
          as="font"
          crossOrigin=""
        />
        <meta
          name="description"
          content="Velocimeter allows low cost, near 0 slippage trades on uncorrelated or tightly correlated assets built on Canto."
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
        <main>{children}</main>
      </div>
    </div>
  );
}
