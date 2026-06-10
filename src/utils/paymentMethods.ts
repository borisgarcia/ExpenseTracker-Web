// ── Types ──────────────────────────────────────────────────────────────────────

export type PaymentMethodType = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_ACCOUNT';
export type CardNetwork = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'OTHER';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  bank?: string | null;
  network?: CardNetwork | null;
  lastFour?: string | null;
  creditLimit?: number | null;
  cutoffDay?: number | null;
  color?: string | null;
  isDefault: boolean;
  isArchived: boolean;
  balance: number;
  currency: string;
  linkedAccountId?: string | null;
  linkedAccount?: {
    id: string;
    type: string;
    label: string;
    balance: number;
    currency: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentMethodPayload {
  type: PaymentMethodType;
  label?: string;
  bank?: string;
  network?: CardNetwork;
  lastFour?: string;
  creditLimit?: number;
  cutoffDay?: number;
  color?: string;
  isDefault?: boolean;
  balance?: number;
  currency?: string;
  linkedAccountId?: string;
}

export interface UpdatePaymentMethodPayload {
  label?: string;
  bank?: string;
  network?: CardNetwork;
  lastFour?: string;
  creditLimit?: number;
  cutoffDay?: number;
  color?: string;
  isDefault?: boolean;
  balance?: number;
  currency?: string;
  linkedAccountId?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

export const PAYMENT_TYPE_LABELS: Record<PaymentMethodType, string> = {
  CASH: 'Cash',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  BANK_ACCOUNT: 'Bank Account',
};

export const CARD_NETWORKS: { value: CardNetwork; label: string }[] = [
  { value: 'VISA', label: 'Visa' },
  { value: 'MASTERCARD', label: 'Mastercard' },
  { value: 'AMEX', label: 'American Express' },
  { value: 'DISCOVER', label: 'Discover' },
  { value: 'OTHER', label: 'Other' },
];

/** Card network icon/color pairs for the UI wallet cards */
export const NETWORK_STYLES: Record<CardNetwork, { icon: string; color: string }> = {
  VISA:       { icon: 'VISA',     color: '#1a1f71' },
  MASTERCARD: { icon: 'MC',       color: '#eb001b' },
  AMEX:       { icon: 'AMEX',     color: '#007bc1' },
  DISCOVER:   { icon: 'DISC',     color: '#f76f20' },
  OTHER:      { icon: '●●●●',     color: '#6b7280' },
};

export const TYPE_GRADIENT: Record<PaymentMethodType, string> = {
  CASH:         'linear-gradient(135deg, #1e3a2f 0%, #2d6a4f 100%)',
  CREDIT_CARD:  'linear-gradient(135deg, #1a1f71 0%, #6610f2 100%)',
  DEBIT_CARD:   'linear-gradient(135deg, #0f2a4a 0%, #0077b6 100%)',
  BANK_ACCOUNT: 'linear-gradient(135deg, #2d1b4e 0%, #6d28d9 100%)',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build a short display label client-side (mirrors server logic for optimistic UI). */
export function buildLabel(
  type: PaymentMethodType,
  network?: CardNetwork | null,
  lastFour?: string | null,
  bank?: string | null,
  customLabel?: string,
): string {
  if (customLabel?.trim()) return customLabel.trim();
  if (type === 'CASH') return 'Cash';
  if (type === 'BANK_ACCOUNT') return bank ? `${bank} Account` : 'Bank Account';

  const netLabel =
    network && network !== 'OTHER'
      ? CARD_NETWORKS.find((n) => n.value === network)?.label ?? 'Card'
      : 'Card';
  return lastFour ? `${netLabel} ···${lastFour}` : netLabel;
}
