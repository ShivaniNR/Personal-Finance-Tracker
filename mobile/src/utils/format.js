export function formatCurrency(value, decimals = 0) {
  const n = Number(value || 0);
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatSignedCurrency(value, type, decimals = 0) {
  const sign = type === 'INCOME' ? '+' : '-';
  return `${sign}${formatCurrency(Math.abs(Number(value || 0)), decimals)}`;
}
