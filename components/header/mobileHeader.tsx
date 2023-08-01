import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Badge, Drawer, IconButton } from "@mui/material";
import { Close, List, Menu as MenuIcon } from "@mui/icons-material";

import Navigation from "../navigation/navigation";
import TransactionQueue, {
  useTransactionStore,
} from "../transactionQueue/transactionQueue";

import { GOV_TOKEN_SYMBOL } from "../../stores/constants/contracts";

import Info from "./info";
import { ConnectButton } from "./ConnectButton";

function SiteLogo(props: { className?: string }) {
  const { className } = props;
  return (
    <Image
      className={className}
      src={`/images/only_${GOV_TOKEN_SYMBOL.toLowerCase()}_blue.png`}
      alt={`${GOV_TOKEN_SYMBOL} by velocimeter logo`}
      height={357}
      width={1200}
    />
  );
}

function Header() {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const { openQueue, transactions } = useTransactionStore();

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
            <SiteLogo className="h-[38px] w-auto" />
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
            className: "flex flex-col items-start py-5 px-6",
          }}
          data-rk
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-5 right-5 flex h-[40px] cursor-pointer items-center"
          >
            <Close />
          </button>
          <div className="flex items-center gap-2">
            <ConnectButton />
            {transactions.length > 0 && (
              <IconButton
                className="flex min-h-[40px] items-center rounded-none border-none bg-[rgba(224,232,255,0.05)] px-4 text-[rgba(255,255,255,0.87)] sm:min-h-[50px]"
                color="primary"
                onClick={() => openQueue()}
              >
                <Badge
                  badgeContent={transactions.length}
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
          </div>
          <div className="h-10"></div>
          <Navigation />
          <div className="h-10"></div>
          <Info />
          <TransactionQueue />
        </Drawer>
      </div>
    </>
  );
}

export default Header;
