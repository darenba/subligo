export function buildProductionSku(
  productSku: string,
  lineIndex: number,
  currentDate = new Date(),
) {
  const stamp = currentDate.toISOString().slice(0, 10).replaceAll('-', '');
  const sequence = String(lineIndex).padStart(3, '0');
  return `${productSku}-${stamp}-${sequence}`;
}

export function summarizeCheckout(lineTotals: number[]) {
  const subtotal = round(lineTotals.reduce((sum, value) => sum + value, 0));
  return {
    subtotal,
    tax: 0,
    total: subtotal,
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

