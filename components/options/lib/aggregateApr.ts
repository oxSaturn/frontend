type MIN_APR = number;
type MAX_APR = number;
interface APR {
  apr?: number;
  aprRange?: readonly [MIN_APR, MAX_APR];
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  reward: number;
  logoUrl: string | undefined;
}
export function aggregateApr(arr: APR[]) {
  // aggreate aprRange for the same token symbol
  const map = new Map<string, APR>();
  for (const apr of arr) {
    const existingApr = map.get(apr.symbol);
    if (existingApr) {
      const [min, max] = apr.aprRange ?? [0, 0];
      const [existingMin, existingMax] = existingApr.aprRange ?? [0, 0];
      existingApr.aprRange = [min + existingMin, max + existingMax] as const;
    } else {
      map.set(apr.symbol, apr);
    }
  }
  return [...map.values()];
}
