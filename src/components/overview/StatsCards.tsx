import React from 'react';

interface StatsCardsProps {
  monthlyLimit: number;
  totalExpenses: number;
  balance: number;
  formatAmount: (value: number, currCode?: string) => string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  monthlyLimit,
  totalExpenses,
  balance,
  formatAmount,
}) => (
  <section className="stats-grid">
    <div className="stat-card">
      <span className="stat-title">Monthly Budget Limit</span>
      <span className="stat-value">{formatAmount(monthlyLimit)}</span>
    </div>
    <div className="stat-card">
      <span className="stat-title">Total Spent</span>
      <span className="stat-value expenses">{formatAmount(totalExpenses)}</span>
    </div>
    <div className="stat-card">
      <span className="stat-title">Available Balance</span>
      <span className={`stat-value ${balance >= 0 ? 'income' : 'expenses'}`}>
        {formatAmount(balance)}
      </span>
    </div>
  </section>
);
