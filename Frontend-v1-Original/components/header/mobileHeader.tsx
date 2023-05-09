import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useAccount } from "wagmi";
import {
  Typography,
  Button,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  List,
  ArrowDropDown,
  AccountBalanceWalletOutlined,
  Menu as MenuIcon,
} from "@mui/icons-material";

import Navigation from "../navigation/navigation";
import Unlock from "../unlock/unlockModal";
// import TransactionQueue from "../transactionQueue/transactionQueue";
import useOnClickOutside from "../../hooks/useOnClickOutside";
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
  const [transactionQueueLength] = useState(0);
  const [domain, setDomain] = useState<string>();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // useOnClickOutside(ref, () => setOpen(false));

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

  const onAddressClicked = () => {
    setUnlockOpen(true);
  };

  const closeUnlock = () => {
    setUnlockOpen(false);
  };

  // const setQueueLength = (length: number) => {
  //   setTransactionQueueLength(length);
  // };

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
          {address ? (
            <>
              <Button
                disableElevation
                className="flex min-h-[40px] items-center rounded-3xl border border-solid border-cantoGreen border-opacity-60 bg-[#040105] px-4 text-[rgba(255,255,255,0.87)] opacity-90 sm:min-h-[50px]"
                variant="contained"
                color="primary"
                aria-controls="simple-menu"
                aria-haspopup="true"
                onClick={handleClick}
              >
                <Typography className="text-sm font-bold">
                  {domain ?? formatAddress(address)}
                </Typography>
                <ArrowDropDown className="ml-1 -mr-2 -mt-1 text-[#7e99b0]" />
              </Button>
              <Menu
                elevation={0}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                id="customized-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem
                  onClick={onAddressClicked}
                  sx={{
                    root: {
                      "&:focus": {
                        backgroundColor: "none",
                        "& .MuiListItemIcon-root, & .MuiListItemText-primary": {
                          color: "#FFF",
                        },
                      },
                    },
                  }}
                >
                  <ListItemIcon className="p-0 text-cantoGreen">
                    <AccountBalanceWalletOutlined fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Switch Wallet Provider" />
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              disableElevation
              className="flex min-h-[40px] items-center rounded-3xl border-none bg-[#040105] px-4 text-[rgba(255,255,255,0.87)] sm:min-h-[50px]"
              variant="contained"
              color={"primary"}
              onClick={onAddressClicked}
            >
              <Typography className="text-sm font-bold">
                Connect Wallet
              </Typography>
            </Button>
          )}
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
              className="flex min-h-[40px] items-center rounded-3xl border-none bg-[#040105] px-4 text-[rgba(255,255,255,0.87)] sm:min-h-[50px]"
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
          {unlockOpen && (
            <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />
          )}
          {/* <TransactionQueue setQueueLength={setQueueLength} /> */}
        </div>
      </div>
    </>
  );
}

export default Header;
