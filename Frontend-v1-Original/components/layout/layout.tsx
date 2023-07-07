import { useNetwork, useSwitchNetwork } from "wagmi";
import Head from "next/head";
import { pulsechain } from "viem/chains";
import { Button, Typography } from "@mui/material";

import Link from "next/link";

import Header from "../header/header";
import MobileHeader from "../header/mobileHeader";
import SnackbarController from "../snackbar/snackbarController";

import classes from "./layout.module.css";

export default function Layout({
  children,
  configure,
}: {
  children: React.ReactNode;
  configure?: boolean;
}) {
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({ chainId: pulsechain.id });

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
            <div className="z-10 hidden md:block">
              <Header />
            </div>
          </>
        )}
        <SnackbarController />
        {!chain?.unsupported ? (
          <main className="flex flex-grow flex-col">{children}</main>
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
        <footer className="mx-auto flex gap-x-3 pt-20 pb-10 text-sm">
          <Link href="/claim" className="text-cyan-700 hover:underline">
            Claim
          </Link>
          {[
            {
              href: "https://www.scanto.io/",
              text: "sCANTO",
            },
            {
              href: "https://docs.velocimeter.xyz/FVMtokenomics",
              text: "Docs",
            },
            {
              href: "https://www.geckoterminal.com/fantom/fvm/pools",
              text: "Coingecko",
            },
          ].map(({ href, text }, index) => (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-700 hover:underline"
            >
              {text}
            </a>
          ))}
        </footer>
      </div>
    </div>
  );
}
