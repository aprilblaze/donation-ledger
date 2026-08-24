export function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-US")}`;
}
