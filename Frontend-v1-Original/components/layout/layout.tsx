import { useNetwork, useSwitchNetwork } from "wagmi";
import Head from "next/head";
import { fantom } from "viem/chains";
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
      <div className="pointer-events-none fixed left-0 bottom-0 top-0 right-0 -z-10 hidden h-full w-full bg-waves bg-cover bg-no-repeat xs:block" />
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
        <footer className="w-full space-y-3 pt-20 pb-10">
          <div className="px-5 text-center text-sm text-white/70">
            Velocimeter is partnered with{" "}
            <a
              href="https://layerzero.network/"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              <img
                alt="LayerZero"
                src="/images/lz-logo-black.svg"
                className="mx-1 inline-block w-[80px]"
              />
            </a>{" "}
            in support of their tokens, including{" "}
            <a
              href="https://ftmscan.com/address/0x28a92dde19D9989F39A49905d7C9C2FAc7799bDf"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-cyan-700 hover:underline"
            >
              USDC
            </a>
            ,{" "}
            <a
              href="https://ftmscan.com/address/0xcc1b99dDAc1a33c201a742A1851662E87BC7f22C"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-cyan-700 hover:underline"
            >
              USDT
            </a>
            ,{" "}
            <a
              href="https://ftmscan.com/address/0xf1648C50d2863f780c57849D812b4B7686031A3D"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-cyan-700 hover:underline"
            >
              WBTC
            </a>{" "}
            and{" "}
            <a
              href="https://ftmscan.com/address/0x695921034f0387eAc4e11620EE91b1b15A6A09fE"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-cyan-700 hover:underline"
            >
              WETH
            </a>
            .
          </div>
          <nav className="flex justify-center gap-x-3  text-sm">
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
              {
                href: "https://stargate.finance/transfer",
                text: "Stargate",
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
          </nav>
        </footer>
      </div>
    </div>
  );
}
