import stores from ".";
import { CONTRACTS } from "./constants/constants";
import type { AbiItem } from "web3-utils";
import {
  DefiLlamaTokenPrice,
  DexScrennerPair,
  RouteAsset,
} from "./types/types";
import BigNumber from "bignumber.js";

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
  tokenPricesMap = new Map<string, number>();

  get getTokenPricesMap() {
    return this.tokenPricesMap;
  }

  _getProtocolTvlDefiLlama = async () => {
    const data = await fetch(`${this.defiLlamaBaseUrl}/protocol/velocimeter`);
    const json = await data.json();
    return json as unknown;
  };

  _getCurrentTvl = async () => {
    const response = await fetch(`${this.defiLlamaBaseUrl}/tvl/velocimeter`);
    const json = await response.json();
    return json as number;
  };

  _getActivePeriod = async () => {
    try {
      const web3 = await stores.accountStore.getWeb3Provider();
      const minterContract = new web3.eth.Contract(
        CONTRACTS.MINTER_ABI as AbiItem[],
        CONTRACTS.MINTER_ADDRESS
      );
      const activePeriod = await minterContract.methods.active_period().call();
      const activePeriodEnd = parseInt(activePeriod) + WEEK;
      return activePeriodEnd;
    } catch (ex) {
      console.log("EXCEPTION. ACTIVE PERIOD ERROR");
      console.log(ex);
      return 0;
    }
  };

  updateTokenPrice = async (token: RouteAsset) => {
    if (this.tokenPricesMap.has(token.address)) {
      return this.tokenPricesMap.get(token.address);
    }

    const price = await this._getTokenPrice(token);
    this.tokenPricesMap.set(token.address, price);
    return price;
  };

  protected _getTokenPrice = async (token: RouteAsset) => {
    let price = 0;

    price = await this._getAggregatedPriceInStables(token);

    if (price === 0) {
      price = await this._getChainPriceInStables(token);
    }
    // TODO this one needs api keys and is not free
    // if (price === 0) {
    //   price = await this._getDebankPriceInStables(token);
    // }
    return price;
  };

  protected _getAggregatedPriceInStables = async (token: RouteAsset) => {
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

  protected _getDefillamaPriceInStables = async (token: RouteAsset) => {
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

  protected _getChainPriceInStables = async (token: RouteAsset) => {
    const web3 = await stores.accountStore.getWeb3Provider();

    if (!web3) return 0;

    if (token.address === CONTRACTS.STABLE_TOKEN_ADDRESS) {
      return 1.0;
    }

    const routerContract = new web3.eth.Contract(
      CONTRACTS.ROUTER_ABI as AbiItem[],
      CONTRACTS.ROUTER_ADDRESS
    );

    try {
      const amountOutFromContract: {
        amount: string;
        stable: boolean;
      } = await routerContract.methods
        .getAmountOut(
          BigNumber(10).pow(token.decimals),
          token.address,
          CONTRACTS.STABLE_TOKEN_ADDRESS
        )
        .call();
      return BigNumber(amountOutFromContract.amount)
        .div(BigNumber(10).pow(token.decimals))
        .toNumber();
    } catch (ex) {
      return 0;
    }
  };

  protected _getDebankPriceInStables = async (token: RouteAsset) => {
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

  protected _getDexscreenerPriceInStables = async (token: RouteAsset) => {
    if (token.address === CONTRACTS.STABLE_TOKEN_ADDRESS) {
      return 1.0;
    }

    const res = await fetch(`
      ${this.dexScrennerEndpoint}/${token.address.toLowerCase()}
    `);
    const json = await res.json();
    const pairs = json.pairs as DexScrennerPair[];

    if (pairs.length === 0) {
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
    )[0].priceUsd;

    return parseFloat(price);
  };
}

export default Helper;
