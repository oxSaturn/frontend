import { useRouter } from "next/router";
import BigNumber from "bignumber.js";
import dayjs from "dayjs";

import { useGovToken, useVeToken } from "../../lib/global/queries";

import ExistingLock from "./existingLock";
import Unlock from "./unlock";
import Lock from "./lock";
import classes from "./ssVest.module.css";
import { useNftById } from "./lib/queries";

export default function Vest() {
  const router = useRouter();

  const { data: govToken } = useGovToken();
  const { data: veToken } = useVeToken();

  const { data: nft } = useNftById(router.query.id);

  return (
    <div className={classes.vestContainer}>
      {router.query.id === "create" && (
        <Lock govToken={govToken} veToken={veToken} />
      )}
      {router.query.id !== "create" &&
        nft &&
        BigNumber(nft.lockEnds).gte(dayjs().unix()) &&
        BigNumber(nft.lockEnds).gt(0) && (
          <ExistingLock nft={nft} govToken={govToken} veToken={veToken} />
        )}
      {router.query.id !== "create" &&
        nft &&
        BigNumber(nft.lockEnds).lt(dayjs().unix()) &&
        BigNumber(nft.lockEnds).gt(0) && (
          <Unlock nft={nft} govToken={govToken} veToken={veToken} />
        )}
    </div>
  );
}
