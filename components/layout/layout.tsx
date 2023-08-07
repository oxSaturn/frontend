import Head from "next/head";
import Link from "next/link";

import Header from "../header/header";
import MobileHeader from "../header/mobileHeader";
import SnackbarController from "../snackbar/snackbarController";
import { GOV_TOKEN_SYMBOL } from "../../stores/constants/contracts";
import { chainToConnect } from "../../stores/constants/constants";

export default function Layout({
  children,
  configure,
}: {
  children: React.ReactNode;
  configure?: boolean;
}) {
  return (
    <div className="relative flex h-full min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden md:overflow-x-auto lg:flex-row">
      <Head>
        <link rel="icon" href="/images/logo-icon.png" />
        <meta
          name="description"
          content={`${GOV_TOKEN_SYMBOL} by Velocimeter allows low cost, near 0 slippage trades on uncorrelated or tightly correlated assets built on ${chainToConnect.name}.`}
        />
        <meta name="og:title" content={GOV_TOKEN_SYMBOL} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <div className="pointer-events-none fixed left-0 bottom-0 top-0 -z-10 w-screen bg-appBackground bg-cover bg-no-repeat xs:bg-waves" />
      <div className="flex h-full min-h-screen flex-[1] flex-col">
        {!configure && (
          <>
            <div className="block md:hidden">
              <MobileHeader />
            </div>
            <div className="hidden md:block">
              <Header />
            </div>
          </>
        )}
        <SnackbarController />
        <main className="flex flex-grow flex-col sm:pt-10">{children}</main>
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
