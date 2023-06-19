import { useAccount, useNetwork } from "wagmi";
import { Button, Typography } from "@mui/material";
import {
  ConnectButton as RainbowKitConnectButton,
  useAccountModal,
} from "@rainbow-me/rainbowkit";

import { useDomain } from "./lib/queries";

export function ConnectButton() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { openAccountModal } = useAccountModal();

  const { data: domain } = useDomain(address);

  return address && !chain?.unsupported && domain ? (
    <Button
      disableElevation
      className="flex min-h-[40px] items-center rounded-3xl border border-solid border-cantoGreen border-opacity-60 bg-deepPurple px-4 text-[rgba(255,255,255,0.87)] opacity-90 sm:min-h-[50px]"
      variant="contained"
      color="primary"
      aria-controls="simple-menu"
      aria-haspopup="true"
      onClick={openAccountModal}
    >
      <Typography className="text-sm font-bold">{domain}</Typography>
    </Button>
  ) : (
    <RainbowKitConnectButton showBalance={false} accountStatus="address" />
  );
}
