import React from 'react';
import { CURRENCY_OPTIONS } from '../../utils/currencies';
import type { Category } from '../../hooks/useDashboard';

interface AddExpenseFormProps {
  categories: Category[];
  description: string;
  setDescription: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  expenseCurrency: string;
  setExpenseCurrency: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  categories,
  description,
  setDescription,
  amount,
  setAmount,
  categoryId,
  setCategoryId,
  paymentMethod,
  setPaymentMethod,
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

      <div className="form-group">
        <label htmlFor="expense-payment">Payment Method</label>
        <select
          id="expense-payment"
          className="form-input"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
        >
          <option value="Cash">Cash</option>
          <option value="Credit Card">Credit Card</option>
          <option value="Debit Card">Debit Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
      </div>

      <button type="submit" className="submit-btn">
        Add Expense
      </button>
    </form>
  </section>
);
