import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { formatUnits, Address, formatEther } from "viem";

import BigNumber from "bignumber.js";

import viemClient, {
  chunkArray,
  multicallChunks,
} from "../../stores/connectors/viem";

import {
  CONTRACTS,
  NATIVE_TOKEN,
  PAIR_DECIMALS,
  QUERY_KEYS,
} from "../../stores/constants/constants";
import tokenlistArb from "../../mainnet-arb-token-list.json";
import tokenlistCan from "../../mainnet-canto-token-list.json";
import {
  BaseAsset,
  GovToken,
  Pair,
  PairsCallResponse,
  VeToken,
  VestNFT,
  hasGauge,
} from "../../stores/types/types";
import { useActivePeriod } from "../../components/header/queries";

const isArbitrum = process.env.NEXT_PUBLIC_CHAINID === "42161";

const tokenlist = isArbitrum ? tokenlistArb : tokenlistCan;

const getGovTokenBase = () => {
  return {
    address: CONTRACTS.GOV_TOKEN_ADDRESS,
    name: CONTRACTS.GOV_TOKEN_NAME,
    symbol: CONTRACTS.GOV_TOKEN_SYMBOL,
    decimals: CONTRACTS.GOV_TOKEN_DECIMALS,
    logoURI: CONTRACTS.GOV_TOKEN_LOGO,
    balance: "0",
    balanceOf: "0",
  } as const;
};

export const useGovTokenBase = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GOV_TOKEN_BASE],
    queryFn: getGovTokenBase,
    staleTime: Infinity,
  });
};

const getVeToken = () => {
  return {
    address: CONTRACTS.VE_TOKEN_ADDRESS,
    name: CONTRACTS.VE_TOKEN_NAME,
    symbol: CONTRACTS.VE_TOKEN_SYMBOL,
    decimals: CONTRACTS.VE_TOKEN_DECIMALS,
    logoURI: CONTRACTS.VE_TOKEN_LOGO,
  } as const;
};

export const useVeToken = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.VE_TOKEN],
    queryFn: getVeToken,
    staleTime: Infinity,
  });
};

export const getLocalAssets = () => {
  let localBaseAssets: BaseAsset[] = [];
  const localBaseAssetsString = localStorage.getItem("stableSwap-assets");

  if (localBaseAssetsString && localBaseAssetsString !== "") {
    localBaseAssets = JSON.parse(localBaseAssetsString);
  }

  return localBaseAssets;
};

const useLocalAssets = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.LOCAL_ASSETS],
    queryFn: getLocalAssets,
  });
};

const getInitBaseAssets = (localBaseAssets: BaseAsset[] | undefined) => {
  const baseAssets: BaseAsset[] = tokenlist.map((asset) => {
    return {
      ...asset,
      address: asset.address as `0x${string}`,
      local: false,
      balance: "0",
    };
  });

  const set = new Set<string>(baseAssets.map((asset) => asset.address));
  if (!set.has(NATIVE_TOKEN.address))
    baseAssets.unshift(NATIVE_TOKEN as BaseAsset);

  return localBaseAssets ? [...baseAssets, ...localBaseAssets] : baseAssets;
};

const getPairsData = async () => {
  const response = await fetch(`/api/pairs`);

  const pairsCall = (await response.json()) as PairsCallResponse;

  return pairsCall;
};

export const usePairsData = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.PAIRS_DATA],
    queryFn: () => getPairsData(),
    refetchInterval: 1000 * 60 * 15,
    refetchOnMount: false,
  });
};

export const getPairs = (pairsData: PairsCallResponse | undefined) => {
  if (!pairsData) throw new Error("Need pairs data");
  return pairsData.data;
};

export const usePairs = () => {
  const { data: pairsData } = usePairsData();
  return useQuery({
    queryKey: [QUERY_KEYS.PAIRS, pairsData],
    queryFn: () => getPairs(pairsData),
    enabled: !!pairsData,
  });
};

const getGovToken = async (
  address: Address | undefined,
  govTokenBase: GovToken
) => {
  if (!address) return govTokenBase;

  const balanceOf = await viemClient.readContract({
    abi: CONTRACTS.GOV_TOKEN_ABI,
    address: CONTRACTS.GOV_TOKEN_ADDRESS,
    functionName: "balanceOf",
    args: [address],
  });

  const govToken = {
    ...govTokenBase,
    balance: formatUnits(balanceOf, govTokenBase.decimals),
  };

  return govToken;
};

export const useGovToken = () => {
  const { address } = useAccount();
  const { data: govTokenBase } = useGovTokenBase();
  return useQuery({
    queryKey: [QUERY_KEYS.GOV_TOKEN, address, govTokenBase],
    queryFn: () => getGovToken(address, govTokenBase!), // enabled only when govTokenBase is defined
    enabled: !!govTokenBase,
  });
};

export const getBaseAssetsWithInfo = async (
  address: Address | undefined,
  localAssets: BaseAsset[] | undefined
) => {
  const baseAssets = getInitBaseAssets(localAssets);

  if (!baseAssets) {
    console.warn("baseAssets not found");
    throw new Error("Base assets not found");
  }

  if (!address) {
    baseAssets.forEach((baseAsset) => {
      baseAsset.balance = "0";
    });
    return baseAssets;
  }

  const voterContract = {
    abi: CONTRACTS.VOTER_ABI,
    address: CONTRACTS.VOTER_ADDRESS,
  } as const;

  let baseAssetsWithBalances: BaseAsset[] = [];

  const nativeToken = baseAssets.find(
    (asset) => asset.address === NATIVE_TOKEN.symbol
  );
  if (nativeToken) {
    const balance = await viemClient.getBalance({
      address: address,
    });
    baseAssetsWithBalances.push({
      ...nativeToken,
      balance: formatUnits(balance, nativeToken.decimals),
      isWhitelisted: true,
    } as const);
  }

  const baseAssetsWithoutNativeToken = baseAssets
    .map((asset) => {
      if (asset.address !== NATIVE_TOKEN.symbol) {
        return asset;
      }
    })
    .filter((asset): asset is BaseAsset => asset !== undefined);
  if (baseAssetsWithoutNativeToken.length === 0) {
    console.warn("error in base assets logic");
    throw new Error("error in base assets logic");
  }

  const baseAssetsWhitelistedCalls = baseAssetsWithoutNativeToken.map(
    (asset) => {
      return {
        ...voterContract,
        functionName: "isWhitelisted",
        args: [asset.address],
      } as const;
    }
  );

  const baseAssetsBalancesCalls = baseAssetsWithoutNativeToken.map((asset) => {
    return {
      abi: CONTRACTS.ERC20_ABI,
      address: asset.address,
      functionName: "balanceOf",
      args: [address],
    } as const;
  });

  const whitelistedCallsChunks = chunkArray(baseAssetsWhitelistedCalls);
  const baseAssetsWhitelistedResults = await multicallChunks(
    whitelistedCallsChunks
  );

  const balancesCallsChunks = chunkArray(baseAssetsBalancesCalls);
  const baseAssetsBalancesResults = await multicallChunks(balancesCallsChunks);

  for (let i = 0; i < baseAssetsWithoutNativeToken.length; i++) {
    baseAssetsWithBalances.push({
      ...baseAssetsWithoutNativeToken[i],
      balance: formatUnits(
        baseAssetsBalancesResults[i],
        baseAssetsWithoutNativeToken[i].decimals
      ),
      isWhitelisted: baseAssetsWhitelistedResults[i],
    });
  }
  baseAssets.forEach((baseAsset) => {
    const baseAssetWithBalance = baseAssetsWithBalances.find(
      (baseAssetWithBalance) =>
        baseAssetWithBalance.address === baseAsset.address
    );
    if (baseAssetWithBalance) {
      baseAsset.balance = baseAssetWithBalance.balance;
      baseAsset.isWhitelisted = baseAssetWithBalance.isWhitelisted;
    }
  });

  return baseAssetsWithBalances;
};

export const useBaseAssetWithInfo = <TData = BaseAsset[]>(
  select?: (_data: BaseAsset[]) => TData
) => {
  const { address } = useAccount();
  const { data: localAssets } = useLocalAssets();
  return useQuery({
    queryKey: [QUERY_KEYS.BASE_ASSET_INFO, address, localAssets],
    queryFn: () => getBaseAssetsWithInfo(address, localAssets),
    select,
  });
};

const getExactBaseAsset = async (
  account: Address | undefined,
  address: Address,
  baseAssets: BaseAsset[],
  getBalance?: boolean
) => {
  const theBaseAsset = baseAssets.filter((as) => {
    return as.address.toLowerCase() === address.toLowerCase();
  });
  if (theBaseAsset.length > 0) {
    return theBaseAsset[0];
  }

  // not found, so we search the blockchain for it.
  const baseAssetContract = {
    abi: CONTRACTS.ERC20_ABI,
    address: address,
  } as const;

  const [symbol, decimals, name] = await viemClient.multicall({
    allowFailure: false,
    multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
    contracts: [
      {
        ...baseAssetContract,
        functionName: "symbol",
      },
      {
        ...baseAssetContract,
        functionName: "decimals",
      },
      {
        ...baseAssetContract,
        functionName: "name",
      },
    ],
  });

  const newBaseAsset: BaseAsset = {
    address: address,
    symbol: symbol,
    name: name,
    decimals: parseInt(decimals.toString()),
    logoURI: null,
    local: true,
    balance: null,
    isWhitelisted: undefined,
    listingFee: undefined,
  };

  if (getBalance) {
    if (account) {
      const balanceOf = await viemClient.readContract({
        ...baseAssetContract,
        functionName: "balanceOf",
        args: [account],
      });
      newBaseAsset.balance = formatUnits(balanceOf, newBaseAsset.decimals);
    }
  }

  return newBaseAsset;
};

const getPairsWithoutGauges = async (
  address: `0x${string}`,
  pairs: Pair[],
  baseAssets: BaseAsset[]
) => {
  const pairCalls = pairs.flatMap((pair) => {
    return [
      {
        address: pair.address,
        abi: CONTRACTS.PAIR_ABI,
        functionName: "totalSupply",
      },
      {
        address: pair.address,
        abi: CONTRACTS.PAIR_ABI,
        functionName: "reserve0",
      },
      {
        address: pair.address,
        abi: CONTRACTS.PAIR_ABI,
        functionName: "reserve1",
      },
      {
        address: pair.address,
        abi: CONTRACTS.PAIR_ABI,
        functionName: "balanceOf",
        args: [address],
      },
    ] as const;
  });
  const pairCallsChunks = chunkArray(pairCalls, 100);
  const pairsData = await multicallChunks(pairCallsChunks);

  const ps = await Promise.all(
    pairs.map(async (pair, i) => {
      const token0 = await getExactBaseAsset(
        address,
        pair.token0.address,
        baseAssets,
        true
      );
      const token1 = await getExactBaseAsset(
        address,
        pair.token1.address,
        baseAssets,
        true
      );

      const [totalSupply, reserve0, reserve1, balanceOf] = pairsData.slice(
        i * 4,
        i * 4 + 4
      );

      pair.token0 = token0 != null ? token0 : pair.token0;
      pair.token1 = token1 != null ? token1 : pair.token1;
      pair.balance = formatUnits(balanceOf, PAIR_DECIMALS);
      pair.totalSupply = formatUnits(totalSupply, PAIR_DECIMALS);
      pair.reserve0 = formatUnits(reserve0, pair.token0.decimals);
      pair.reserve1 = formatUnits(reserve1, pair.token1.decimals);

      return pair;
    })
  );

  return ps;
};

export const usePairsWithoutGauges = () => {
  const { address } = useAccount();
  const { data: pairs } = usePairs();
  const { data: baseAssetsWithInfo } = useBaseAssetWithInfo();
  return useQuery({
    queryKey: [
      QUERY_KEYS.PAIRS_WITHOUT_GAUGES,
      address,
      pairs,
      baseAssetsWithInfo,
    ],
    queryFn: () => getPairsWithoutGauges(address!, pairs!, baseAssetsWithInfo!),
    enabled: !!address && !!pairs && !!baseAssetsWithInfo,
  });
};

export const getPairsWithGauges = async (
  address: `0x${string}`,
  pairsWithoutInfo: Pair[]
) => {
  const gaugesContract = {
    abi: CONTRACTS.VOTER_ABI,
    address: CONTRACTS.VOTER_ADDRESS,
  } as const;

  const totalWeight = await viemClient.readContract({
    ...gaugesContract,
    functionName: "totalWeight",
  });

  const gauges = pairsWithoutInfo.filter(hasGauge);

  const gaugesAliveCalls = gauges.map((pair) => {
    return {
      ...gaugesContract,
      functionName: "isAlive",
      args: [pair.gauge.address],
    } as const;
  });
  const gaugesAliveCallsChunks = chunkArray(gaugesAliveCalls);
  const gaugesAliveData = await multicallChunks(gaugesAliveCallsChunks);

  const gaugesCalls = gauges.flatMap((pair) => {
    return [
      {
        address: pair.gauge.address,
        abi: CONTRACTS.GAUGE_ABI,
        functionName: "totalSupply",
      },
      {
        address: pair.gauge.address,
        abi: CONTRACTS.GAUGE_ABI,
        functionName: "balanceOf",
        args: [address],
      },
      {
        ...gaugesContract,
        functionName: "weights",
        args: [pair.address],
      },
    ] as const;
  });
  const gaugesCallsChunks = chunkArray(gaugesCalls);
  const gaugesData = await multicallChunks(gaugesCallsChunks);

  // this is to increment index only if pair hasGauge
  let outerIndex = 0;
  const ps1 = pairsWithoutInfo.map((pair) => {
    if (hasGauge(pair)) {
      const isAliveGauge = gaugesAliveData[outerIndex];

      const [totalSupply, gaugeBalance, gaugeWeight] = gaugesData.slice(
        outerIndex * 3,
        outerIndex * 3 + 3
      );

      const bribes = pair.gauge.bribes.map((bribe) => {
        bribe.rewardAmount = bribe.rewardAmmount;
        return bribe;
      });
      pair.gauge.x_bribes.forEach((x_bribe) => {
        const bribe = bribes.find(
          (b) => b.token.address === x_bribe.token.address
        );
        if (bribe) {
          bribe.rewardAmount = bribe.rewardAmmount + x_bribe.rewardAmmount;
        } else {
          bribes.push({
            token: x_bribe.token,
            rewardAmount: x_bribe.rewardAmmount,
            reward_ammount: x_bribe.rewardAmmount,
            rewardAmmount: x_bribe.rewardAmmount,
          });
        }
      });

      pair.gauge.balance = formatEther(gaugeBalance);
      pair.gauge.totalSupply = formatEther(totalSupply);

      // in ps totalSupply for reassgined to string from number (api sends number)
      pair.gauge.reserve0 =
        parseFloat(pair.totalSupply as `${number}`) > 0
          ? BigNumber(pair.reserve0)
              .times(pair.gauge.totalSupply)
              .div(pair.totalSupply)
              .toFixed(pair.token0.decimals)
          : "0";
      // in ps totalSupply for reassgined to string from number (api sends number)
      pair.gauge.reserve1 =
        parseFloat(pair.totalSupply as `${number}`) > 0
          ? BigNumber(pair.reserve1)
              .times(pair.gauge.totalSupply)
              .div(pair.totalSupply)
              .toFixed(pair.token1.decimals)
          : "0";
      pair.gauge.weight = formatEther(gaugeWeight);
      pair.gauge.weightPercent = (
        (Number(gaugeWeight) * 100) /
        Number(totalWeight)
      ).toFixed(2);
      // NOTE: this is being used in votes table to show aggregated bribes and x_bribes
      pair.gaugebribes = bribes;
      pair.isAliveGauge = isAliveGauge;
      if (isAliveGauge === false) pair.apr = 0;

      outerIndex++;
    }

    return pair;
  });

  return ps1;
};

export const usePairsWithGauges = <TData = Pair[]>(
  select?: (_data: Pair[]) => TData
) => {
  const { address } = useAccount();
  const { data: pairsWithoutGauges } = usePairsWithoutGauges();
  return useQuery({
    queryKey: [QUERY_KEYS.PAIRS_WITH_GAUGES, address, pairsWithoutGauges],
    queryFn: () => getPairsWithGauges(address!, pairsWithoutGauges!),
    enabled: !!address && !!pairsWithoutGauges,
    select,
  });
};

const checkNFTLastVoted = async (tokenID: string) => {
  const _lastVoted = await viemClient.readContract({
    address: CONTRACTS.VOTER_ADDRESS,
    abi: CONTRACTS.VOTER_ABI,
    functionName: "lastVoted",
    args: [BigInt(tokenID)],
  });
  return _lastVoted;
};

export const checkNFTActionEpoch = async (
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
