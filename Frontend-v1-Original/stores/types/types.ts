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

interface GeneralContracts {
  GOV_TOKEN_ADDRESS: string;
  GOV_TOKEN_NAME: string;
  GOV_TOKEN_SYMBOL: string;
  GOV_TOKEN_DECIMALS: number;
  GOV_TOKEN_LOGO: string;
  GOV_TOKEN_ABI: any[];
  VE_TOKEN_ADDRESS: string;
  VE_TOKEN_NAME: string;
  VE_TOKEN_SYMBOL: string;
  VE_TOKEN_DECIMALS: number;
  VE_TOKEN_LOGO: string;
  VE_TOKEN_ABI: any[];
  FACTORY_ADDRESS: string;
  FACTORY_ABI: any[];
  ROUTER_ADDRESS: string;
  ROUTER_ABI: any[];
  VE_DIST_ADDRESS: string;
  VE_DIST_ABI: any[];
  VOTER_ADDRESS: string;
  VOTER_ABI: any[];
  MINTER_ADDRESS: string;
  MINTER_ABI: any[];
  ERC20_ABI: any[];
  PAIR_ABI: any[];
  GAUGE_ABI: any[];
  BRIBE_ABI: any[];
  TOKEN_ABI: any[];
  MULTICALL_ADDRESS: string;
}

interface TestnetContracts extends GeneralContracts {
  WETH_ADDRESS: string;
  WETH_NAME: string;
  WETH_SYMBOL: string;
  WETH_DECIMALS: number;
  WETH_ABI: any[];
  WETH_IMPL_ABI: any[];
  ETH_ADDRESS: string;
  ETH_NAME: string;
  ETH_SYMBOL: string;
  ETH_DECIMALS: number;
  ETH_LOGO: string;
}
interface CantoContracts extends GeneralContracts {
  WCANTO_ADDRESS: string;
  WCANTO_NAME: string;
  WCANTO_SYMBOL: string;
  WCANTO_DECIMALS: number;
  WCANTO_ABI: any[];
  WCANTO_IMPL_ABI: any[];
  CANTO_ADDRESS: string;
  CANTO_NAME: string;
  CANTO_SYMBOL: string;
  CANTO_DECIMALS: number;
  CANTO_LOGO: string;
}
interface ArbitrumContracts extends GeneralContracts {
  WETH_ADDRESS: string;
  WETH_NAME: string;
  WETH_SYMBOL: string;
  WETH_DECIMALS: number;
  WETH_ABI: any[];
  WETH_IMPL_ABI: any[];
  ETH_ADDRESS: string;
  ETH_NAME: string;
  ETH_SYMBOL: string;
  ETH_DECIMALS: number;
  ETH_LOGO: string;
}

type Contracts = TestnetContracts | CantoContracts | ArbitrumContracts;

export type {
  BaseAsset,
  Pair,
  RouteAsset,
  Contracts,
  TestnetContracts,
  CantoContracts,
  ArbitrumContracts,
};
