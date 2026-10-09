export function formatPiAmount(value: number | string | null | undefined) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "0";
  if (amount === 0) return "0";
  return amount.toFixed(7).replace(/\.?0+$/, "");
}