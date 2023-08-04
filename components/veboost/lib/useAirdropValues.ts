import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http } from "viem";
import { mantle, base } from "wagmi/chains";

import { DexScrennerPair } from "../../../stores/types/types";
import { PRO_OPTIONS } from "../../../stores/constants/constants";

const baseClient = createPublicClient({
  chain: base,
  transport: http("https://base.blockpi.network/v1/rpc/public"),
});
const BVM_ADDRESS = "0xd386a121991E51Eab5e3433Bf5B1cF4C8884b47a";
const oBVM_ADDRESS = "0x762eb51D2e779EeEc9B239FFB0B2eC8262848f3E";

const mantleClient = createPublicClient({
  chain: mantle,
  transport: http("https://rpc.mantle.xyz/"),
});
const MVM_ADDRESS = "0x861A6Fc736Cbb12ad57477B535B829239c8347d7";
const oMVM_ADDRESS = "0x3b19B8EC75BBf85848d133F1a47710EeEd57Bd90";

export function useAirdropValues() {
  return useQuery({
    queryKey: ["airdropValues", "baseValue", "mantleValue"],
    queryFn: async () => {
      const mantlePrice = await getDexscreenerPriceInStables(
        MVM_ADDRESS,
        "MVM"
      );
      const basePrice = await getDexscreenerPriceInStables(BVM_ADDRESS, "BVM");

      const {
        baseDiscount,
        baseVeDiscount,
        baseMinLpDiscount,
        baseMaxLpDiscount,
        mantleDiscount,
        mantleVeDiscount,
        mantleMinLpDiscount,
        mantleMaxLpDiscount,
      } = await airdropOptionsDiscounts();

      const baseVeValue = basePrice * (baseVeDiscount / 100);
      const baseLiquidValue = basePrice * (baseDiscount / 100);
      const baseMaxValue = basePrice * (baseMaxLpDiscount / 100);
      const baseMinValue = basePrice * (baseMinLpDiscount / 100);

      const mantleVeValue = mantlePrice * (mantleVeDiscount / 100);
      const mantleLiquidValue = mantlePrice * (mantleDiscount / 100);
      const mantleMaxValue = mantlePrice * (mantleMaxLpDiscount / 100);
      const mantleMinValue = mantlePrice * (mantleMinLpDiscount / 100);

      return {
        baseMaxValue,
        baseMinValue,
        baseVeValue,
        baseLiquidValue,
        mantleMaxValue,
        mantleMinValue,
        mantleVeValue,
        mantleLiquidValue,
        mantlePrice,
        basePrice,
      };
    },
    staleTime: 1e3 * 60 * 10, // 10 minutes
  });
}

async function getDexscreenerPriceInStables(
  tokenAddy: `0x${string}`,
  tokenSymbol: string
) {
  const res = await fetch(`
      https://api.dexscreener.com/latest/dex/tokens/${tokenAddy.toLowerCase()}
        `);
  const json = await res.json();
  const pairs = json.pairs as DexScrennerPair[];

  if (pairs?.length === 0 || !pairs) {
    return 0;
  }

  const sortedPairs = pairs.sort(
    (a, b) =>
      b.txns.h24.buys + b.txns.h24.sells - (a.txns.h24.buys + a.txns.h24.sells)
  );

  const price = sortedPairs.filter(
    (pair) =>
      pair.baseToken.symbol === tokenSymbol &&
      pair.baseToken.address.toLowerCase() === tokenAddy.toLowerCase()
  )[0]?.priceUsd;

  if (!price) return 0;

  return parseFloat(price);
}

async function airdropOptionsDiscounts() {
  const [
    mantleAsianDiscount,
    mantleAsianVeDiscount,
    mantleAsianMinLpDiscount,
    mantleAsianMaxLpDiscount,
  ] = await mantleClient.multicall({
    allowFailure: false,
    multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
    contracts: [
      {
        address: oMVM_ADDRESS,
        abi: PRO_OPTIONS.optionTokenABI,
        functionName: "discount",
      },
      {
        address: oMVM_ADDRESS,
        abi: PRO_OPTIONS.optionTokenABI,
        functionName: "veDiscount",
      },
      {
        address: oMVM_ADDRESS,
        abi: PRO_OPTIONS.optionTokenABI,
        functionName: "minLPDiscount",
      },
      {
        address: oMVM_ADDRESS,
        abi: PRO_OPTIONS.optionTokenABI,
        functionName: "maxLPDiscount",
      },
    ],
  });

  const [
    baseAsianDiscount,
    baseAsianVeDiscount,
    baseAsianMinLpDiscount,
    baseAsianMaxLpDiscount,
  ] = await baseClient.multicall({
    allowFailure: false,
    contracts: [
      {
        address: oBVM_ADDRESS,
        abi: PRO_OPTIONS.optionTokenABI,
        functionName: "discount",
      },
      {
        address: oBVM_ADDRESS,
        abi: PRO_OPTIONS.optionTokenABI,
        functionName: "veDiscount",
      },
      {
        address: oBVM_ADDRESS,
        abi: PRO_OPTIONS.optionTokenABI,
        functionName: "minLPDiscount",
      },
      {
        address: oBVM_ADDRESS,
        abi: PRO_OPTIONS.optionTokenABI,
        functionName: "maxLPDiscount",
      },
    ],
  });

  const mantleDiscount = 100 - Number(mantleAsianDiscount);
  const mantleVeDiscount = 100 - Number(mantleAsianVeDiscount);
  const mantleMinLpDiscount = 100 - Number(mantleAsianMinLpDiscount);
  const mantleMaxLpDiscount = 100 - Number(mantleAsianMaxLpDiscount);

  const baseDiscount = 100 - Number(baseAsianDiscount);
  const baseVeDiscount = 100 - Number(baseAsianVeDiscount);
  const baseMinLpDiscount = 100 - Number(baseAsianMinLpDiscount);
  const baseMaxLpDiscount = 100 - Number(baseAsianMaxLpDiscount);

  return {
    mantleDiscount,
    mantleVeDiscount,
    mantleMinLpDiscount,
    mantleMaxLpDiscount,
    baseDiscount,
    baseVeDiscount,
    baseMinLpDiscount,
    baseMaxLpDiscount,
  };
}
