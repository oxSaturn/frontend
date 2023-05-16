import { getContract, formatUnits, parseUnits } from "viem";

import viemClient from "./connectors/viem";
import { CONTRACTS } from "./constants/constants";
import {
  DefiLlamaTokenPrice,
  DexScrennerPair,
  TokenForPrice,
} from "./types/types";

import stores from ".";

const isArbitrum = process.env.NEXT_PUBLIC_CHAINID === "42161";
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
    "https://pro-openapi.debank.com/v1/token?chain=canto";
  private dexScrennerEndpoint = "https://api.dexscreener.com/latest/dex/tokens";
  private dexGuruEndpoint =
    "https://api.dev.dex.guru/v1/chain/10/tokens/%/market";
  // private tokenPricesMap = new Map<string, number>();

  // get getTokenPricesMap() {
  //   return this.tokenPricesMap;
  // }

  getProtocolDefiLlama = async () => {
    const data = await fetch(`${this.defiLlamaBaseUrl}/protocol/velocimeter`);
    const json = await data.json();
    return json as unknown;
  };

  // getCurrentTvl = async () => {
  //   const response = await fetch(`${this.defiLlamaBaseUrl}/tvl/velocimeter`);
  //   const json = await response.json();
  //   return json as number;
  // };

  getActivePeriod = async () => {
    try {
      // const minterContract = new web3.eth.Contract(
      //   CONTRACTS.MINTER_ABI as AbiItem[],
      //   CONTRACTS.MINTER_ADDRESS
      // );
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

  // updateTokenPrice = async (token: TokenForPrice) => {
  //   if (this.tokenPricesMap.has(token.address.toLowerCase())) {
  //     return this.tokenPricesMap.get(token.address.toLowerCase());
  //   }

  //   const price = await this._getTokenPrice(token);
  //   this.tokenPricesMap.set(token.address.toLowerCase(), price);
  //   return price;
  // };

  getCirculatingSupply = async () => {
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

  getMarketCap = async () => {
    const circulatingSupply = await this.getCirculatingSupply();
    const price = stores.stableSwapStore
      .getStore("tokenPrices")
      .get(CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase());

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

    const chainName = isArbitrum ? "arbitrum" : "canto";
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
