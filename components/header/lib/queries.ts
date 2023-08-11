import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";

import viemClient from "../../../stores/connectors/viem";
import { usePairsData } from "../../../lib/global/queries";
import { CONTRACTS, QUERY_KEYS } from "../../../stores/constants/constants";
import { PairsCallResponse } from "../../../stores/types/types";

const WEEK = 604800;

export const useTokenPrices = () => {
  const { data: pairsData } = usePairsData();
  return useQuery({
    queryKey: [QUERY_KEYS.TOKEN_PRICES, pairsData],
    queryFn: () => getTokenPrices(pairsData),
    enabled: !!pairsData,
    keepPreviousData: true,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useTvl = () => {
  const { data: pairsData } = usePairsData();
  return useQuery({
    queryKey: [QUERY_KEYS.TVL, pairsData],
    queryFn: () => getTvl(pairsData),
    enabled: !!pairsData,
    keepPreviousData: true,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useTbv = () => {
  const { data: pairsData } = usePairsData();
  return useQuery({
    queryKey: [QUERY_KEYS.TBV, pairsData],
    queryFn: () => getTbv(pairsData),
    enabled: !!pairsData,
    keepPreviousData: true,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useCirculatingSupply = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.CIRCULATING_SUPPLY],
    queryFn: getCirculatingSupply,
    keepPreviousData: true,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useMarketCap = () => {
  const { data: circulatingSupply } = useCirculatingSupply();
  const { data: tokenPrices } = useTokenPrices();
  return useQuery({
    queryKey: [QUERY_KEYS.MARKET_CAP, circulatingSupply, tokenPrices],
    queryFn: () => getMarketCap(circulatingSupply, tokenPrices),
    enabled: !!circulatingSupply && !!tokenPrices,
    keepPreviousData: true,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useActivePeriod = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.ACTIVE_PERIOD],
    queryFn: getActivePeriod,
    keepPreviousData: true,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useDomain = (address: `0x${string}` | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DOMAIN, address],
    queryFn: () => resolveUnstoppableDomain(address),
    enabled: !!address,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (
        error instanceof Error &&
        error?.message === "No domain in response"
      ) {
        return false;
      }
      return failureCount < 4;
    },
  });
};

const getActivePeriod = async () => {
  const activePeriod = await viemClient.readContract({
    abi: CONTRACTS.MINTER_ABI,
    address: CONTRACTS.MINTER_ADDRESS,
    functionName: "active_period",
  });

  const activePeriodEnd = parseFloat(activePeriod.toString()) + WEEK;
  return activePeriodEnd;
};

const getTokenPrices = (pairsData: PairsCallResponse | undefined) => {
  if (!pairsData) throw new Error("Need pairs data");
  return new Map(pairsData.prices);
};

const getTvl = (pairsData: PairsCallResponse | undefined) => {
  if (!pairsData) throw new Error("Need pairs data");
  return pairsData.tvl;
};

const getTbv = (pairsData: PairsCallResponse | undefined) => {
  if (!pairsData) throw new Error("Need pairs data");
  return pairsData.tbv;
};

const getCirculatingSupply = async () => {
  const flowContract = {
    abi: CONTRACTS.GOV_TOKEN_ABI,
    address: CONTRACTS.GOV_TOKEN_ADDRESS,
  } as const;

  const [
    totalSupply,
    lockedSupply,
    flowInMinter,
    flowInRewardsDistributor,
    flowInOptionToken1,
    flowInAirdropClaim,
    flowInMintTank,
    flowInMsig,
  ] = await viemClient.multicall({
    allowFailure: false,
    contracts: [
      {
        ...flowContract,
        functionName: "totalSupply",
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.VE_TOKEN_ADDRESS],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.MINTER_ADDRESS],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.VE_DIST_ADDRESS],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.OPTION_TOKEN_ADDRESS],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.AIRDROP_CLAIM],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.MINT_TANK],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.MSIG_ADDRESS],
      },
    ],
  });
  const pairs = await viemClient.readContract({
    abi: CONTRACTS.FACTORY_ABI,
    address: CONTRACTS.FACTORY_ADDRESS,
    functionName: "allPairsLength",
  });
  const pairAddressesCall = Array.from({ length: Number(pairs) }, (_, i) => {
    return {
      abi: CONTRACTS.FACTORY_ABI,
      address: CONTRACTS.FACTORY_ADDRESS,
      functionName: "allPairs",
      args: [BigInt(i)],
    } as const;
  });
  const pairAddresses = await viemClient.multicall({
    allowFailure: false,
    contracts: pairAddressesCall,
  });

  const gaugesCall = pairAddresses.map(
    (pairAddress) =>
      ({
        abi: CONTRACTS.VOTER_ABI,
        address: CONTRACTS.VOTER_ADDRESS,
        functionName: "gauges",
        args: [pairAddress],
      }) as const
  );
  const gaugeAddresses = await viemClient.multicall({
    allowFailure: false,
    contracts: gaugesCall,
  });
  const gaugeBalances = await viemClient.multicall({
    allowFailure: false,
    contracts: gaugeAddresses.map((gaugeAddress) => ({
      ...flowContract,
      functionName: "balanceOf",
      args: [gaugeAddress],
    })),
  });
  const gaugeBalancesSum = (gaugeBalances as bigint[]).reduce(
    (acc, balance) => acc + balance,
    0n
  );
  const circulatingSupply = formatUnits(
    totalSupply -
      lockedSupply -
      flowInMinter -
      flowInAirdropClaim -
      flowInRewardsDistributor -
      flowInMintTank -
      flowInMsig -
      gaugeBalancesSum -
      flowInOptionToken1,
    CONTRACTS.GOV_TOKEN_DECIMALS
  );

  return parseFloat(circulatingSupply);
};

const getMarketCap = async (
  circulatingSupply: number | undefined,
  tokenPrices: Map<string, number> | undefined
) => {
  if (!circulatingSupply || !tokenPrices)
    throw new Error("Missing circ supply or token prices");

  const price = tokenPrices.get(CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase());
  if (price === undefined) throw new Error("Missing price");

  return circulatingSupply * price;
};

const resolveUnstoppableDomain = async (address: `0x${string}` | undefined) => {
  if (!address) throw new Error("No address");
  const res = await fetch("/api/u-domains", {
    method: "POST",
    body: JSON.stringify({
      address,
    }),
  });
  const resJson = (await res.json()) as { domain: string };
  if (!resJson?.domain || resJson?.domain === "")
    throw new Error("No domain in response");
  return resJson?.domain as string;
};
