import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Drawer } from "@mui/material";
import { Close, Menu as MenuIcon } from "@mui/icons-material";

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

  useEffect(() => {
    setOpen(false);
  }, [router.asPath]);

  return (
    <>
      <div className="relative top-0 z-10 flex w-full flex-col gap-2 border-b-0 border-none">
        <div className="flex items-center justify-between px-5">
          <a
            onClick={() => router.push("/home")}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-[40px] py-5"
          >
            <SiteLogo />
          </a>
          <button onClick={() => setOpen((prev) => !prev)}>
            {open ? <Close /> : <MenuIcon />}
          </button>
        </div>
        <Drawer
          anchor="right"
          open={open}
          onClose={() => setOpen(false)}
          className="relative md:hidden"
          PaperProps={{
            className: "flex flex-col items-start py-5 px-6 space-y-2",
          }}
          data-rk
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-0 right-6 flex h-[78px] cursor-pointer items-center"
          >
            <Close />
          </button>
          <ConnectButton />
          <Navigation />
          <Info />
          {/* <TransactionQueue /> */}
        </Drawer>
      </div>
    </>
  );
}

export default Header;
