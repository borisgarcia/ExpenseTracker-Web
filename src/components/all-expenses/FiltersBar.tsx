import React from 'react';
import { CURRENCY_OPTIONS } from '../../utils/currencies';
import type { Category } from '../../hooks/useDashboard';

interface FiltersBarProps {
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  filterPayment: string;
  setFilterPayment: (v: string) => void;
  filterCurrency: string;
  setFilterCurrency: (v: string) => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  categories,
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  filterPayment,
  setFilterPayment,
  filterCurrency,
  setFilterCurrency,
}) => (
  <section className="card-panel filters-panel">
    <div className="filters-bar">
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="filter-search">Search Description</label>
        <input
          id="filter-search"
          type="text"
          className="form-input"
          placeholder="Search expenses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="filter-cat">Category</label>
        <select
          id="filter-cat"
          className="form-input"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="filter-payment">Payment Method</label>
        <select
          id="filter-payment"
          className="form-input"
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
        >
          <option value="">All Payment Methods</option>
          <option value="Cash">Cash</option>
          <option value="Credit Card">Credit Card</option>
          <option value="Debit Card">Debit Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="filter-currency">Currency</label>
        <select
          id="filter-currency"
          className="form-input"
          value={filterCurrency}
          onChange={(e) => setFilterCurrency(e.target.value)}
        >
          <option value="">All Currencies</option>
          {CURRENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  </section>
);
