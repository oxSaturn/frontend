import { useQuery } from "@tanstack/react-query";
import { Address, deserialize, serialize, useAccount } from "wagmi";
import { formatUnits } from "viem";

import viemClient from "../../../stores/connectors/viem";
import { GovToken, VeToken, VestNFT } from "../../../stores/types/types";
import { CONTRACTS } from "../../../stores/constants/constants";
import { useActivePeriod } from "../../header/lib/queries";
import {
  checkNFTActionEpoch,
  useGovToken,
  useVeToken,
  useVestNfts,
} from "../../../lib/global/queries";

export function useNftById(id: string | string[] | undefined) {
  const { address } = useAccount();
  const { data: activePeriod } = useActivePeriod();
  const { data: vestNFTs } = useVestNfts();
  const serialised_vestNFTs = serialize(vestNFTs);
  const { data: veToken } = useVeToken();
  const { data: govToken } = useGovToken();
  return useQuery({
    queryKey: [
      "nftById",
      address,
      activePeriod,
      serialised_vestNFTs,
      veToken,
      govToken,
      id,
    ],
    queryFn: () =>
      getNFTByID(address, {
        id,
        serialised_vestNFTs,
        veToken,
        govToken,
        activePeriod,
      }),
    enabled:
      !!address &&
      !!activePeriod &&
      !!vestNFTs &&
      !!veToken &&
      !!govToken &&
      !!id &&
      !Array.isArray(id) &&
      id !== "0",
  });
}

const getNFTByID = async (
  address: Address | undefined,
  options: {
    id: string | string[] | undefined;
    serialised_vestNFTs: string;
    veToken: VeToken | undefined;
    govToken: GovToken | undefined;
    activePeriod: number | undefined;
  }
) => {
  const { id, serialised_vestNFTs, veToken, govToken, activePeriod } = options;

  const vestNFTs = deserialize(serialised_vestNFTs) as VestNFT[] | undefined;

  if (!id || Array.isArray(id) || id === "0") {
    throw new Error("id is incorrect");
  }

  let theNFT = vestNFTs?.filter((vestNFT) => {
    return vestNFT.id == id;
  });

  if (theNFT && theNFT.length > 0) {
    return theNFT[0];
  }

  if (!address) {
    console.warn("address not found");
    throw new Error("no address");
  }

  if (!veToken || !govToken) {
    console.warn("veToken or govToken not found");
    throw new Error("no veToken or govToken");
  }

  if (!activePeriod) {
    console.warn("activePeriod not found");
    throw new Error("no activePeriod");
  }

  const vestingContract = {
    abi: CONTRACTS.VE_TOKEN_ABI,
    address: CONTRACTS.VE_TOKEN_ADDRESS,
  } as const;

  const nftsLength = await viemClient.readContract({
    ...vestingContract,
    functionName: "balanceOf",
    args: [address],
  });
  const arr = Array.from(
    { length: parseInt(nftsLength.toString()) },
    (v, i) => i
  );

  const nfts: VestNFT[] = await Promise.all(
    arr.map(async (idx) => {
      const tokenIndex = await viemClient.readContract({
        ...vestingContract,
        functionName: "tokenOfOwnerByIndex",
        args: [address, BigInt(idx)],
      });
      const [[lockedAmount, lockedEnd], lockValue, voted, totalSupply] =
        await viemClient.multicall({
          allowFailure: false,
          contracts: [
            {
              ...vestingContract,
              functionName: "locked",
              args: [tokenIndex],
            },
            {
              ...vestingContract,
              functionName: "balanceOfNFT",
              args: [tokenIndex],
            },
            {
              ...vestingContract,
              functionName: "voted",
              args: [tokenIndex],
            },
            {
              ...vestingContract,
              functionName: "totalSupply",
            },
          ],
        });

      const [votedInCurrentEpoch, lastVoted] = await checkNFTActionEpoch(
        activePeriod,
        tokenIndex.toString()
      );

      return {
        id: tokenIndex.toString(),
        lockEnds: lockedEnd.toString(),
        lockAmount: formatUnits(lockedAmount, govToken.decimals),
        lockValue: formatUnits(lockValue, veToken.decimals),
        votedInCurrentEpoch,
        reset:
          (!votedInCurrentEpoch && lastVoted > 0n && voted === false) ||
          lastVoted === 0n,
        lastVoted,
        influence:
          Number(formatUnits(lockValue, veToken.decimals)) /
          Number(formatUnits(totalSupply, veToken.decimals)),
      };
    })
  );

  theNFT = nfts.filter((nft) => {
    return nft.id == id;
  });

  if (theNFT.length > 0) {
    return theNFT[0];
  }
};
