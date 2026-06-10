import React from 'react';
import type { Expense } from '../../hooks/useDashboard';

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

interface ExpensesTableProps {
  expenses: Expense[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  currency: string;
  onDelete: (id: string) => void;
  convertAmount: (val: number, from: string, to: string) => number;
  formatAmount: (value: number, currCode?: string) => string;
  formatDate: (date: string) => string;
}

export const ExpensesTable: React.FC<ExpensesTableProps> = ({
  expenses,
  totalCount,
  totalPages,
  currentPage,
  setPage,
  currency,
  onDelete,
  convertAmount,
  formatAmount,
  formatDate,
}) => (
  <section className="card-panel">
    <h3 className="panel-title">All Expenses ({totalCount})</h3>
    <div className="table-responsive">
      <table className="expenses-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Payment Method</th>
            <th>Amount (Original)</th>
            <th>Amount ({currency})</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}
              >
                No expenses found matching the selected filters.
              </td>
            </tr>
          ) : (
            expenses.map((expense) => {
              const expCurrency = expense.currency ?? 'USD';
              const convertedValue = convertAmount(expense.amount, expCurrency, currency);
              return (
                <tr key={expense.id} className="table-row">
                  <td>{formatDate(expense.date)}</td>
                  <td style={{ fontWeight: 500 }}>{expense.description}</td>
                  <td>
                    <span className="table-badge category-badge">
                      {expense.category?.name ?? 'Other'}
                    </span>
                  </td>
                  <td>
                    <span className="table-badge payment-badge">
                      {expense.paymentMethod ?? 'Cash'}
                    </span>
                  </td>
                  <td style={{ color: '#f43f5e', fontWeight: 500 }}>
                    -{formatAmount(expense.amount, expCurrency)}
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {expCurrency === currency ? '-' : `~ ${formatAmount(convertedValue, currency)}`}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="delete-expense-btn"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f43f5e',
                        cursor: 'pointer',
                        padding: '4px',
                        opacity: 0.7,
                        transition: 'opacity 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                      title="Delete expense"
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>

    {totalPages > 1 && (
      <div className="pagination-controls">
        <button
          disabled={currentPage === 1}
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          className="pagination-btn"
        >
          Previous
        </button>
        <span className="page-indicator">
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          className="pagination-btn"
        >
          Next
        </button>
      </div>
    )}
  </section>
);
