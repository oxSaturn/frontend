import { Typography } from "@mui/material";

import { useGovToken, useVeToken, useVestNfts } from "../../lib/global/queries";
import { GOV_TOKEN_SYMBOL } from "../../stores/constants/contracts";

import PartnersVests from "./partnersVests";
import VestsTable from "./ssVestsTable";

export default function Vests() {
  const { data: govToken } = useGovToken();
  const { data: veToken } = useVeToken();
  const { data: vestNFTs } = useVestNfts();

  return (
    <div className="m-auto mb-5 flex w-[calc(100%-40px)] max-w-[1400px] flex-col items-end p-0 pb-2 xl:mb-14 xl:w-[calc(100%-180px)] xl:pt-0">
      <div className="flex flex-col gap-1 self-start text-left">
        <Typography variant="h1">Vest</Typography>
        <Typography variant="body2">
          Lock {GOV_TOKEN_SYMBOL} into ve{GOV_TOKEN_SYMBOL} to earn and govern.
          Vote with ve{GOV_TOKEN_SYMBOL} to earn bribes and trading fees. ve
          {GOV_TOKEN_SYMBOL} can be transferred, merged and split. You can hold
          multiple positions.
        </Typography>
      </div>
      <VestsTable vestNFTs={vestNFTs} govToken={govToken} veToken={veToken} />
      <PartnersVests />
    </div>
  );
}
