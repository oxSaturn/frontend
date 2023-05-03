import { useQuery } from "@tanstack/react-query";
import { Address, formatEther, isAddress } from "viem";

import viemClient from "../../stores/connectors/viem";
import { CONTRACTS } from "../../stores/constants/constants";

const NOTE = {
  address: "0x4e71A2E537B7f9D9413D3991D37958c0b5e1e503",
  logoURI:
    "https://assets.slingshot.finance/icons/canto_0x4e71a2e537b7f9d9413d3991d37958c0b5e1e503",
  symbol: "NOTE",
} as const;

// uint256 public immutable MAX_PROJECT_TOKENS_TO_DISTRIBUTE; // max PROJECT_TOKEN amount to distribute during the sale
// MIN_TOTAL_RAISED_FOR_MAX_PROJECT_TOKEN; // amount to reach to distribute max PROJECT_TOKEN amount
// MAX_RAISE: maximum amount of NOTE you can raise

const getLaunchpadProject = async (projectAddress: Address | undefined) => {
  if (!projectAddress) {
    return;
  }

  const fairAuctionContract = {
    address: projectAddress,
    abi: CONTRACTS.FAIR_AUCTION_ABI,
  } as const;

  const [
    hasStarted,
    hasEnded,
    projectTokenAddress,
    remainingTime,
    totalRaised,
    maxProjectsToDistribute,
    minTotalRaisedForMaxProjectToken,
    maxRaiseAmount,
  ] = await viemClient.multicall({
    allowFailure: false,
    multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
    contracts: [
      {
        ...fairAuctionContract,
        functionName: "hasStarted",
      },
      {
        ...fairAuctionContract,
        functionName: "hasEnded",
      },
      {
        ...fairAuctionContract,
        functionName: "PROJECT_TOKEN",
      },
      {
        ...fairAuctionContract,
        functionName: "getRemainingTime",
      },
      {
        ...fairAuctionContract,
        functionName: "totalRaised",
      },
      {
        ...fairAuctionContract,
        functionName: "MAX_PROJECT_TOKENS_TO_DISTRIBUTE",
      },
      {
        ...fairAuctionContract,
        functionName: "MIN_TOTAL_RAISED_FOR_MAX_PROJECT_TOKEN",
      },
      {
        ...fairAuctionContract,
        functionName: "MAX_RAISE",
      },
    ],
  });

  const tokenSymbol = await viemClient.readContract({
    address: projectTokenAddress,
    abi: CONTRACTS.ERC20_ABI,
    functionName: "symbol",
  });

  return {
    tokenSymbol,
    hasStarted,
    hasEnded,
    remainingTime,
    totalRaised,
    maxProjectsToDistribute,
    minTotalRaisedForMaxProjectToken,
    maxRaiseAmount,
  };
};

export const useLaunchpadProject = (address: string | string[] | undefined) => {
  const addy =
    address && !Array.isArray(address) && isAddress(address)
      ? address
      : undefined;
  return useQuery({
    queryKey: ["launchpadProject", addy],
    queryFn: () => getLaunchpadProject(addy),
    enabled: !!addy,
  });
};

const getNoteAsset = async (address: Address | null | undefined) => {
  if (!address) {
    return;
  }

  const noteBalance = await viemClient.readContract({
    address: NOTE.address,
    abi: CONTRACTS.ERC20_ABI,
    functionName: "balanceOf",
    args: [address],
  });

  const noteAsset = {
    ...NOTE,
    balance: formatEther(noteBalance),
  };

  return noteAsset;
};

export const useNoteAsset = (address: Address | null | undefined) => {
  return useQuery({
    queryKey: ["noteAsset", address],
    queryFn: () => getNoteAsset(address),
    enabled: !!address,
    initialData: {
      ...NOTE,
      balance: "0",
    },
  });
};
