// Supported currencies — single source of truth for all dropdowns
export interface CurrencyOption {
  value: string;
  label: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'HNL', label: 'HNL (L)' },
  { value: 'MXN', label: 'MXN (MX$)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

export const CURRENCY_SYMBOLS: { [key: string]: string } = {
  USD: '$',
  HNL: 'L ',
  MXN: 'MX$',
  EUR: '€',
  JPY: '¥',
};

// Fallback static rates relative to USD (1 unit = X USD)
export const DEFAULT_EXCHANGE_RATES: { [key: string]: number } = {
  USD: 1.0,
  HNL: 0.0405,
  EUR: 1.08,
  MXN: 0.055,
  JPY: 0.0064,
};

export const formatAmount = (
  value: number,
  currCode: string,
): string => {
  const symbol = CURRENCY_SYMBOLS[currCode] ?? '$';
  return `${symbol}${value.toFixed(2)}`;
};

export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return dateString;
  }
};
