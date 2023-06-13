import { useRouter } from "next/router";
import Image from "next/image";
import { Typography } from "@mui/material";

import Navigation from "../navigation/navigation";
import TransactionQueue from "../transactionQueue/transactionQueue";
import useScrollPosition from "../../hooks/useScrollPosition";

import Info from "./info";
import { ConnectButton } from "./ConnectButton";

function SiteLogo(props: { className?: string }) {
  const { className } = props;
  return (
    <Image
      className={className}
      src="/images/vcm_logo.png"
      alt="velocimeter logo"
      height={38}
      width={256}
    />
  );
}

function Header() {
  const router = useRouter();

  const scrollPosition = useScrollPosition();

  return (
    <>
      <div
        className={`grid w-full grid-flow-row border-cantoGreen border-opacity-50 transition-all duration-200 ${
          scrollPosition > 0
            ? "border-b-[0.25px] bg-[rgba(0,0,0,0.973)] opacity-90 backdrop-blur-2xl"
            : "border-b-0 border-none"
        }`}
      >
        <Info />
        <div className="flex min-h-[60px] items-center justify-between rounded-none border-none py-5 px-8 md:max-[1200px]:flex-col">
          <a
            onClick={() => router.push("/home")}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-[40px] py-1"
          >
            <SiteLogo />
          </a>
          <Navigation />
          <div className="flex justify-end gap-1 md:max-[1200px]:w-full md:max-[1200px]:items-end md:max-[1200px]:px-8 xl:w-[260px]">
            {process.env.NEXT_PUBLIC_CHAINID === "740" && (
              <div>
                <Typography className="rounded-xl border border-cantoGreen bg-[#0e110c] p-4 text-sm">
                  Testnet
                </Typography>
              </div>
            )}
            <ConnectButton />
          </div>
          <TransactionQueue />
        </div>
      </div>
    </>
  );
}

export default Header;
