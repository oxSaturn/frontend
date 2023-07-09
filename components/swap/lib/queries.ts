import { useQuery } from "@tanstack/react-query";
import { Address, useAccount } from "wagmi";
import BigNumber from "bignumber.js";

import {
  NATIVE_TOKEN,
  QUERY_KEYS,
  W_NATIVE_ADDRESS,
} from "../../../stores/constants/constants";
import {
  BaseAsset,
  Pair,
  QuoteSwapResponse,
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
