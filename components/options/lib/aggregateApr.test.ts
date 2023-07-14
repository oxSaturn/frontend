import { describe, it, expect } from "vitest";

import { aggregateApr } from "./aggregateApr";

type ADDRESS = `0x${string}`;

const tokenA = {
  symbol: "a",
  address: "0x1" as ADDRESS,
  decimals: 18,
  reward: 1,
  logoUrl: "",
};

const tokenB = {
  symbol: "b",
  address: "0x2" as ADDRESS,
  decimals: 18,
  reward: 1,
  logoUrl: "",
};
describe("aggregateApr", () => {
  it("should aggregate aprRange for the same token symbol", () => {
    const aprs = [
      {
        aprRange: [1, 2] as const,
        ...tokenA,
      },
      {
        aprRange: [3, 4] as const,
        ...tokenA,
      },
      {
        aprRange: [5, 6] as const,
        ...tokenB,
      },
    ];
    const result = aggregateApr(aprs);
    expect(result).toEqual([
      {
        aprRange: [4, 6],
        ...tokenA,
      },
      {
        aprRange: [5, 6],
        ...tokenB,
      },
    ]);
  });
});
