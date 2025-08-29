export const formatNumber = (value: number, decimals = 1): string => {
  if (value < 1000) {
    // Under 1,000: Show full number
    return Math.floor(value).toString();
  } else if (value < 1000000) {
    // 1,000 - 999,999: Use K format
    const kValue = value / 1000;
    return kValue % 1 === 0 ? `${Math.floor(kValue)}K` : `${kValue.toFixed(decimals)}K`;
  } else {
    // 1,000,000+: Use M format
    const mValue = value / 1000000;
    return mValue % 1 === 0 ? `${Math.floor(mValue)}M` : `${mValue.toFixed(decimals)}M`;
  }
};

export const formatCurrency = (value: number): string => {
  return `${formatNumber(value)} Ⓒ`;
};

export const formatPrice = (value: number): string => {
  // Keep stock prices as-is since they're usually under 1,000
  return `${value.toFixed(2)} Ⓒ`;
};