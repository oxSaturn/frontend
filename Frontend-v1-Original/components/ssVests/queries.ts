import { type Address, useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useQuery } from "@tanstack/react-query";

import { GovToken, VeToken, VestNFT } from "../../stores/types/types";
import { useGovToken, useVeToken } from "../../lib/global/queries";
import { useActivePeriod } from "../header/queries";

import viemClient from "../../stores/connectors/viem";
import { CONTRACTS, QUERY_KEYS } from "../../stores/constants/constants";

const checkNFTLastVoted = async (tokenID: string) => {
  const _lastVoted = await viemClient.readContract({
    address: CONTRACTS.VOTER_ADDRESS,
    abi: CONTRACTS.VOTER_ABI,
    functionName: "lastVoted",
    args: [BigInt(tokenID)],
  });
  return _lastVoted;
};

const checkNFTActionEpoch = async (
  nextEpochTimestamp: number,
  tokenID: string
) => {
  const _lastVoted = await checkNFTLastVoted(tokenID);

  // if last voted eq 0, means never voted
  if (_lastVoted === BigInt("0")) return [false, _lastVoted] as const;
  const lastVoted = parseInt(_lastVoted.toString());

  // 7 days epoch length
  const actionedInCurrentEpoch =
    lastVoted > nextEpochTimestamp - 7 * 24 * 60 * 60;
  return [actionedInCurrentEpoch, _lastVoted] as const;
};

const getVestNFTs = async (
  address: Address | undefined,
  govToken: GovToken | undefined,
  veToken: VeToken | undefined,
  activePeriod: number
) => {
  if (!veToken || !govToken || !address) {
    return [];
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
          multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
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

      const [actionedInCurrentEpoch, lastVoted] = await checkNFTActionEpoch(
        activePeriod,
        tokenIndex.toString()
      );

      return {
        id: tokenIndex.toString(),
        lockEnds: lockedEnd.toString(),
        lockAmount: formatUnits(lockedAmount, govToken.decimals),
        lockValue: formatUnits(lockValue, veToken.decimals),
        actionedInCurrentEpoch,
        reset: actionedInCurrentEpoch && !voted,
        lastVoted,
        influence:
          Number(formatUnits(lockValue, veToken.decimals)) /
          Number(formatUnits(totalSupply, veToken.decimals)),
      };
    })
  );

  return nfts;
};

export const useVestNfts = () => {
  const { address } = useAccount();
  const { data: govToken } = useGovToken();
  const { data: veToken } = useVeToken();
  const { data: activePeriod } = useActivePeriod();
  return useQuery({
    queryKey: [QUERY_KEYS.VEST_NFTS, address, govToken, veToken, activePeriod],
    queryFn: () => getVestNFTs(address, govToken, veToken, activePeriod!), // enabled only when activePeriod is defined
    enabled: !!govToken && !!veToken && !!activePeriod,
  });
};
