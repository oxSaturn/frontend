import { describe, it, expect } from "vitest";

import { calculateAirdropAmount } from "./calculateAirdropAmount";

const totalLocked = 102;
const totalLockedZero = 0;
const toBeLocked = "102";
const toBeLockedUndefined = undefined;

describe("calculateAirdropAmount", () => {
  it("should return right airdrop amount depending on totalLocked", () => {
    const resultTotalLocked = calculateAirdropAmount(totalLocked);
    const resultTotalLockedZero = calculateAirdropAmount(totalLockedZero);
    const resultToBeLocked = calculateAirdropAmount(toBeLocked);
    const resultToBeLockedUndefined =
      calculateAirdropAmount(toBeLockedUndefined);

    expect(resultTotalLocked).toEqual(79.802394071822159);
    expect(resultTotalLockedZero).toEqual(0);
    expect(resultToBeLocked).toEqual(79.802394071822159);
    expect(resultToBeLockedUndefined).toEqual(0);
  });
});
