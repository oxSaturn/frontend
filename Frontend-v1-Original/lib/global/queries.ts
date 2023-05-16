import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getContract, formatUnits, Address, formatEther } from "viem";

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

const isArbitrum = process.env.NEXT_PUBLIC_CHAINID === "42161";

const tokenlist = isArbitrum ? tokenlistArb : tokenlistCan;

const WEEK = 604800;

/*
1. Get gov token base
2. Get ve token base
3. Get base assets
4. Get pairs
5. Get swap assets
6. Get active period
7. Get circulating supply
8. Get market cap
9. Get unstoppable domain
10. Get balances
*/

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

const getLocalAssets = () => {
  let localBaseAssets: BaseAsset[] = [];
  const localBaseAssetsString = localStorage.getItem("stableSwap-assets");

  if (localBaseAssetsString && localBaseAssetsString !== "") {
    localBaseAssets = JSON.parse(localBaseAssetsString);
  }

  return localBaseAssets;
};

const getInitBaseAssets = () => {
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

  const localBaseAssets = getLocalAssets();

  return [...baseAssets, ...localBaseAssets];
};

export const useInitBaseAssets = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.BASE_ASSETS],
    queryFn: getInitBaseAssets,
  });
};

const getPairsData = async () => {
  const response = await fetch(`/api/pairs`);

  const pairsCall = (await response.json()) as PairsCallResponse;

  return pairsCall;
};

export const usePairsData = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.PAIRS_DATA],
    queryFn: getPairsData,
    refetchInterval: 1000 * 60 * 5,
  });
};

const getPairs = (pairsData: PairsCallResponse | undefined) => {
  if (!pairsData) return [];
  return pairsData.data;
};

const getTokenPrices = (pairsData: PairsCallResponse | undefined) => {
  if (!pairsData) return new Map<string, number>();
  return new Map(pairsData.prices);
};

const getTvl = (pairsData: PairsCallResponse | undefined) => {
  if (!pairsData) return 0;
  return pairsData.tvl;
};

const getTbv = (pairsData: PairsCallResponse | undefined) => {
  if (!pairsData) return 0;
  return pairsData.tbv;
};

export const usePairs = () => {
  const { data: pairsData } = usePairsData();
  return useQuery({
    queryKey: [QUERY_KEYS.PAIRS, pairsData],
    queryFn: () => getPairs(pairsData),
  });
};

export const useTokenPrices = () => {
  const { data: pairsData } = usePairsData();
  return useQuery({
    queryKey: [QUERY_KEYS.TOKEN_PRICES, pairsData],
    queryFn: () => getTokenPrices(pairsData),
  });
};

export const useTvl = () => {
  const { data: pairsData } = usePairsData();
  return useQuery({
    queryKey: [QUERY_KEYS.TVL, pairsData],
    queryFn: () => getTvl(pairsData),
  });
};

export const useTbv = () => {
  const { data: pairsData } = usePairsData();
  return useQuery({
    queryKey: [QUERY_KEYS.TBV, pairsData],
    queryFn: () => getTbv(pairsData),
  });
};

const getSwapAssets = (
  baseAssets: BaseAsset[] | undefined,
  pairs: Pair[] | undefined
) => {
  if (!baseAssets || !pairs) return [];

  const set = new Set<string>();
  set.add(NATIVE_TOKEN.address.toLowerCase());
  pairs.forEach((pair) => {
    set.add(pair.token0.address.toLowerCase());
    set.add(pair.token1.address.toLowerCase());
  });
  const baseAssetsWeSwap = baseAssets.filter((asset) =>
    set.has(asset.address.toLowerCase())
  );
  return [...baseAssetsWeSwap];
};

export const useSwapAssets = () => {
  // TODO useBaseAssetsWithInfo or useInitBaseAssets ?
  const { data: baseAssets } = useInitBaseAssets();
  const { data: pairs } = usePairs();
  return useQuery({
    queryKey: [QUERY_KEYS.SWAP_ASSETS, baseAssets, pairs],
    queryFn: () => getSwapAssets(baseAssets, pairs),
  });
};

const getActivePeriod = async () => {
  const minterContract = getContract({
    abi: CONTRACTS.MINTER_ABI,
    address: CONTRACTS.MINTER_ADDRESS,
    publicClient: viemClient,
  });
  const activePeriod = await minterContract.read.active_period();

  const activePeriodEnd = parseFloat(activePeriod.toString()) + WEEK;
  return activePeriodEnd;
};

export const useActivePeriod = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.ACTIVE_PERIOD],
    queryFn: getActivePeriod,
    staleTime: 1000 * 60 * 60 * 24 * 3.5,
  });
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
    flowInMsig,
    flowInRewardsDistributor,
    flowInTimelockerController,
  ] = await viemClient.multicall({
    allowFailure: false,
    multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
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
        args: [CONTRACTS.MSIG_ADDRESS],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: [CONTRACTS.VE_DIST_ADDRESS],
      },
      {
        ...flowContract,
        functionName: "balanceOf",
        args: ["0xd0cC9738866cd82B237A14c92ac60577602d6c18"],
      },
    ],
  });

  const circulatingSupply = formatUnits(
    totalSupply -
      lockedSupply -
      flowInMinter -
      flowInMsig -
      flowInRewardsDistributor -
      flowInTimelockerController,
    CONTRACTS.GOV_TOKEN_DECIMALS
  );

  return parseFloat(circulatingSupply);
};

export const useCirculatingSupply = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.CIRCULATING_SUPPLY],
    queryFn: getCirculatingSupply,
    staleTime: 1000 * 60 * 10,
  });
};

const getMarketCap = async (
  circulatingSupply: number | undefined,
  tokenPrices: Map<string, number> | undefined
) => {
  if (!circulatingSupply || !tokenPrices) return 0;
  const price = tokenPrices.get(CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase());

  if (!price || !circulatingSupply) return 0;
  return circulatingSupply * price;
};

export const useMarketCap = () => {
  const { data: circulatingSupply } = useCirculatingSupply();
  const { data: tokenPrices } = useTokenPrices();
  return useQuery({
    queryKey: [QUERY_KEYS.MARKET_CAP, circulatingSupply, tokenPrices],
    queryFn: () => getMarketCap(circulatingSupply, tokenPrices),
    staleTime: 1000 * 60 * 10,
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

export const useGovToken = (address: Address | undefined) => {
  const { data: govTokenBase } = useGovTokenBase();
  return useQuery({
    queryKey: [QUERY_KEYS.GOV_TOKEN, address, govTokenBase],
    queryFn: () => getGovToken(address, govTokenBase!), // enabled only when govTokenBase is defined
    enabled: !!govTokenBase,
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
      const [[lockedAmount, lockedEnd], lockValue, voted] =
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
      };
    })
  );

  return nfts;
};

export const useVestNfts = (address: Address | undefined) => {
  const { data: govToken } = useGovToken(address);
  const { data: veToken } = useVeToken();
  const { data: activePeriod } = useActivePeriod();
  return useQuery({
    queryKey: [QUERY_KEYS.VEST_NFTS, address, govToken, veToken, activePeriod],
    queryFn: () => getVestNFTs(address, govToken, veToken, activePeriod!), // enabled only when activePeriod is defined
    enabled: !!govToken && !!veToken && !!activePeriod,
  });
};

const getBaseAssetsWithInfo = async (
  address: Address | undefined,
  baseAssets: BaseAsset[]
) => {
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
    return null;
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

export const useBaseAssetWithInfo = (address: Address | undefined) => {
  const queryClient = useQueryClient();
  const { data: initialBaseAssets } = useInitBaseAssets();
  return useQuery({
    queryKey: [QUERY_KEYS.BASE_ASSET_INFO, address, initialBaseAssets],
    queryFn: () => getBaseAssetsWithInfo(address, initialBaseAssets!), // enabled only when initialBaseAssets is defined
    enabled: !!initialBaseAssets,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["swapAssets"] }), // FIXME: probably will need to rethink it
  });
};

const getExactBaseAsset = async (
  address: `0x${string}`,
  baseAssets: BaseAsset[],
  save?: boolean,
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
    if (address) {
      const balanceOf = await viemClient.readContract({
        ...baseAssetContract,
        functionName: "balanceOf",
        args: [address],
      });
      newBaseAsset.balance = formatUnits(balanceOf, newBaseAsset.decimals);
    }
    // TODO feel like its not the way
  }

  //only save when a user adds it. don't for when we lookup a pair and find he asset.
  if (save) {
    let localBaseAssets = getLocalAssets();
    localBaseAssets = [...localBaseAssets, newBaseAsset];
    localStorage.setItem("stableSwap-assets", JSON.stringify(localBaseAssets));

    const storeBaseAssets = [...baseAssets, newBaseAsset];

    // TODO set query data of base assets to storeBaseAssets?
    // TODO if save invalidate swapAssets?
  }

  return newBaseAsset;
};

// TODO: split to two hooks same way as now ?
const getPairsWithInfo = async (
  address: `0x${string}`,
  pairs: Pair[],
  baseAssets: BaseAsset[]
) => {
  const gaugesContract = {
    abi: CONTRACTS.VOTER_ABI,
    address: CONTRACTS.VOTER_ADDRESS,
  } as const;

  const totalWeight = await viemClient.readContract({
    ...gaugesContract,
    functionName: "totalWeight",
  });

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
      try {
        const token0 = await getExactBaseAsset(
          pair.token0.address,
          baseAssets,
          false,
          true
        );
        const token1 = await getExactBaseAsset(
          pair.token1.address,
          baseAssets,
          false,
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
      } catch (ex) {
        console.log("EXCEPTION 1");
        console.log(pair);
        console.log(ex);
        return pair;
      }
    })
  );

  const gauges = ps.filter(hasGauge);

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
  const ps1 = ps.map((pair) => {
    try {
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
    } catch (ex) {
      console.log("EXCEPTION 2");
      console.log(pair);
      console.log(ex);
      return pair;
    }
  });

  return ps1;
};

export const usePairsWithBalances = (address: Address | undefined) => {
  const { data: pairs } = usePairs();
  const { data: baseAssetsWithInfo } = useBaseAssetWithInfo(address);
  return useQuery({
    queryKey: [
      QUERY_KEYS.PAIRS_WITH_BALANCES,
      address,
      pairs,
      baseAssetsWithInfo,
    ],
    queryFn: () => getPairsWithInfo(address!, pairs!, baseAssetsWithInfo!),
    enabled: !!address && !!pairs && !!baseAssetsWithInfo,
  });
};

export const useBalances = (address: Address | undefined) => {
  useGovToken(address);
  useVestNfts(address);
  useBaseAssetWithInfo(address);
  usePairsWithBalances(address);
};
