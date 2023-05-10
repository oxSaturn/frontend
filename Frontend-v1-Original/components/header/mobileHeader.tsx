import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Badge, IconButton } from "@mui/material";
import { List, Menu as MenuIcon } from "@mui/icons-material";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import Navigation from "../navigation/navigation";
// import TransactionQueue from "../transactionQueue/transactionQueue";
import { ACTIONS } from "../../stores/constants/constants";
import stores from "../../stores";

import Info from "./info";

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

  const [transactionQueueLength] = useState(0);
  const [domain, setDomain] = useState<string>();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ssUpdated = () => {
      const domain = stores.stableSwapStore.getStore("u_domain");
      setDomain(domain);
    };

    ssUpdated();

    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [router.asPath]);

  // const setQueueLength = (length: number) => {
  //   setTransactionQueueLength(length);
  // };

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
          <ConnectButton showBalance={false} accountStatus="address" />
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
          {transactionQueueLength > 0 && (
            <IconButton
              className="flex min-h-[40px] items-center rounded-3xl border-none bg-deepPurple px-4 text-[rgba(255,255,255,0.87)] sm:min-h-[50px]"
              color="primary"
              onClick={() => {
                stores.emitter.emit(ACTIONS.TX_OPEN);
              }}
            >
              <Badge
                badgeContent={transactionQueueLength}
                color="secondary"
                overlap="circular"
                sx={{
                  badge: {
                    background: "#06D3D7",
                    color: "#000",
                  },
                }}
              >
                <List className="text-white" />
              </Badge>
            </IconButton>
          )}
          {/* <TransactionQueue setQueueLength={setQueueLength} /> */}
        </div>
      </div>
    </>
  );
}

export default Header;
