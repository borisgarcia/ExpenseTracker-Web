import React from 'react';
import { CURRENCY_OPTIONS } from '../../utils/currencies';

interface PreferencesFormProps {
  editLimit: string;
  setEditLimit: (v: string) => void;
  editCurrency: string;
  setEditCurrency: (v: string) => void;
  isSavingPrefs: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({
  editLimit,
  setEditLimit,
  editCurrency,
  setEditCurrency,
  isSavingPrefs,
  onSubmit,
}) => (
  <section className="card-panel">
    <h3 className="panel-title">Preferences</h3>
    <form className="expense-form" onSubmit={onSubmit}>
      <div className="form-group">
        <label htmlFor="monthly-budget">Monthly Budget Limit</label>
        <input
          id="monthly-budget"
          type="number"
          step="0.01"
          className="form-input"
          placeholder="e.g., 1500.00"
          value={editLimit}
          onChange={(e) => setEditLimit(e.target.value)}
          required
          disabled={isSavingPrefs}
        />
      </div>

      <div className="form-group">
        <label htmlFor="currency-select">Preferred Currency</label>
        <select
          id="currency-select"
          className="form-input"
          value={editCurrency}
          onChange={(e) => setEditCurrency(e.target.value)}
          required
          disabled={isSavingPrefs}
        >
          {CURRENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="submit-btn" disabled={isSavingPrefs}>
        {isSavingPrefs ? 'Saving...' : 'Save Preferences'}
      </button>
    </form>
  </section>
);
