import Head from "next/head";
import Link from "next/link";

import Header from "../header/header";
import MobileHeader from "../header/mobileHeader";
import SnackbarController from "../snackbar/snackbarController";
import { GOV_TOKEN_SYMBOL } from "../../stores/constants/contracts";

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
          content={`${GOV_TOKEN_SYMBOL} by Velocimeter allows low cost, near 0 slippage trades on uncorrelated or tightly correlated assets built on fantom.`}
        />
        <meta name="og:title" content={GOV_TOKEN_SYMBOL} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <div className="pointer-events-none fixed left-0 bottom-0 top-0 -z-10 w-screen bg-appBackground bg-cover bg-no-repeat xs:bg-waves" />
      <div className="flex h-full min-h-screen flex-[1] flex-col">
        {!configure && (
          <>
            <div className="text-center py-2 bg-[#587B7F] px-5 md:px-0 font-sono">
              Airdrop on Base and Mantle chains coming! Lock ve
              {GOV_TOKEN_SYMBOL} with{" "}
              <Link href="/veboost" className="underline">
                veBoost
              </Link>{" "}
              to qualify.
            </div>
            <div className="block md:hidden">
              <MobileHeader />
            </div>
            <div className="z-10 hidden md:block">
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
                href: "https://stargate.finance/transfer",
                text: "Stargate",
              },
              {
                Child: ({ className }: { className: string }) => (
                  <Link href="/claim" className={className}>
                    Claim
                  </Link>
                ),
              },
              {
                href: "https://www.scanto.io/",
                text: "sCANTO",
              },
              {
                href: "https://docs.velocimeter.xyz/FVMtokenomics",
                text: "Docs",
              },
              {
                href: "https://www.geckoterminal.com/ftm/velocimeter-fantom/pools",
                text: "Coingecko",
              },
              {
                Child: ({ className }: { className: string }) => (
                  <Link href="/squid-bridge" className={className}>
                    SquidRouter
                  </Link>
                ),
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
        </footer>
      </div>
    </div>
  );
}
