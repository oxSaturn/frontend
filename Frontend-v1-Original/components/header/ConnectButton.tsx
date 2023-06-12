import { useAccount, useNetwork } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { Button, Typography } from "@mui/material";
import {
  ConnectButton as RainbowKitConnectButton,
  useAccountModal,
} from "@rainbow-me/rainbowkit";

import { QUERY_KEYS } from "../../stores/constants/constants";

export function ConnectButton() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { openAccountModal } = useAccountModal();

  const { data: domain } = useQuery({
    queryKey: [QUERY_KEYS.DOMAIN, address],
    queryFn: () => resolveUnstoppableDomain(address),
  });

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

const resolveUnstoppableDomain = async (address: `0x${string}` | undefined) => {
  if (!address) return null;
  const res = await fetch("/api/u-domains", {
    method: "POST",
    body: JSON.stringify({
      address,
    }),
  });
  const resJson = (await res.json()) as { domain: string };
  if (!resJson?.domain || resJson?.domain === "") return null;
  return resJson?.domain as string;
};
