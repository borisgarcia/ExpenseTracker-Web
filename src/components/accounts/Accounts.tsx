import React, { useState, useEffect } from 'react';
import {
  PAYMENT_TYPE_LABELS,
  CARD_NETWORKS,
  TYPE_GRADIENT,
  NETWORK_STYLES,
  buildLabel,
  type PaymentMethod,
  type PaymentMethodType,
  type CardNetwork,
  type CreatePaymentMethodPayload,
  type UpdatePaymentMethodPayload,
} from '../../utils/paymentMethods';
import { formatAmount } from '../../utils/currencies';

// ── Icons ──────────────────────────────────────────────────────────────────────

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

// ── Wallet Card ────────────────────────────────────────────────────────────────

interface WalletCardProps {
  method: PaymentMethod;
  onEdit: (method: PaymentMethod) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onPayTrigger: (method: PaymentMethod) => void;
}

const WalletCard: React.FC<WalletCardProps> = ({ method, onEdit, onDelete, onSetDefault, onPayTrigger }) => {
  const gradient = method.color
    ? `linear-gradient(135deg, ${method.color}cc 0%, ${method.color} 100%)`
    : TYPE_GRADIENT[method.type];

  const networkStyle = method.network ? NETWORK_STYLES[method.network] : null;
  const isCash = method.type === 'CASH';

  return (
    <div className="wallet-card" style={{ background: gradient }}>
      {/* Top row */}
      <div className="wallet-card-top">
        <div className="wallet-card-type">{PAYMENT_TYPE_LABELS[method.type]}</div>
        <div className="wallet-card-actions">
          {!method.isDefault && (
            <button
              className="wallet-action-btn"
              title="Set as default"
              onClick={() => onSetDefault(method.id)}
            >
              <StarIcon />
            </button>
          )}
          {method.isDefault && (
            <span className="wallet-default-badge">
              <StarIcon filled /> Default
            </span>
          )}
          <button
            className="wallet-action-btn"
            title="Edit Account"
            onClick={() => onEdit(method)}
          >
            <EditIcon />
          </button>
          {!isCash && (
            <button
              className="wallet-action-btn wallet-action-delete"
              title="Archive Account"
              onClick={() => onDelete(method.id)}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>

      {/* Middle row (Hero balance to avoid wasted space) */}
      <div className="wallet-card-middle">
        {method.type === 'CASH' && (
          <div className="wallet-balance-group">
            <span className="wallet-balance-label">Available Cash</span>
            <span className="wallet-balance-value">{formatAmount(method.balance, method.currency)}</span>
          </div>
        )}

        {method.type === 'BANK_ACCOUNT' && (
          <div className="wallet-balance-group">
            <span className="wallet-balance-label">Available Balance</span>
            <span className="wallet-balance-value">{formatAmount(method.balance, method.currency)}</span>
          </div>
        )}

        {method.type === 'CREDIT_CARD' && (
          <div className="wallet-balance-group">
            <span className="wallet-balance-label">Current Debt</span>
            <div className="wallet-credit-balance-row">
              <span className="wallet-balance-value debt-color">{formatAmount(method.balance, method.currency)}</span>
              {method.balance > 0 && (
                <button
                  className="wallet-pay-btn"
                  onClick={(e) => { e.stopPropagation(); onPayTrigger(method); }}
                >
                  PAY
                </button>
              )}
            </div>
            <span className="wallet-limit-label">Limit: {formatAmount(method.creditLimit || 0, method.currency)}</span>
          </div>
        )}

        {method.type === 'DEBIT_CARD' && (
          <div className="wallet-balance-group">
            <span className="wallet-balance-label">Available (Linked)</span>
            <span className="wallet-balance-value">
              {method.linkedAccount
                ? formatAmount(method.linkedAccount.balance, method.linkedAccount.currency)
                : '—'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="wallet-card-bottom">
        <div className="wallet-info-group">
          <div className="wallet-card-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {method.label}
          </div>
          {method.bank && <div className="wallet-card-bank">{method.bank}</div>}
          {method.type === 'DEBIT_CARD' && method.linkedAccount && (
            <div className="wallet-card-linked-info">Linked: {method.linkedAccount.label}</div>
          )}
        </div>
        <div className="wallet-badge-group">
          {method.lastFour && (
            <div className="wallet-card-number-compact">
              •••• {method.lastFour}
            </div>
          )}
          {networkStyle && (
            <div className="wallet-network-badge" style={{ background: networkStyle.color, flexShrink: 0 }}>
              {networkStyle.icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Payment Method Form (Unified Add/Edit) ──────────────────────────────────────

interface PaymentMethodFormProps {
  onSubmit: (payload: any) => Promise<void>;
  initialData?: PaymentMethod | null;
  onCancel: () => void;
  bankAccounts: PaymentMethod[];
}

const FORM_DEFAULTS = {
  type: 'CREDIT_CARD' as PaymentMethodType,
  label: '',
  bank: '',
  network: 'VISA' as CardNetwork,
  lastFour: '',
  creditLimit: '',
  cutoffDay: '',
  color: '#6610f2',
  isDefault: false,
  balance: '',
  currency: 'USD',
  linkedAccountId: '',
};

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ onSubmit, initialData, onCancel, bankAccounts }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(FORM_DEFAULTS);

  useEffect(() => {
    if (initialData) {
      setForm({
        type: initialData.type,
        label: initialData.label || '',
        bank: initialData.bank || '',
        network: initialData.network || 'VISA',
        lastFour: initialData.lastFour || '',
        creditLimit: initialData.creditLimit != null ? String(initialData.creditLimit) : '',
        cutoffDay: initialData.cutoffDay != null ? String(initialData.cutoffDay) : '',
        color: initialData.color || '#6610f2',
        isDefault: initialData.isDefault,
        balance: initialData.balance != null ? String(initialData.balance) : '0',
        currency: initialData.currency || 'USD',
        linkedAccountId: initialData.linkedAccountId || '',
      });
    } else {
      setForm(FORM_DEFAULTS);
    }
  }, [initialData]);

  const set = (field: keyof typeof FORM_DEFAULTS, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const needsCard = form.type === 'CREDIT_CARD' || form.type === 'DEBIT_CARD';
  const needsCredit = form.type === 'CREDIT_CARD';
  const isCash = form.type === 'CASH';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsCard && form.lastFour && !/^\d{4}$/.test(form.lastFour)) {
      alert('The last 4 digits must be exactly 4 numbers.');
      return;
    }

    if (form.type === 'DEBIT_CARD' && !form.linkedAccountId) {
      alert('Please select a bank account to link with the debit card.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        label: form.label.trim() || undefined,
        bank: form.bank.trim() || undefined,
        color: form.color,
        isDefault: form.isDefault,
        currency: form.currency,
      };

      if (!initialData) {
        payload.type = form.type;
        payload.balance = form.balance ? parseFloat(form.balance) : 0;
      } else {
        payload.balance = form.balance ? parseFloat(form.balance) : 0;
      }

      if (needsCard) {
        payload.network = form.network;
        payload.lastFour = form.lastFour || undefined;
      } else {
        payload.network = undefined;
        payload.lastFour = undefined;
      }

      if (form.type === 'DEBIT_CARD') {
        payload.linkedAccountId = form.linkedAccountId || undefined;
      } else {
        payload.linkedAccountId = undefined;
      }

      if (needsCredit) {
        payload.creditLimit = form.creditLimit ? parseFloat(form.creditLimit) : undefined;
        payload.cutoffDay = form.cutoffDay ? parseInt(form.cutoffDay) : undefined;
      } else {
        payload.creditLimit = undefined;
        payload.cutoffDay = undefined;
      }

      await onSubmit(payload);
    } catch (err: any) {
      alert(err.message || 'Error saving payment method.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      {/* Type */}
      <div className="form-group">
        <label htmlFor="pm-type">Type</label>
        <select
          id="pm-type"
          className="form-input"
          value={form.type}
          onChange={(e) => set('type', e.target.value as PaymentMethodType)}
          disabled={!!initialData || isCash}
        >
          {Object.entries(PAYMENT_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v} disabled={v === 'CASH' && !initialData}>{l}</option>
          ))}
        </select>
      </div>

      {/* Label */}
      <div className="form-group">
        <label htmlFor="pm-label">Name / Custom Label (optional)</label>
        <input
          id="pm-label"
          className="form-input"
          placeholder="e.g. Main Card, Business Account (leave empty to auto-generate)"
          value={form.label}
          onChange={(e) => set('label', e.target.value)}
        />
      </div>

      {/* Bank (only if not CASH) */}
      {!isCash && (
        <div className="form-group">
          <label htmlFor="pm-bank">Bank</label>
          <input
            id="pm-bank"
            className="form-input"
            placeholder="e.g. Chase, Bank of America"
            value={form.bank}
            onChange={(e) => set('bank', e.target.value)}
          />
        </div>
      )}

      {/* Linked account for debit cards */}
      {form.type === 'DEBIT_CARD' && (
        <div className="form-group">
          <label htmlFor="pm-linked-account">Link to Bank Account</label>
          <select
            id="pm-linked-account"
            className="form-input"
            value={form.linkedAccountId}
            onChange={(e) => set('linkedAccountId', e.target.value)}
            required
          >
            <option value="">-- Select Account --</option>
            {bankAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.label} ({acc.bank || 'Bank'}) - Balance: {formatAmount(acc.balance, acc.currency)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Currency (only if not CASH or DEBIT_CARD) */}
      {(form.type === 'BANK_ACCOUNT' || form.type === 'CREDIT_CARD') && (
        <div className="form-group">
          <label htmlFor="pm-currency">Currency</label>
          <select
            id="pm-currency"
            className="form-input"
            value={form.currency}
            onChange={(e) => set('currency', e.target.value)}
          >
            <option value="USD">USD - US Dollar</option>
            <option value="HNL">HNL - Honduran Lempira</option>
            <option value="EUR">EUR - Euro</option>
            <option value="MXN">MXN - Mexican Peso</option>
            <option value="JPY">JPY - Japanese Yen</option>
          </select>
        </div>
      )}

      {/* Starting balance / debt (only if not CASH or DEBIT_CARD) */}
      {(form.type === 'BANK_ACCOUNT' || form.type === 'CREDIT_CARD') && (
        <div className="form-group">
          <label htmlFor="pm-balance">
            {form.type === 'CREDIT_CARD' ? 'Initial used balance (Debt)' : 'Initial / available balance'}
          </label>
          <input
            id="pm-balance"
            type="number"
            step="0.01"
            className="form-input"
            placeholder="0.00"
            value={form.balance}
            onChange={(e) => set('balance', e.target.value)}
          />
        </div>
      )}

      {/* Card-specific fields */}
      {needsCard && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="pm-network">Network</label>
            <select
              id="pm-network"
              className="form-input"
              value={form.network}
              onChange={(e) => set('network', e.target.value as CardNetwork)}
            >
              {CARD_NETWORKS.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="pm-last4">Last 4 digits</label>
            <input
              id="pm-last4"
              className="form-input"
              placeholder="1234"
              maxLength={4}
              value={form.lastFour}
              onChange={(e) => set('lastFour', e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>
      )}

      {/* Credit-specific fields */}
      {needsCredit && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="pm-limit">Credit limit</label>
            <input
              id="pm-limit"
              type="number"
              step="0.01"
              className="form-input"
              placeholder="5000.00"
              value={form.creditLimit}
              onChange={(e) => set('creditLimit', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="pm-cutoff">Cutoff day</label>
            <input
              id="pm-cutoff"
              type="number"
              min={1}
              max={31}
              className="form-input"
              placeholder="15"
              value={form.cutoffDay}
              onChange={(e) => set('cutoffDay', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Color + preview */}
      <div className="pm-color-row">
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="pm-color">Card color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              id="pm-color"
              type="color"
              className="pm-color-input"
              value={form.color}
              onChange={(e) => set('color', e.target.value)}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Preview: <strong style={{ color: form.color }}>
                {buildLabel(form.type, form.network, form.lastFour, form.bank, form.label)}
              </strong>
            </span>
          </div>
        </div>
        {!initialData && (
          <label className="pm-default-toggle" style={{ marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set('isDefault', e.target.checked)}
            />
            <span>Default</span>
          </label>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button type="submit" className="submit-btn" disabled={isSaving} style={{ flex: 1 }}>
          {isSaving ? 'Saving...' : initialData ? 'Save Changes' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="submit-btn"
          style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.08)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

interface AccountsProps {
  paymentMethods: PaymentMethod[];
  onCreate: (payload: CreatePaymentMethodPayload) => Promise<PaymentMethod>;
  onUpdate: (id: string, payload: UpdatePaymentMethodPayload) => Promise<PaymentMethod>;
  onDelete: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  onPayCard: (id: string, fromBankAccountId?: string) => Promise<PaymentMethod>;
}

export const Accounts: React.FC<AccountsProps> = ({
  paymentMethods,
  onCreate,
  onUpdate,
  onDelete,
  onSetDefault,
  onPayCard,
}) => {
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;

  // Pay modal state
  const [payingCard, setPayingCard] = useState<PaymentMethod | null>(null);
  const [paymentSourceId, setPaymentSourceId] = useState<string>('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  const bankAccounts = paymentMethods.filter((m) => m.type === 'BANK_ACCOUNT');

  const totalPages = Math.ceil(paymentMethods.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);

  // Sync current page if paymentMethods delete/change pushes page out of bounds
  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

  const paginatedMethods = paymentMethods.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm('Archive this account? Existing expenses will still show it.')) return;
    try {
      await onDelete(id);
      if (editingMethod?.id === id) {
        setEditingMethod(null);
      }
    } catch (err: any) {
      alert(err.message || 'Could not archive account.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await onSetDefault(id);
    } catch (err: any) {
      alert(err.message || 'Error setting as default.');
    }
  };

  const handlePayCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCard) return;

    setIsSubmittingPay(true);
    try {
      await onPayCard(payingCard.id, paymentSourceId || undefined);
      setPayingCard(null);
      setPaymentSourceId('');
      alert('Payment registered successfully and card debt reset.');
    } catch (err: any) {
      alert(err.message || 'Error processing card payment.');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  return (
    <section className="card-panel" style={{ position: 'relative' }}>
      <h3 className="panel-title">Accounts</h3>

      <div className="wallet-grid">
        {paginatedMethods.map((m) => (
          <WalletCard
            key={m.id}
            method={m}
            onEdit={(method) => {
              setEditingMethod(method);
              setIsAdding(false);
              document.getElementById('pm-form-anchor')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
            onPayTrigger={(method) => {
              setPayingCard(method);
            }}
          />
        ))}
      </div>

      <div className="pagination-controls" style={{ marginTop: '0px', marginBottom: '20px', paddingTop: '12px' }}>
        <button
          disabled={safePage === 1}
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          className="pagination-btn"
        >
          Previous
        </button>
        <span className="page-indicator" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Page {safePage} of {totalPages}
        </span>
        <button
          disabled={safePage >= totalPages}
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          className="pagination-btn"
        >
          Next
        </button>
      </div>

      <div id="pm-form-anchor" style={{ marginBottom: isAdding || editingMethod ? '12px' : '0px' }} />

      {editingMethod ? (
        <div className="add-pm-form-container">
          <h4 className="add-pm-form-title">Edit Account: {editingMethod.label}</h4>
          <PaymentMethodForm
            initialData={editingMethod}
            bankAccounts={bankAccounts}
            onSubmit={async (payload) => {
              await onUpdate(editingMethod.id, payload);
              setEditingMethod(null);
            }}
            onCancel={() => setEditingMethod(null)}
          />
        </div>
      ) : isAdding ? (
        <div className="add-pm-form-container">
          <h4 className="add-pm-form-title">New Account</h4>
          <PaymentMethodForm
            bankAccounts={bankAccounts}
            onSubmit={async (payload) => {
              await onCreate(payload as any);
              setIsAdding(false);
            }}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      ) : (
        <button className="add-payment-method-btn" onClick={() => setIsAdding(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Account
        </button>
      )}

      {/* Credit Card Pay Modal Overlay */}
      {payingCard && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="add-pm-form-container" style={{ width: '90%', maxWidth: '400px', marginTop: 0, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <h4 className="add-pm-form-title" style={{ marginBottom: '16px' }}>
              Pay Card: {payingCard.label}
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Current accumulated debt: <strong style={{ color: '#fca5a5' }}>{formatAmount(payingCard.balance, payingCard.currency)}</strong>
            </p>
            <form className="expense-form" onSubmit={handlePayCardSubmit}>
              <div className="form-group">
                <label htmlFor="pay-source">Pay from Bank Account (optional)</label>
                <select
                  id="pay-source"
                  className="form-input"
                  value={paymentSourceId}
                  onChange={(e) => setPaymentSourceId(e.target.value)}
                >
                  <option value="">-- Just reset debt to 0 --</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.label} - Available: {formatAmount(acc.balance, acc.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button type="submit" className="submit-btn" disabled={isSubmittingPay} style={{ flex: 1 }}>
                  {isSubmittingPay ? 'Processing...' : 'Register Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => { setPayingCard(null); setPaymentSourceId(''); }}
                  className="submit-btn"
                  style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.08)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
