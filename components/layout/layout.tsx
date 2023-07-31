import { useNetwork, useSwitchNetwork } from "wagmi";
import Head from "next/head";
import { base } from "viem/chains";
import { Button, Typography } from "@mui/material";

import Link from "next/link";

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
  const { switchNetwork } = useSwitchNetwork({ chainId: base.id });

  return (
    <div className="relative flex h-full min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden md:overflow-x-auto lg:flex-row">
      <Head>
        <link rel="icon" href="/images/logo-icon.png" />
        <meta
          name="description"
          content="BVM by Velocimeter allows low cost, near 0 slippage trades on uncorrelated or tightly correlated assets built on base."
        />
        <meta name="og:title" content="BVM" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <div className="pointer-events-none fixed left-0 bottom-0 top-0 -z-10 w-screen bg-appBackground bg-cover bg-no-repeat xs:bg-waves" />
      <div className="flex h-full min-h-screen flex-[1] flex-col">
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
          <main className="flex flex-grow flex-col sm:pt-10">{children}</main>
        ) : (
          <div className="flex flex-grow items-center justify-center text-center">
            <div className="space-y-2">
              <Typography className="max-w-md text-2xl text-white">
                {`The chain you're connected to isn't supported. Please
                check that your wallet is connected to Base Mainnet.`}
              </Typography>
              <Button
                className="scale-90 rounded-3xl border border-solid border-green-300 bg-green-300 px-6 pt-3 pb-4 font-bold transition-all duration-300 hover:scale-95 hover:bg-emerald-300"
                variant="contained"
                onClick={() => switchNetwork?.()}
              >
                Switch to Base
              </Button>
            </div>
          </div>
        )}
        <footer className="w-full space-y-3 pt-20 pb-10">
          <nav className="flex justify-center gap-x-3  text-sm">
            {[
              {
                Child: ({ className }: { className: string }) => (
                  <Link href="/claim" className={className}>
                    Claim
                  </Link>
                ),
              },
              {
                Child: ({ className }: { className: string }) => (
                  <Link href="/squid-bridge" className={className}>
                    Squid Bridge
                  </Link>
                ),
              },
              {
                href: "https://www.scanto.io/",
                text: "sCANTO",
              },
              {
                href: "https://docs.velocimeter.xyz/",
                text: "Docs",
              },
              {
                href: "https://www.geckoterminal.com/base/velocimeter-base/pools",
                text: "Coingecko",
              },
            ].map(({ href, text, Child }, index) =>
              Child ? (
                <Child key={index} className="text-cyan-700 hover:underline" />
              ) : (
                <a
                  key={index}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-700 hover:underline"
                >
                  {text}
                </a>
              )
            )}
          </nav>
          <div className="mx-auto flex gap-x-5 justify-center">
            <a
              href="https://discord.gg/FMEPSnzUJ2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/discord-mark-white.svg"
                alt="Discord"
                className="w-auto h-6"
              />
            </a>
            <a
              href="https://twitter.com/velocimeterdex"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/Logo_of_Twitter.svg"
                alt="Twitter"
                className="w-6 h-6"
              />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
