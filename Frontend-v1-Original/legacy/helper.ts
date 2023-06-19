import { getContract, formatUnits, parseUnits } from "viem";

import { queryClient } from "../pages/_app";

import viemClient from "../stores/connectors/viem";
import { CONTRACTS, QUERY_KEYS } from "../stores/constants/constants";
import {
  DefiLlamaTokenPrice,
  DexScrennerPair,
  TokenForPrice,
} from "../stores/types/types";

const WEEK = 604800;

// # See: https://docs.1inch.io/docs/aggregation-protocol/api/swagger
// # See: https://docs.dexscreener.com/#tokens
// # See: https://defillama.com/docs/api#operations-tag-coins
// # See: https://api.dev.dex.guru/docs#tag/Token-Finance
// # See: https://docs.open.debank.com/en/reference/api-pro-reference/token

class Helper {
  private aggregatorEndpoint = "https://api.1inch.io/v4.0/10/quote";
  private defiLlamaBaseUrl = "https://api.llama.fi";
  private defiLlamaTokenUrl = "https://coins.llama.fi/prices/current";
  private debankEndpoint =
    "https://pro-openapi.debank.com/v1/token?chain=pulsechain";
  private dexScrennerEndpoint = "https://api.dexscreener.com/latest/dex/tokens";
  private dexGuruEndpoint =
    "https://api.dev.dex.guru/v1/chain/10/tokens/%/market";

  getProtocolDefiLlama = async () => {
    const data = await fetch(`${this.defiLlamaBaseUrl}/protocol/velocimeter`);
    const json = await data.json();
    return json as unknown;
  };

  getActivePeriod = async () => {
    try {
      const minterContract = getContract({
        abi: CONTRACTS.MINTER_ABI,
        address: CONTRACTS.MINTER_ADDRESS,
        publicClient: viemClient,
      });
      const activePeriod = await minterContract.read.active_period();

      const activePeriodEnd = parseFloat(activePeriod.toString()) + WEEK;
      return activePeriodEnd;
    } catch (ex) {
      console.log("EXCEPTION. ACTIVE PERIOD ERROR");
      console.log(ex);
      return 0;
    }
  };

  getCirculatingSupply = async () => {
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
          args: ["0x3339ab188839C31a9763352A5a0B7Fb05876BC44"],
        },
        {
          ...flowContract,
          functionName: "balanceOf",
          args: ["0xbB7bbd0496c23B7704213D6dbbe5C39eF8584E45"],
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
        } as const)
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
    const gaugeBalancesSum = gaugeBalances.reduce(
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
        gaugeBalancesSum -
        flowInOptionToken1,
      CONTRACTS.GOV_TOKEN_DECIMALS
    );
    return parseFloat(circulatingSupply);
  };

  getMarketCap = async () => {
    const circulatingSupply = await this.getCirculatingSupply();
    const price = queryClient
      .getQueryData<Map<string, number>>([QUERY_KEYS.TOKEN_PRICES])
      ?.get(CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase());

    if (!price || !circulatingSupply) return 0;
    return circulatingSupply * price;
  };

  protected _getAggregatedPriceInStables = async (token: TokenForPrice) => {
    const price = await this._getDefillamaPriceInStables(token);

    if (price !== 0) {
      return price;
    }

    try {
      return await this._getDexscreenerPriceInStables(token);
    } catch (ex) {
      console.warn(ex);
      return price;
    }
  };

  protected _getDefillamaPriceInStables = async (token: TokenForPrice) => {
    if (token.address === CONTRACTS.STABLE_TOKEN_ADDRESS) {
      return 1.0;
    }

    const chainName = "pulsechain";
    const chainToken = `${chainName}:${token.address.toLowerCase()}`;

    const res = await fetch(`${this.defiLlamaTokenUrl}/${chainToken}`);
    const json = (await res.json()) as DefiLlamaTokenPrice;
    const price = json.coins[chainToken]?.price;

    if (price > 0) {
      return price;
    }

    return 0;
  };

  protected _getChainPriceInStables = async (token: TokenForPrice) => {
    if (token.address === CONTRACTS.STABLE_TOKEN_ADDRESS) {
      return 1.0;
    }

    const routerContract = getContract({
      abi: CONTRACTS.ROUTER_ABI,
      address: CONTRACTS.ROUTER_ADDRESS,
      publicClient: viemClient,
    });

    try {
      const amountOutFromContract = await routerContract.read.getAmountOut([
        parseUnits("1", token.decimals),
        token.address,
        CONTRACTS.STABLE_TOKEN_ADDRESS,
      ]);
      // @ts-expect-error three arguments passed to router so it returns readonly [bigint, boolean]
      const amountOut = formatUnits(amountOutFromContract[0], 6);
      return parseFloat(amountOut);
    } catch (ex) {
      return 0;
    }
  };

  protected _getDebankPriceInStables = async (token: TokenForPrice) => {
    if (token.address === CONTRACTS.STABLE_TOKEN_ADDRESS) {
      return 1.0;
    }

    const res = await fetch(
      `${this.debankEndpoint}&id=${token.address.toLowerCase()}`
    );
    const json = await res.json();
    const price = json.price;

    return 0;
  };

  protected _getDexscreenerPriceInStables = async (token: TokenForPrice) => {
    if (token.address === CONTRACTS.STABLE_TOKEN_ADDRESS) {
      return 1.0;
    }

    const res = await fetch(`
      ${this.dexScrennerEndpoint}/${token.address.toLowerCase()}
    `);
    const json = await res.json();
    const pairs = json.pairs as DexScrennerPair[];

    if (pairs?.length === 0) {
      return 0;
    }

    const sortedPairs = pairs.sort(
      (a, b) =>
        b.txns.h24.buys +
        b.txns.h24.sells -
        (a.txns.h24.buys + a.txns.h24.sells)
    );

    const price = sortedPairs.filter(
      (pair) => pair.baseToken.symbol === token.symbol
    )[0]?.priceUsd;

    if (!price) return 0;

    return parseFloat(price);
  };

  resolveUnstoppableDomain = async (address: `0x${string}` | undefined) => {
    if (!address) return null;
    const res = await fetch("/api/u-domains", {
      method: "POST",
      body: JSON.stringify({
        address,
      }),
    });
    const resJson = (await res.json()) as { domain: string };
    if (!resJson?.domain || resJson?.domain === "") return null;
    return resJson?.domain as string;
  };
}

export default Helper;
