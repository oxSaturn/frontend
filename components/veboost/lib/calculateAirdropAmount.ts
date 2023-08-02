const BOOSTED_FACTOR = 1.02;
const BOOSTED_LOADED = 5_263;
const AIRDROP_SUPPLY = 210_000;

export function calculateAirdropAmount(
  totalLocked: number | string | undefined
) {
  if (typeof totalLocked === "undefined") return 0;
  if (typeof totalLocked === "string") totalLocked = parseFloat(totalLocked);
  const boostedAmount = totalLocked - totalLocked / BOOSTED_FACTOR;
  const eligible = (boostedAmount / BOOSTED_LOADED) * AIRDROP_SUPPLY;
  return eligible;
}
