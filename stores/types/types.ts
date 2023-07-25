import { ZERO_ADDRESS } from "../constants/constants";

interface BaseAsset {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string | null;
  local: boolean;
  balance: string | null;
  isWhitelisted?: boolean;
  listingFee?: string | number;
}

interface RouteAsset {
  price: number;
  nativeChainAddress: string; // if no,  set to :""
  nativeChainId: number;
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: null | string;
}

type TokenForPrice = Omit<
  RouteAsset,
  "price" | "nativeChainAddress" | "nativeChainId" | "name" | "logoURI"
> &
  Partial<RouteAsset>;

type VeToken = Omit<BaseAsset, "balance" | "local">;
type GovToken = Omit<BaseAsset, "local"> & {
  balanceOf: string;
};

interface VestNFT {
  id: string;
  lockAmount: string;
  lockEnds: string;
  lockValue: string;
  votedInCurrentEpoch: boolean;
  reset: boolean;
  lastVoted: bigint;
  influence: number;
}

interface Bribe {
  token: RouteAsset | BaseAsset;
  reward_ammount: number;
  rewardAmmount: number;
  rewardAmount?: number; // gets assigned in frontend store and eq rewardAmmount
  earned?: string;
}

type BribeEarned = { earned: string };

interface GeneralApr {
  symbol: string;
  logo: string;
  apr: number;
}

interface OptionApr {
  symbol: string;
  logo: string;
  min_apr: number;
  max_apr: number;
}

type Aprs = (GeneralApr | OptionApr)[] | null;

interface GaugeOfPair {
  // exists only if gauge_address is not empty
  decimals: number;
  min_tbv: number;
  max_tbv: number;
  median_tbv: number;
  votes: number;
  min_apr: number;
  max_apr: number;
  address: `0x${string}`;
  total_supply: number;
  bribe_address: `0x${string}`;
  reward: number;
  bribeAddress: `0x${string}`;
  totalSupply: number;
  bribes: Bribe[];
  // following gets assigned in frontend store
  balance?: string;
  reserve0?: string;
  reserve1?: string;
  weight?: string;
  weightPercent?: string;
  rewardTokens?: {
    address: `0x${string}`;
    symbol: string;
    decimals: number;
  }[];
  rewardsEarned?: {
    earned: `${number}`;
    address: `0x${string}`;
    symbol: string;
    decimals: number;
  }[];
  bribesEarned?: Bribe[];
}

interface Pair {
  tvl: number;
  aprs: Aprs;
  oblotr_apr: number;
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  stable: boolean;
  total_supply: number;
  reserve0: number;
  reserve1: number;
  token0_address: `0x${string}`;
  token1_address: `0x${string}`;
  gauge_address: string; // if no,  set to :""
  isStable: boolean;
  totalSupply: number;
  token0: RouteAsset | BaseAsset; //TODO check if this is correct
  token1: RouteAsset | BaseAsset;
  rewardType?: "Bribe" | "Reward";
  rewardsToClaim?: {
    earned: `${number}`;
    address: `0x${string}`;
    symbol: string;
    decimals: number;
  }[];
  claimable0?: string;
  claimable1?: string;
  balance?: string;
  isAliveGauge?: boolean;
  gauge?: GaugeOfPair;
  killed_gauges: Pick<
    GaugeOfPair,
    | "decimals"
    | "min_tbv"
    | "max_tbv"
    | "median_tbv"
    | "votes"
    | "min_apr"
    | "max_apr"
    | "address"
    | "total_supply"
    | "totalSupply"
    | "bribe_address"
    | "reward"
    | "bribeAddress"
    | "bribes"
  >[]; // if no gauges killed, set to: []
  gaugebribes?: Bribe[];
}

type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

type Gauge = WithRequired<Pair, "gauge">;
const hasGauge = (pair: Pair): pair is Gauge =>
  pair && pair.gauge !== undefined && pair.gauge.address !== ZERO_ADDRESS;
const isGaugeReward = (reward: Gauge | VeDistReward): reward is Gauge =>
  reward && reward.rewardType !== "Distribution";
const isBaseAsset = (
  asset: BaseAsset | RouteAsset | Pair | null
): asset is BaseAsset => !!asset && "balance" in asset && "name" in asset;

interface VeDistReward {
  token: VestNFT;
  lockToken: VeToken;
  rewardToken: Omit<BaseAsset, "local"> & {
    balanceOf: string;
  };
  earned: string;
  rewardType: "Distribution";
}

interface Rewards {
  bribes: Gauge[];
  rewards: Gauge[];
  veDist: VeDistReward[];
}

type Vote = {
  address: `0x${string}`;
  gaugeAddress: `0x${string}`;
  votePercent: string;
};

type Votes = Array<Pick<Vote, "address" | "gaugeAddress"> & { value: number }>;

interface DexScrennerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: `0x${string}`;
  baseToken: {
    address: `0x${string}`;
    name: string;
    symbol: string;
  };
  quoteToken: {
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  txns: {
    m5: {
      buys: number;
      sells: number;
    };
    h1: {
      buys: number;
      sells: number;
    };
    h6: {
      buys: number;
      sells: number;
    };
    h24: {
      buys: number;
      sells: number;
    };
  };
  volume: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd?: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  pairCreatedAt?: number;
}

interface DefiLlamaTokenPrice {
  coins: {
    [key: string]: {
      decimals: number;
      price: number;
      symbol: string;
      timestamp: number;
      confidence: number;
    };
  };
}

interface ITransaction {
  title: string;
  type: string;
  verb: string;
  transactions: {
    uuid: string;
    description: string;
    status: TransactionStatus;
    txHash?: `0x${string}`;
    error?: string;
  }[];
}

enum TransactionStatus {
  PENDING = "PENDING",
  SUBMITTED = "SUBMITTED",
  CONFIRMED = "CONFIRMED",
  REJECTED = "REJECTED",
  DONE = "DONE",
  WAITING = "WAITING",
}

type EthWindow = Window &
  typeof globalThis & {
    ethereum?: any;
  };

// FIREBIRD
interface QuoteSwapPayload {
  options: {
    fromAsset: BaseAsset;
    toAsset: BaseAsset;
    fromAmount: string;
    slippage: string;
  };
  address: `0x${string}`;
}

interface QuoteSwapResponse {
  encodedData: {
    router: `0x${string}`;
    data: `0x${string}`;
  };
  maxReturn: {
    from: `0x${string}`;
    to: `0x${string}`;
    totalFrom: string;
    totalTo: number;
    totalGas: number;
    gasPrice: number;
    paths: Path[];
    tokens: FireBirdTokens;
  };
}

interface PairsCallResponse {
  data: Pair[];
  prices: [string, number][];
  tvl: number;
  tbv: number;
}

interface Path {
  amountFrom: string;
  amountTo: string;
  gas: number;
  swaps: Swap[];
}

interface Swap {
  from: `0x${string}`;
  to: `0x${string}`;
  amountFrom: string;
  amountTo: string;
  pool: `0x${string}`;
  swapFee: number;
  dex: string;
  meta?: {
    vaultAddress: `0x${string}`;
  };
}

interface FireBirdTokens {
  [address: `0x${string}`]: {
    address: `0x${string}`;
    decimals: number;
    name: string;
    symbol: string;
    price: number;
  };
}

export type {
  BaseAsset,
  Pair,
  Gauge,
  VeDistReward,
  Bribe,
  RouteAsset,
  TokenForPrice,
  VeToken,
  GovToken,
  Vote,
  Votes,
  VestNFT,
  DexScrennerPair,
  DefiLlamaTokenPrice,
  ITransaction,
  EthWindow,
  QuoteSwapPayload,
  QuoteSwapResponse,
  Path,
  Swap,
  FireBirdTokens,
  PairsCallResponse,
  Rewards,
  Aprs,
};

export { hasGauge, isGaugeReward, isBaseAsset, TransactionStatus };
