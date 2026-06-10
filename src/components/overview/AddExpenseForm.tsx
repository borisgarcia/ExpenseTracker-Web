import React from 'react';
import { CURRENCY_OPTIONS } from '../../utils/currencies';
import { NETWORK_STYLES, type PaymentMethod } from '../../utils/paymentMethods';
import type { Category } from '../../hooks/useDashboard';

interface AddExpenseFormProps {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  description: string;
  setDescription: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  selectedPaymentMethodId: string | null;
  setSelectedPaymentMethodId: (v: string) => void;
  expenseCurrency: string;
  setExpenseCurrency: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const PaymentMethodOption: React.FC<{ method: PaymentMethod; selected: boolean; onClick: () => void }> = ({
  method, selected, onClick,
}) => {
  const netStyle = method.network ? NETWORK_STYLES[method.network] : null;

  return (
    <button
      type="button"
      className={`pm-chip ${selected ? 'pm-chip-selected' : ''}`}
      onClick={onClick}
      title={method.label}
    >
      <span
        className="pm-chip-dot"
        style={{ background: method.color ?? (netStyle?.color ?? '#6b7280') }}
      />
      <span className="pm-chip-label">{method.label}</span>
      {selected && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
    </button>
  );
};

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  categories,
  paymentMethods,
  description,
  setDescription,
  amount,
  setAmount,
  categoryId,
  setCategoryId,
  selectedPaymentMethodId,
  setSelectedPaymentMethodId,
  expenseCurrency,
  setExpenseCurrency,
  onSubmit,
}) => (
  <section className="card-panel">
    <h3 className="panel-title">Add Expense</h3>
    <form className="expense-form" onSubmit={onSubmit}>
      <div className="form-group">
        <label htmlFor="expense-desc">Description</label>
        <input
          id="expense-desc"
          type="text"
          className="form-input"
          placeholder="e.g., Gas, Dinner, Netflix"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
        <div className="form-group">
          <label htmlFor="expense-amount">Amount</label>
          <input
            id="expense-amount"
            type="number"
            step="0.01"
            className="form-input"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="expense-currency">Currency</label>
          <select
            id="expense-currency"
            className="form-input"
            value={expenseCurrency}
            onChange={(e) => setExpenseCurrency(e.target.value)}
            required
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="expense-cat">Category</label>
        <select
          id="expense-cat"
          className="form-input"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          {categories.length === 0 ? (
            <option value="">No categories found</option>
          ) : (
            categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Payment method chip picker */}
      <div className="form-group">
        <label>Payment Method</label>
        {paymentMethods.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            No payment methods. Add one in Settings.
          </p>
        ) : (
          <div className="pm-chips-list">
            {paymentMethods.map((m) => (
              <PaymentMethodOption
                key={m.id}
                method={m}
                selected={selectedPaymentMethodId === m.id}
                onClick={() => setSelectedPaymentMethodId(m.id)}
              />
            ))}
          </div>
        )}
      </div>

      <button type="submit" className="submit-btn">
        Add Expense
      </button>
    </form>
  </section>
);
