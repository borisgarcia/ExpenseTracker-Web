import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { formatAmount } from '../utils/currencies';

import { StatsCards } from './overview/StatsCards';
import { AddExpenseForm } from './overview/AddExpenseForm';
import { RecentExpenses } from './overview/RecentExpenses';
import { FiltersBar } from './all-expenses/FiltersBar';
import { ExpensesTable } from './all-expenses/ExpensesTable';
import { PreferencesForm } from './settings/PreferencesForm';
import { CategoryManager } from './settings/CategoryManager';
import { Accounts } from './accounts/Accounts';

import './Dashboard.css';

interface DashboardProps {
  user: { name: string; email: string; picture?: string; monthlyBudget?: number; currency?: string };
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [currentTab, setCurrentTab] = useState<'overview' | 'all_expenses' | 'accounts' | 'settings'>('overview');
  const d = useDashboard({ user });

  // Bind formatAmount to the user's preferred currency as default
  const fmt = (value: number, currCode?: string) =>
    formatAmount(value, currCode ?? d.currency);

  return (
    <div className="dashboard-container">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="brand-logo">MiPisto</div>
        </div>
        <div className="header-right">
          <div className="user-profile">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="user-avatar" />
            ) : (
              <div
                className="user-avatar"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-gradient)' }}
              >
                {user.name[0]}
              </div>
            )}
            <span className="user-name">{user.name}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <div className="tabs-nav">
        <button className={`tab-btn ${currentTab === 'overview' ? 'active' : ''}`} onClick={() => setCurrentTab('overview')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
          </svg>
          Overview
        </button>
        <button className={`tab-btn ${currentTab === 'all_expenses' ? 'active' : ''}`} onClick={() => setCurrentTab('all_expenses')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <circle cx="3" cy="6" r="1"></circle>
            <circle cx="3" cy="12" r="1"></circle>
            <circle cx="3" cy="18" r="1"></circle>
          </svg>
          All Expenses
        </button>
        <button className={`tab-btn ${currentTab === 'accounts' ? 'active' : ''}`} onClick={() => setCurrentTab('accounts')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
            <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
          Accounts
        </button>
        <button className={`tab-btn ${currentTab === 'settings' ? 'active' : ''}`} onClick={() => setCurrentTab('settings')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Settings
        </button>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="dashboard-content" style={{ paddingTop: '20px' }}>
        {d.isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading your finances...</p>
          </div>

        ) : currentTab === 'overview' ? (
          <>
            <section className="dashboard-hero">
              <div className="welcome-msg">
                <h2>Hello, {user.name.split(' ')[0]} 👋</h2>
                <p>Here is your financial summary for this month.</p>
              </div>
            </section>

            <StatsCards
              monthlyLimit={d.monthlyLimit}
              totalExpenses={d.totalExpenses}
              balance={d.balance}
              formatAmount={fmt}
            />

            <div className="main-grid">
              <AddExpenseForm
                categories={d.categories}
                paymentMethods={d.paymentMethods}
                description={d.description}
                setDescription={d.setDescription}
                amount={d.amount}
                setAmount={d.setAmount}
                categoryId={d.categoryId}
                setCategoryId={d.setCategoryId}
                selectedPaymentMethodId={d.selectedPaymentMethodId}
                setSelectedPaymentMethodId={d.setSelectedPaymentMethodId}
                expenseCurrency={d.expenseCurrency}
                setExpenseCurrency={d.setExpenseCurrency}
                onSubmit={d.handleAddExpense}
              />
              <RecentExpenses
                expenses={d.paginatedRecentExpenses}
                totalPages={d.totalRecentPages}
                currentPage={d.safeRecentPage}
                setPage={d.setRecentPage}
                onDelete={d.handleDeleteExpense}
                formatAmount={fmt}
                formatDate={d.formatDate}
              />
            </div>
          </>

        ) : currentTab === 'all_expenses' ? (
          <>
            <FiltersBar
              categories={d.categories}
              paymentMethodOptions={d.paymentMethodOptions}
              searchQuery={d.searchQuery}
              setSearchQuery={d.setSearchQuery}
              filterCategory={d.filterCategory}
              setFilterCategory={d.setFilterCategory}
              filterPayment={d.filterPayment}
              setFilterPayment={d.setFilterPayment}
              filterCurrency={d.filterCurrency}
              setFilterCurrency={d.setFilterCurrency}
            />
            <ExpensesTable
              expenses={d.paginatedAllExpenses}
              totalCount={d.filteredAllExpenses.length}
              totalPages={d.totalAllPages}
              currentPage={d.safeAllPage}
              setPage={d.setAllPage}
              currency={d.currency}
              onDelete={d.handleDeleteExpense}
              convertAmount={d.convertAmount}
              formatAmount={fmt}
              formatDate={d.formatDate}
            />
          </>

        ) : currentTab === 'accounts' ? (
          <Accounts
            paymentMethods={d.paymentMethods}
            onCreate={d.createPaymentMethod}
            onUpdate={d.updatePaymentMethod}
            onDelete={d.deletePaymentMethod}
            onSetDefault={d.setDefaultPaymentMethod}
            onPayCard={d.payCardPaymentMethod}
          />
        ) : (
          <div className="main-grid">
            <PreferencesForm
              editLimit={d.editLimit}
              setEditLimit={d.setEditLimit}
              editCurrency={d.editCurrency}
              setEditCurrency={d.setEditCurrency}
              isSavingPrefs={d.isSavingPrefs}
              onSubmit={d.handleUpdatePreferences}
            />
            <div className="main-grid-column">
              <CategoryManager
                categories={d.categories}
                newCategoryName={d.newCategoryName}
                setNewCategoryName={d.setNewCategoryName}
                isAddingCategory={d.isAddingCategory}
                onAddCategory={d.handleAddCategory}
                onDeleteCategory={d.handleDeleteCategory}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
