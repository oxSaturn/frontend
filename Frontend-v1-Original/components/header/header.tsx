import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useAccount } from "wagmi";
import { Typography, Button, Badge, IconButton } from "@mui/material";
import { List, ArrowDropDown } from "@mui/icons-material";

import Navigation from "../navigation/navigation";
import Unlock from "../unlock/unlockModal";
import TransactionQueue from "../transactionQueue/transactionQueue";
import useScrollPosition from "../../hooks/useScrollPosition";
import { ACTIONS } from "../../stores/constants/constants";
import stores from "../../stores";
import { formatAddress } from "../../utils/utils";

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
  const { address } = useAccount();

  const [unlockOpen, setUnlockOpen] = useState(false);
  const [transactionQueueLength, setTransactionQueueLength] = useState(0);

  const [domain, setDomain] = useState<string>();

  const scrollPosition = useScrollPosition();

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

  const onAddressClicked = () => {
    setUnlockOpen(true);
  };

  const closeUnlock = () => {
    setUnlockOpen(false);
  };

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
            {process.env.NEXT_PUBLIC_CHAINID === "740" && (
              <div>
                <Typography className="rounded-xl border border-cantoGreen bg-[#0e110c] p-4 text-sm">
                  Testnet
                </Typography>
              </div>
            )}
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
            {address ? (
              <Button
                disableElevation
                className="flex min-h-[40px] items-center rounded-3xl border border-solid border-cantoGreen border-opacity-60 bg-deepPurple px-4 text-[rgba(255,255,255,0.87)] opacity-90 sm:min-h-[50px]"
                variant="contained"
                color="primary"
                aria-controls="simple-menu"
                aria-haspopup="true"
                onClick={onAddressClicked}
              >
                <Typography className="text-sm font-bold">
                  {domain ?? formatAddress(address)}
                </Typography>
                <ArrowDropDown className="ml-1 -mr-2 -mt-1 text-secondaryGray" />
              </Button>
            ) : (
              <Button
                disableElevation
                className="flex min-h-[40px] items-center rounded-3xl border-none bg-deepPurple px-4 text-[rgba(255,255,255,0.87)] sm:min-h-[50px]"
                variant="contained"
                color={"primary"}
                onClick={onAddressClicked}
              >
                <Typography className="text-sm font-bold">
                  Connect Wallet
                </Typography>
              </Button>
            )}
          </div>
          {unlockOpen && (
            <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />
          )}
          <TransactionQueue setQueueLength={setQueueLength} />
        </div>
      </div>
    </>
  );
}

export default Header;
