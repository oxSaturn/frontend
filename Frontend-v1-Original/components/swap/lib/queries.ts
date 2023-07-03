import { useQuery } from "@tanstack/react-query";
import { Address, useAccount, type PublicClient, usePublicClient } from "wagmi";
import BigNumber from "bignumber.js";

import {
  CONTRACTS,
  NATIVE_TOKEN,
  QUERY_KEYS,
  W_NATIVE_ADDRESS,
} from "../../../stores/constants/constants";
import {
  BaseAsset,
  LegacyQuote,
  Pair,
  QuoteSwapResponse,
  RouteAsset,
} from "../../../stores/types/types";
import { useBaseAssetWithInfo, usePairs } from "../../../lib/global/queries";
import { useTokenPrices } from "../../header/lib/queries";

import { useIsWrapUnwrap } from "./useIsWrapUnwrap";

const getSwapAssets = (
  baseAssets: BaseAsset[] | undefined,
  pairs: Pair[] | undefined
) => {
  if (!baseAssets || !pairs) throw new Error("Need base assets and pairs");

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
  const { data: baseAssetsWithInfo } = useBaseAssetWithInfo();
  const { data: pairs } = usePairs();
  return useQuery({
    queryKey: [QUERY_KEYS.SWAP_ASSETS, baseAssetsWithInfo, pairs],
    queryFn: () => getSwapAssets(baseAssetsWithInfo, pairs),
    enabled: !!baseAssetsWithInfo && !!pairs,
  });
};

export const quoteSwap = async (
  address: Address | undefined,
  options: {
    fromAsset: BaseAsset | null;
    toAsset: BaseAsset | null;
    fromAmount: string;
    slippage: string;
  },
  signal?: AbortSignal
) => {
  if (!address) throw new Error("no address");
  const res = await fetch("/api/firebird-router", {
    method: "POST",
    body: JSON.stringify({
      options,
      address,
    }),
    signal,
  });
  const resJson = (await res.json()) as QuoteSwapResponse;

  return resJson;
};

export function useQuote({
  fromAssetValue,
  toAssetValue,
  fromAmountValue,
  slippage,
  setToAmountValue,
  setToAmountValueUsd,
  loadingTrade,
}: {
  fromAssetValue: BaseAsset | null;
  toAssetValue: BaseAsset | null;
  fromAmountValue: string;
  slippage: string;
  setToAmountValue: (_value: string) => void;
  setToAmountValueUsd: (_value: string) => void;
  loadingTrade: boolean;
}) {
  const { address } = useAccount();
  const { data: tokenPrices } = useTokenPrices();
  const { isWrapUnwrap } = useIsWrapUnwrap({ fromAssetValue, toAssetValue });
  return useQuery({
    queryKey: [
      QUERY_KEYS.QUOTE_SWAP,
      address,
      fromAssetValue,
      toAssetValue,
      fromAmountValue,
      slippage,
    ],
    queryFn: async ({ signal }) =>
      quoteSwap(
        address,
        {
          fromAsset: fromAssetValue,
          toAsset: toAssetValue,
          fromAmount: fromAmountValue,
          slippage,
        },
        signal
      ),
    enabled:
      !loadingTrade &&
      !!fromAssetValue &&
      !!toAssetValue &&
      fromAmountValue !== "" &&
      !isWrapUnwrap,
    onError: () => {
      setToAmountValue("");
      setToAmountValueUsd("");
    },
    onSuccess: (firebirdQuote) => {
      if (!fromAssetValue || !toAssetValue) {
        setToAmountValue("");
        setToAmountValueUsd("");
        return;
      }
      if (
        firebirdQuote.encodedData &&
        firebirdQuote.maxReturn &&
        firebirdQuote.maxReturn.totalFrom ===
          BigNumber(fromAmountValue)
            .multipliedBy(10 ** fromAssetValue.decimals)
            .toFixed(0) &&
        (firebirdQuote.maxReturn.from.toLowerCase() ===
          fromAssetValue.address.toLowerCase() ||
          (firebirdQuote.maxReturn.from ===
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" &&
            fromAssetValue.address === NATIVE_TOKEN.address)) &&
        (firebirdQuote.maxReturn.to.toLowerCase() ===
          toAssetValue.address.toLowerCase() ||
          (firebirdQuote.maxReturn.to ===
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" &&
            toAssetValue.address === NATIVE_TOKEN.address))
      ) {
        if (BigNumber(firebirdQuote.maxReturn.totalTo).eq(0)) {
          setToAmountValue("");
          setToAmountValueUsd("");
          return;
        }

        setToAmountValue(
          BigNumber(firebirdQuote.maxReturn.totalTo)
            .div(10 ** toAssetValue.decimals)
            .toFixed(toAssetValue.decimals, BigNumber.ROUND_DOWN)
        );
        const toAddressLookUp =
          firebirdQuote.maxReturn.to ===
          "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
            ? W_NATIVE_ADDRESS.toLowerCase()
            : firebirdQuote.maxReturn.to.toLowerCase();
        const toUsdValue = BigNumber(firebirdQuote.maxReturn.totalTo)
          .div(10 ** toAssetValue.decimals)
          .multipliedBy(tokenPrices?.get(toAddressLookUp) ?? 0)
          .toFixed(2);
        setToAmountValueUsd(toUsdValue);
      }
    },
    refetchOnWindowFocus: true,
    cacheTime: 0,
    refetchInterval: 10000,
  });
}

export function _useQuote({
  fromAssetValue,
  toAssetValue,
  fromAmountValue,
  setToAmountValue,
  setToAmountValueUsd,
  loadingTrade,
}: {
  fromAssetValue: BaseAsset | null;
  toAssetValue: BaseAsset | null;
  fromAmountValue: string;
  setToAmountValue: (_value: string) => void;
  setToAmountValueUsd: (_value: string) => void;
  loadingTrade: boolean;
}) {
  const client = usePublicClient();
  const { data: tokenPrices } = useTokenPrices();
  const { isWrapUnwrap } = useIsWrapUnwrap({ fromAssetValue, toAssetValue });
  return useQuery({
    queryKey: [
      QUERY_KEYS.QUOTE_SWAP,
      client,
      fromAssetValue,
      toAssetValue,
      fromAmountValue,
    ],
    queryFn: async () =>
      _quoteSwap(client, {
        fromAsset: fromAssetValue,
        toAsset: toAssetValue,
        fromAmount: fromAmountValue,
      }),
    enabled:
      !loadingTrade &&
      !!fromAssetValue &&
      !!toAssetValue &&
      fromAmountValue !== "" &&
      !isWrapUnwrap,
    onError: () => {
      setToAmountValue("");
      setToAmountValueUsd("");
    },
    onSuccess: (firebirdQuote) => {
      if (!fromAssetValue || !toAssetValue) {
        setToAmountValue("");
        setToAmountValueUsd("");
        return;
      }
      if (
        firebirdQuote &&
        firebirdQuote.inputs &&
        firebirdQuote.output &&
        firebirdQuote.inputs.fromAmount === fromAmountValue &&
        firebirdQuote.inputs.fromAsset.address === fromAssetValue.address &&
        firebirdQuote.inputs.toAsset.address === toAssetValue.address
      ) {
        if (BigNumber(firebirdQuote.output.finalValue ?? "0").eq(0)) {
          setToAmountValue("");
          setToAmountValueUsd("");
          return;
        }

        setToAmountValue(
          BigNumber(firebirdQuote.output.finalValue ?? "0").toFixed(8)
        );
        const toAddressLookUp =
          firebirdQuote.inputs.toAsset.address === NATIVE_TOKEN.address
            ? W_NATIVE_ADDRESS.toLowerCase()
            : firebirdQuote.inputs.toAsset.address.toLowerCase();
        const toUsdValue = BigNumber(firebirdQuote.output.finalValue ?? "0")
          .multipliedBy(tokenPrices?.get(toAddressLookUp) ?? 0)
          .toFixed(2);
        setToAmountValueUsd(toUsdValue);
      }
    },
    refetchOnWindowFocus: true,
    cacheTime: 0,
    refetchInterval: 10000,
  });
}

const getRouteAssets = async () => {
  const response = await fetch(`/api/routes`);
  const routeAssetsCall = await response.json();
  return routeAssetsCall.data as RouteAsset[];
};

const _quoteSwap = async (
  viemClient: PublicClient,
  options: {
    fromAsset: BaseAsset | null;
    toAsset: BaseAsset | null;
    fromAmount: string;
  }
) => {
  // route assets are DAI, WFTM and FVM
  const routeAssets = await getRouteAssets();
  const { fromAsset, toAsset, fromAmount } = options;

  if (
    !fromAsset ||
    !toAsset ||
    !fromAmount ||
    !fromAsset.address ||
    !toAsset.address ||
    fromAmount === ""
  ) {
    throw new Error('Missing "fromAsset" or "toAsset" or "fromAmount"');
  }

  const routerContract = {
    abi: CONTRACTS.ROUTER_ABI,
    address: CONTRACTS.ROUTER_ADDRESS,
  } as const;

  const sendFromAmount = BigNumber(fromAmount)
    .times(10 ** fromAsset.decimals)
    .toFixed();

  let addy0 = fromAsset.address;
  let addy1 = toAsset.address;

  if (fromAsset.address === NATIVE_TOKEN.symbol) {
    // @ts-expect-error W_NATIVE_ADDRESS is of type `0x${string}`
    addy0 = W_NATIVE_ADDRESS;
  }
  if (toAsset.address === NATIVE_TOKEN.symbol) {
    // @ts-expect-error W_NATIVE_ADDRESS is of type `0x${string}`
    addy1 = W_NATIVE_ADDRESS;
  }

  const includesRouteAddress = routeAssets.filter((asset) => {
    return (
      asset.address.toLowerCase() == addy0.toLowerCase() ||
      asset.address.toLowerCase() == addy1.toLowerCase()
    );
  });

  let amountOuts: {
    routes: { from: Address; to: Address; stable: boolean }[];
    routeAsset: RouteAsset | null;
    receiveAmounts?: string[];
    finalValue?: string;
  }[] = [];
  // In case router multicall will break make sure you have stable pair with some $$ in it
  if (includesRouteAddress.length === 0) {
    amountOuts = routeAssets
      .map((routeAsset) => {
        return [
          {
            routes: [
              {
                from: addy0,
                to: routeAsset.address,
                stable: true,
              },
              {
                from: routeAsset.address,
                to: addy1,
                stable: true,
              },
            ],
            routeAsset: routeAsset,
          },
          {
            routes: [
              {
                from: addy0,
                to: routeAsset.address,
                stable: false,
              },
              {
                from: routeAsset.address,
                to: addy1,
                stable: false,
              },
            ],
            routeAsset: routeAsset,
          },
          {
            routes: [
              {
                from: addy0,
                to: routeAsset.address,
                stable: true,
              },
              {
                from: routeAsset.address,
                to: addy1,
                stable: false,
              },
            ],
            routeAsset: routeAsset,
          },
          {
            routes: [
              {
                from: addy0,
                to: routeAsset.address,
                stable: false,
              },
              {
                from: routeAsset.address,
                to: addy1,
                stable: true,
              },
            ],
            routeAsset: routeAsset,
          },
        ];
      })
      .flat();
  }

  amountOuts.push({
    routes: [
      {
        from: addy0,
        to: addy1,
        stable: true,
      },
    ],
    routeAsset: null,
  });

  amountOuts.push({
    routes: [
      {
        from: addy0,
        to: addy1,
        stable: false,
      },
    ],
    routeAsset: null,
  });

  const amountsOutCalls = amountOuts.map((route) => {
    return {
      ...routerContract,
      functionName: "getAmountsOut",
      args: [BigInt(sendFromAmount), route.routes],
    } as const;
  });

  const amountsOutResult = await viemClient.multicall({
    allowFailure: true,
    contracts: amountsOutCalls,
  });

  const results = amountsOutResult
    .filter((result) => result.status === "success")
    .map((result) => result.result as bigint[]);

  let receiveAmounts: string[][] = [];

  for (const returnValue of results) {
    if (!returnValue) {
      receiveAmounts.push([sendFromAmount, "0", "0"]);
      continue;
    }
    const arr = returnValue.map((bigint) => {
      return bigint.toString();
    });
    receiveAmounts.push(arr);
  }

  for (let i = 0; i < receiveAmounts.length; i++) {
    amountOuts[i].receiveAmounts = receiveAmounts[i];
    amountOuts[i].finalValue = BigNumber(
      receiveAmounts[i][receiveAmounts[i].length - 1]
    )
      .div(10 ** toAsset.decimals)
      .toFixed(toAsset.decimals);
  }

  const bestAmountOut = amountOuts.reduce((prev, current) => {
    return BigNumber(prev.finalValue ?? "0").gt(current.finalValue ?? "0")
      ? prev
      : current;
  });

  if (!bestAmountOut) {
    throw new Error("No valid route found to complete swap");
  }

  let totalRatio = "1";

  for (let i = 0; i < bestAmountOut.routes.length; i++) {
    if (bestAmountOut.routes[i].stable == true) {
    } else {
      const reserves = await viemClient.readContract({
        ...routerContract,
        functionName: "getReserves",
        args: [
          bestAmountOut.routes[i].from,
          bestAmountOut.routes[i].to,
          bestAmountOut.routes[i].stable,
        ],
      });
      let amountIn = "0";
      let amountOut = "0";
      if (i == 0) {
        amountIn = sendFromAmount;
        amountOut = bestAmountOut.receiveAmounts
          ? bestAmountOut.receiveAmounts[i + 1]
          : "0";
      } else {
        amountIn = bestAmountOut.receiveAmounts
          ? bestAmountOut.receiveAmounts[i]
          : "0";
        amountOut = bestAmountOut.receiveAmounts
          ? bestAmountOut.receiveAmounts[i + 1]
          : "0";
      }

      const amIn = BigNumber(amountIn).div(reserves[0].toString());
      const amOut = BigNumber(amountOut).div(reserves[1].toString());
      const ratio = BigNumber(amOut).div(amIn);

      totalRatio = BigNumber(totalRatio).times(ratio).toFixed(18);
    }
  }

  const priceImpact = BigNumber(1).minus(totalRatio).times(100).toFixed(18);

  const returnValue: LegacyQuote = {
    inputs: {
      fromAmount: fromAmount,
      fromAsset: fromAsset,
      toAsset: toAsset,
    },
    output: bestAmountOut,
    priceImpact: priceImpact,
  };
  return returnValue;
};
