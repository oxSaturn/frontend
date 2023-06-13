import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Menu as MenuIcon } from "@mui/icons-material";

import Navigation from "../navigation/navigation";
// import TransactionQueue from "../transactionQueue/transactionQueue";

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

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [router.asPath]);

  return (
    <>
      <div className="relative top-0 z-10 flex w-full flex-col gap-2 border-b-0 border-none">
        <a
          onClick={() => router.push("/home")}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-[40px] py-1"
        >
          <SiteLogo />
        </a>
        <div className="flex justify-between px-6">
          <ConnectButton />
          <button onClick={() => setOpen((prev) => !prev)}>
            <MenuIcon />
          </button>
        </div>
        <div
          ref={ref}
          className={`${
            open ? "" : "hidden"
          } absolute top-[105%] right-2 z-10 flex w-80 animate-slideLeftAndFade flex-col items-start justify-between rounded-sm border-none bg-[#0d3531] py-5 px-6 shadow-md shadow-cantoGreen`}
        >
          <Navigation />
          <Info />
          {/* <TransactionQueue /> */}
        </div>
      </div>
    </>
  );
}

export default Header;
