import Link from "next/link";

import { OPTIONS } from "../../stores/constants/constants";

export function Footer() {
  return (
    <footer className="w-full space-y-10 pt-20 pb-10">
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
      <div className="grid grid-cols-2 gap-5 px-5 sm:grid-cols-3 sm:max-w-md sm:mx-auto">
        <nav className="space-y-1">
          <h2 className="text-2xl">About</h2>
          <ul className="text-sm space-y-1">
            <li>
              <Link href="/claim" className="text-cyan-700 hover:underline">
                Claim
              </Link>
            </li>
            {[
              {
                text: "Docs",
                href: "https://docs.velocimeter.xyz/FVMtokenomics",
              },
              {
                text: "Coingecko",
                href: "https://www.geckoterminal.com/fantom/fvm/pools",
              },
            ].map(({ text, href }) => (
              <li key={text}>
                <Link href={href} className="text-cyan-700 hover:underline">
                  {text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav className="space-y-1">
          {/* options */}
          <h2 className="text-2xl">Options</h2>
          <ul className="text-sm space-y-1">
            {Object.keys(OPTIONS).map((option) => (
              <li key={option}>
                <Link
                  href={`/options/${option}`}
                  className="text-cyan-700 hover:underline"
                >
                  {option}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav className="space-y-1">
          <h2 className="text-2xl">Partners</h2>
          <ul className="text-sm space-y-1">
            {[
              {
                text: "sCANTO",
                href: "https://www.scanto.io/",
              },
              {
                text: "Stargate",
                href: "https://stargate.finance/transfer",
              },
            ].map((partner) => (
              <li key={partner.text}>
                <a
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-cyan-700 hover:underline"
                >
                  {partner.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
