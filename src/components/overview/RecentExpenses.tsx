import React from 'react';
import type { Expense } from '../../hooks/useDashboard';

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

interface RecentExpensesProps {
  expenses: Expense[];
  totalPages: number;
  currentPage: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  onDelete: (id: string) => void;
  formatAmount: (value: number, currCode?: string) => string;
  formatDate: (date: string) => string;
}

export const RecentExpenses: React.FC<RecentExpensesProps> = ({
  expenses,
  totalPages,
  currentPage,
  setPage,
  onDelete,
  formatAmount,
  formatDate,
}) => (
  <section className="card-panel">
    <h3 className="panel-title">Recent Expenses</h3>
    <div className="expenses-list">
      {expenses.length === 0 ? (
        <>
          <div className="expenses-items-wrapper" style={{ minHeight: '408px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              No expenses in the last 30 days.
            </p>
          </div>
          <div className="pagination-controls">
            <button disabled className="pagination-btn">
              Previous
            </button>
            <span className="page-indicator">
              Page 1 of 1
            </span>
            <button disabled className="pagination-btn">
              Next
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="expenses-items-wrapper" style={{ minHeight: '408px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {expenses.map((expense) => {
              const expCurrency = expense.currency ?? 'USD';
              return (
                <div key={expense.id} className="expense-item">
                  <div className="item-left">
                    <span className="item-description">{expense.description}</span>
                    <div className="item-meta">
                      <span className="item-category">{expense.category?.name ?? 'Other'}</span>
                      <span className="item-payment-method">{expense.paymentMethod ?? 'Cash'}</span>
                      <span>•</span>
                      <span>{formatDate(expense.date)}</span>
                    </div>
                  </div>
                  <div className="expense-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="item-amount">-{formatAmount(expense.amount, expCurrency)}</span>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="delete-expense-btn"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f43f5e',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.7,
                        transition: 'opacity 0.2s',
                      }}
                      title="Delete expense"
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

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
        </>
      )}
    </div>
  </section>
);
