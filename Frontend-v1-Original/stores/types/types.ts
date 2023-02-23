interface BaseAsset {
  address: string;
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
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: null | string;
}

interface Bribe {
  token: {
    price: number;
    nativeChainAddress: string; // if no,  set to :""
    nativeChainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI: null | string;
  };
  reward_ammount: number;
  rewardAmmount: number;
  rewardAmount?: number; // gets assigned in frontend store and eq rewardAmmount
  earned?: string;
}

type BribeEarned = { earned: string };

interface Pair {
  tvl: number;
  apr: number;
  address: string;
  symbol: string;
  decimals: number;
  stable: boolean;
  total_supply: number;
  reserve0: number | string; // gets reassigned to string in frontend store
  reserve1: number | string; // gets reassigned to string in frontend store
  token0_address: string;
  token1_address: string;
  gauge_address: string; // if no,  set to :""
  isStable: boolean;
  totalSupply: number | string; // gets reassigned to string in frontend store
  token0: RouteAsset | BaseAsset; //TODO check if this is correct
  token1: RouteAsset | BaseAsset;
  rewardType?: string;
  claimable0?: string;
  claimable1?: string;
  balance?: string;
  gauge?: {
    // exists only if gauge_address is not empty
    decimals: number;
    tbv: number;
    votes: number;
    apr: number;
    address: string;
    total_supply: number;
    bribe_address: string;
    fees_address: string;
    wrapped_bribe_address: string;
    reward: number;
    bribeAddress: string;
    feesAddress: string;
    totalSupply: number | string; //gets reassigned to string in frontend store
    bribes: Bribe[];
    // following gets assigned in frontend store
    balance?: string;
    reserve0?: string;
    reserve1?: string;
    weight?: string;
    weightPercent?: string;
    rewardsEarned?: string;
    bribesEarned?: Bribe[] | BribeEarned[];
  };
  gaugebribes?: Bribe[];
}

export type { BaseAsset, Pair, RouteAsset };
