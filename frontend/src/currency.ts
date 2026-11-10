const SOURCE_CURRENCY_TO_INR = 84;

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatRouteCost(sourceAmount: number): string {
  return inrFormatter.format(sourceAmount * SOURCE_CURRENCY_TO_INR);
}
