import { useQuery } from "@tanstack/react-query";
import { Address, formatEther, formatUnits, isAddress } from "viem";

import viemClient from "../../stores/connectors/viem";
import { CONTRACTS } from "../../stores/constants/constants";

const NOTE = {
  address: "0x4e71A2E537B7f9D9413D3991D37958c0b5e1e503",
  logoURI:
    "https://assets.slingshot.finance/icons/canto_0x4e71a2e537b7f9d9413d3991d37958c0b5e1e503",
  symbol: "NOTE",
} as const;

const launchpadProjectAddresses = [
  {
    address: "0x4e71A2E537B7f9D9413D3991D37958c0b5e1e503",
    name: "Sanko",
    type: "Fair Auction",
  },
] as const;

// <TableCell>{project.name}</TableCell>
// <TableCell className="max-md:hidden" align="right">
//   {project.type}
// </TableCell>
// <TableCell className="max-md:hidden" align="right">
//   {project.status}
// </TableCell>
// <TableCell className="max-md:hidden" align="right">
//   {formatCurrency(project.totalRaised)}
// </TableCell>
// <TableCell className="max-md:hidden" align="right">
//   {formatCurrency(project.userAllocation)}
// </TableCell>

const getLaunchpadProjects = async (userAddress: Address | undefined) => {
  const projects = [];
  for (const project of launchpadProjectAddresses) {
    const fairAuctionContract = {
      address: project.address,
      abi: CONTRACTS.FAIR_AUCTION_ABI,
    } as const;

    const projectTokenAddressPromise = viemClient.readContract({
      ...fairAuctionContract,
      functionName: "PROJECT_TOKEN",
    });
    const projectStartedPromise = viemClient.readContract({
      ...fairAuctionContract,
      functionName: "hasStarted",
    });
    const projectEndedPromise = viemClient.readContract({
      ...fairAuctionContract,
      functionName: "hasEnded",
    });
    const projectTotalRaisedPromise = viemClient.readContract({
      ...fairAuctionContract,
      functionName: "totalRaised",
    });

    const [tokenAddress, started, ended, totalRaised] = await Promise.all([
      projectTokenAddressPromise,
      projectStartedPromise,
      projectEndedPromise,
      projectTotalRaisedPromise,
    ]);

    const decimals = await viemClient.readContract({
      address: tokenAddress,
      abi: CONTRACTS.ERC20_ABI,
      functionName: "decimals",
    });

    let allocation = "0";

    if (userAddress) {
      const [_allocation] = await viemClient.readContract({
        ...fairAuctionContract,
        functionName: "userInfo",
        args: [userAddress],
      });
      allocation = formatUnits(_allocation, Number(decimals));
    }

    projects.push({
      address: project.address,
      name: project.name,
      type: project.type,
      status: ended ? "Ended" : started ? "Live" : "Upcoming",
      totalRaised: formatEther(totalRaised),
      userAllocation: allocation,
    });
  }
  return projects;
};

export const useLaunchpadProjects = (userAddress: Address | undefined) => {
  return useQuery({
    queryKey: ["launchpadProjects", userAddress],
    queryFn: () => getLaunchpadProjects(userAddress),
  });
};

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
    tokensToDistribute,
    minNoteToRaise,
    maxRaiseAmount, // is this is met, then the auction ends
  ] = await viemClient.multicall({
    allowFailure: false,
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
        // when totalRaised above this min total, token price goes up. if total raised below this min total, token price stays initial and not all 10_000 flow distributed
      },
      {
        ...fairAuctionContract,
        functionName: "MAX_RAISE",
      },
    ],
  });

  const tokenOfProject = {
    address: projectTokenAddress,
    abi: CONTRACTS.ERC20_ABI,
  } as const;

  const [tokenSymbol, decimals] = await viemClient.multicall({
    allowFailure: false,
    contracts: [
      {
        ...tokenOfProject,
        functionName: "symbol",
      },
      {
        ...tokenOfProject,
        functionName: "decimals",
      },
    ],
  });

  const tokenPrice =
    totalRaised <= minNoteToRaise
      ? minNoteToRaise / tokensToDistribute
      : totalRaised / tokensToDistribute;

  return {
    tokenSymbol,
    tokenPrice: formatUnits(tokenPrice, Number(decimals)),
    tokenOfProjectDecimals: Number(decimals),
    hasStarted,
    hasEnded,
    remainingTime: Number(remainingTime),
    totalRaised: formatEther(totalRaised),
    tokensToDistribute: formatUnits(tokensToDistribute, Number(decimals)),
    minNoteToRaise: formatEther(minNoteToRaise),
    maxRaiseAmount: formatEther(maxRaiseAmount),
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

const getUserClaimableAndClaimableRefEarnings = async (
  address: Address | null | undefined,
  projectAddress: Address | undefined,
  tokenOfProjectDecimals: number | undefined
) => {
  if (!address || !projectAddress || !tokenOfProjectDecimals) {
    return;
  }

  const fairAuctionContract = {
    address: projectAddress,
    abi: CONTRACTS.FAIR_AUCTION_ABI,
  } as const;

  const [claimableEarnings, [, , , , , claimedRefEarnings]] =
    await viemClient.multicall({
      allowFailure: false,
      contracts: [
        {
          ...fairAuctionContract,
          functionName: "getExpectedClaimAmount",
          args: [address],
        },
        {
          ...fairAuctionContract,
          functionName: "userInfo",
          args: [address],
        },
      ],
    });

  return {
    claimableEarnings: formatUnits(claimableEarnings, tokenOfProjectDecimals),
    claimedRefEarnings: formatUnits(claimedRefEarnings, tokenOfProjectDecimals),
  };
};

export const useUserClaimableAndClaimableRefEarnings = (
  address: Address | null | undefined,
  projectAddress: string | string[] | undefined
) => {
  const addy =
    projectAddress &&
    !Array.isArray(projectAddress) &&
    isAddress(projectAddress)
      ? projectAddress
      : undefined;
  const { data } = useLaunchpadProject(projectAddress);
  return useQuery({
    queryKey: [
      "userClaimableAndClaimableRefEarnings",
      addy,
      data?.tokenOfProjectDecimals,
      address,
    ],
    queryFn: () =>
      getUserClaimableAndClaimableRefEarnings(
        address,
        addy,
        data?.tokenOfProjectDecimals
      ),
    enabled: !!address && !!addy && !!data?.tokenOfProjectDecimals,
    initialData: {
      claimableEarnings: "0",
      claimedRefEarnings: "0",
    },
  });
};
