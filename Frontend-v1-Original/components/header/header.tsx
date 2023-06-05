import React, { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Typography, Badge, IconButton } from "@mui/material";
import { List } from "@mui/icons-material";

import Navigation from "../navigation/navigation";
import TransactionQueue from "../transactionQueue/transactionQueue";
import useScrollPosition from "../../hooks/useScrollPosition";
import { ACTIONS } from "../../stores/constants/constants";
import stores from "../../stores";

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

  const [transactionQueueLength, setTransactionQueueLength] = useState(0);

  const scrollPosition = useScrollPosition();

  const setQueueLength = (length: number) => {
    setTransactionQueueLength(length);
  };

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
                    "& .MuiBadge-badge": {
                      background: "#06D3D7",
                      color: "#000",
                    },
                  }}
                >
                  <List className="text-white" />
                </Badge>
              </IconButton>
            )}
            <ConnectButton />
          </div>
          <TransactionQueue setQueueLength={setQueueLength} />
        </div>
      </div>
    </>
  );
}

export default Header;
