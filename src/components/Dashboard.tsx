import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import './Dashboard.css';

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: {
    id: string;
    name: string;
  };
  date: string;
  paymentMethod?: string;
  currency?: string;
}

interface Category {
  id: string;
  name: string;
  userId?: string | null;
}

interface DashboardProps {
  user: { name: string; email: string; picture?: string; monthlyBudget?: number; currency?: string };
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'overview' | 'all_expenses' | 'settings'>('overview');

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [expenseCurrency, setExpenseCurrency] = useState(user.currency || 'USD');

  // Pagination states
  const [recentPage, setRecentPage] = useState(1);
  const [allPage, setAllPage] = useState(1);

  // Filter states
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const [monthlyLimit, setMonthlyLimit] = useState(user.monthlyBudget || 1500);
  const [editLimit, setEditLimit] = useState(String(user.monthlyBudget || 1500));
  const [currency, setCurrency] = useState(user.currency || 'USD');
  const [editCurrency, setEditCurrency] = useState(user.currency || 'USD');
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    if (user.monthlyBudget !== undefined) {
      setMonthlyLimit(user.monthlyBudget);
      setEditLimit(String(user.monthlyBudget));
    }
    if (user.currency !== undefined) {
      setCurrency(user.currency);
      setEditCurrency(user.currency);
      setExpenseCurrency(user.currency);
    }
  }, [user.monthlyBudget, user.currency]);

  // Reset all page on filters change
  useEffect(() => {
    setAllPage(1);
  }, [searchQuery, filterCategory, filterPayment, filterCurrency]);

  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({
    USD: 1.0,
    HNL: 0.0405,
    EUR: 1.08,
    MXN: 0.055,
    JPY: 0.0064,
  });

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch('https://api.frankfurter.app/latest?from=USD');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (data && data.rates) {
          const rates: { [key: string]: number } = { 
            USD: 1.0,
            HNL: 0.0405,
          };
          Object.keys(data.rates).forEach((curr) => {
            rates[curr] = 1 / data.rates[curr];
          });
          setExchangeRates(rates);
          console.log('Successfully loaded exchange rates from Frankfurter API');
        }
      } catch (err) {
        console.error('Failed to fetch rates from Frankfurter API, using fallback static rates:', err);
      }
    };
    fetchExchangeRates();
  }, []);

  const convertAmount = (val: number, from: string, to: string) => {
    const fromRate = exchangeRates[from] || 1.0;
    const toRate = exchangeRates[to] || 1.0;
    return (val * fromRate) / toRate;
  };

  const formatAmount = (value: number, currCode?: string) => {
    const symbols: { [key: string]: string } = {
      USD: '$',
      HNL: 'L ',
      MXN: 'MX$',
      EUR: '€',
      JPY: '¥',
    };
    const targetCurrency = currCode || currency;
    const symbol = symbols[targetCurrency] || '$';
    return `${symbol}${value.toFixed(2)}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedExpenses, fetchedCategories] = await Promise.all([
          api.get('/expenses'),
          api.get('/categories'),
        ]);
        setExpenses(fetchedExpenses);
        setCategories(fetchedCategories);
        if (fetchedCategories.length > 0) {
          setCategoryId(fetchedCategories[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !categoryId) return;

    try {
      const newExpense = await api.post('/expenses', {
        amount: parseFloat(amount),
        description,
        categoryId,
        paymentMethod,
        currency: expenseCurrency,
        date: new Date().toISOString(),
      });

      setExpenses([newExpense, ...expenses]);
      setDescription('');
      setAmount('');
      setPaymentMethod('Cash');
      setExpenseCurrency(currency);
      setRecentPage(1);
      setAllPage(1);
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Error registering expense. Please try again.');
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(editLimit);
    if (isNaN(limitNum) || limitNum < 0) {
      alert('Please enter a valid positive number for the budget limit.');
      return;
    }

    setIsSavingPrefs(true);
    try {
      const updatedUser = await api.patch('/users/me', {
        monthlyBudget: limitNum,
        currency: editCurrency,
      });

      setMonthlyLimit(updatedUser.monthlyBudget);
      setEditLimit(String(updatedUser.monthlyBudget));
      setCurrency(updatedUser.currency);
      setEditCurrency(updatedUser.currency);
      
      const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : {};
      localStorage.setItem('user', JSON.stringify({ 
        ...storedUser, 
        monthlyBudget: updatedUser.monthlyBudget,
        currency: updatedUser.currency
      }));
      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      alert('Error saving preferences. Please try again.');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCategoryName.trim();
    if (!cleanName) return;

    setIsAddingCategory(true);
    try {
      const newCategory = await api.post('/categories', {
        name: cleanName,
      });

      setCategories([...categories, newCategory]);
      setCategoryId(newCategory.id);
      setNewCategoryName('');
    } catch (error: any) {
      console.error('Failed to add category:', error);
      alert(error.message || 'Error creating category. Please try again.');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(expenses.filter((exp) => exp.id !== id));
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Could not delete expense.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? All expenses in this category will remain, but the category name will default to Other.')) {
      return;
    }
    try {
      await api.delete(`/categories/${id}`);
      const remainingCats = categories.filter((cat) => cat.id !== id);
      setCategories(remainingCats);
      if (categoryId === id) {
        setCategoryId(remainingCats.length > 0 ? remainingCats[0].id : '');
      }
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      alert(error.message || 'Could not delete category.');
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => {
    const expCurrency = exp.currency || 'USD';
    const amountInUserCurrency = convertAmount(exp.amount, expCurrency, currency);
    return sum + amountInUserCurrency;
  }, 0);
  const balance = monthlyLimit - totalExpenses;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  };

  // Recent expenses (filtered to last 30 days)
  const recentExpenses = expenses.filter((exp) => {
    const expDate = new Date(exp.date);
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return expDate >= thirtyDaysAgo;
  });

  const recentPageSize = 5;
  const totalRecentPages = Math.ceil(recentExpenses.length / recentPageSize) || 1;
  const safeRecentPage = Math.min(recentPage, totalRecentPages);
  const startIndexRecent = (safeRecentPage - 1) * recentPageSize;
  const paginatedRecentExpenses = recentExpenses.slice(startIndexRecent, startIndexRecent + recentPageSize);

  // All expenses filters
  const filteredAllExpenses = expenses.filter((exp) => {
    const matchesSearch = searchQuery.trim() === '' || 
      (exp.description && exp.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === '' || exp.category?.id === filterCategory;
    const matchesPayment = filterPayment === '' || exp.paymentMethod === filterPayment;
    const matchesCurrency = filterCurrency === '' || (exp.currency || 'USD') === filterCurrency;
    return matchesSearch && matchesCategory && matchesPayment && matchesCurrency;
  });

  const allPageSize = 10;
  const totalAllPages = Math.ceil(filteredAllExpenses.length / allPageSize) || 1;
  const safeAllPage = Math.min(allPage, totalAllPages);
  const startIndexAll = (safeAllPage - 1) * allPageSize;
  const paginatedAllExpenses = filteredAllExpenses.slice(startIndexAll, startIndexAll + allPageSize);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="brand-logo">ExpenseTracker</div>
        </div>
        <div className="header-right">
          <div className="user-profile">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="user-avatar" />
            ) : (
              <div className="user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-gradient)' }}>
                {user.name[0]}
              </div>
            )}
            <span className="user-name">{user.name}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="tabs-nav">
        <button 
          className={`tab-btn ${currentTab === 'overview' ? 'active' : ''}`}
          onClick={() => setCurrentTab('overview')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
          </svg>
          Overview
        </button>
        <button 
          className={`tab-btn ${currentTab === 'all_expenses' ? 'active' : ''}`}
          onClick={() => setCurrentTab('all_expenses')}
        >
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
        <button 
          className={`tab-btn ${currentTab === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentTab('settings')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Settings
        </button>
      </div>

      <main className="dashboard-content" style={{ paddingTop: '20px' }}>
        {isLoading ? (
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
                <span className={`stat-value ${balance >= 0 ? 'income' : 'expenses'}`}>{formatAmount(balance)}</span>
              </div>
            </section>

            <div className="main-grid">
              <section className="card-panel">
                <h3 className="panel-title">Add Expense</h3>
                <form className="expense-form" onSubmit={handleAddExpense}>
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
                        <option value="USD">USD ($)</option>
                        <option value="HNL">L (L)</option>
                        <option value="MXN">MXN (MX$)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="JPY">JPY (¥)</option>
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
                  <button type="submit" className="submit-btn">Add Expense</button>
                </form>
              </section>

              <section className="card-panel">
                <h3 className="panel-title">Recent Expenses</h3>
                <div className="expenses-list">
                  {paginatedRecentExpenses.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No expenses in the last 30 days.</p>
                  ) : (
                    <>
                      {paginatedRecentExpenses.map((expense) => {
                        const expCurrency = expense.currency || 'USD';
                        return (
                          <div key={expense.id} className="expense-item">
                            <div className="item-left">
                              <span className="item-description">{expense.description}</span>
                              <div className="item-meta">
                                <span className="item-category">{expense.category?.name || 'Other'}</span>
                                <span className="item-payment-method">{expense.paymentMethod || 'Cash'}</span>
                                <span>•</span>
                                <span>{formatDate(expense.date)}</span>
                              </div>
                            </div>
                            <div className="expense-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span className="item-amount">-{formatAmount(expense.amount, expCurrency)}</span>
                              <button 
                                onClick={() => handleDeleteExpense(expense.id)}
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
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {totalRecentPages > 1 && (
                        <div className="pagination-controls">
                          <button 
                            disabled={safeRecentPage === 1} 
                            onClick={() => setRecentPage(prev => Math.max(prev - 1, 1))}
                            className="pagination-btn"
                          >
                            Previous
                          </button>
                          <span className="page-indicator">Page {safeRecentPage} of {totalRecentPages}</span>
                          <button 
                            disabled={safeRecentPage >= totalRecentPages} 
                            onClick={() => setRecentPage(prev => Math.min(prev + 1, totalRecentPages))}
                            className="pagination-btn"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>
            </div>
          </>
        ) : currentTab === 'all_expenses' ? (
          <>
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
                    <option value="USD">USD ($)</option>
                    <option value="HNL">HNL (L)</option>
                    <option value="MXN">MXN (MX$)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="card-panel">
              <h3 className="panel-title">All Expenses ({filteredAllExpenses.length})</h3>
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
                    {paginatedAllExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No expenses found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedAllExpenses.map((expense) => {
                        const expCurrency = expense.currency || 'USD';
                        const convertedValue = convertAmount(expense.amount, expCurrency, currency);
                        return (
                          <tr key={expense.id} className="table-row">
                            <td>{formatDate(expense.date)}</td>
                            <td style={{ fontWeight: 500 }}>{expense.description}</td>
                            <td>
                              <span className="table-badge category-badge">{expense.category?.name || 'Other'}</span>
                            </td>
                            <td>
                              <span className="table-badge payment-badge">{expense.paymentMethod || 'Cash'}</span>
                            </td>
                            <td style={{ color: '#f43f5e', fontWeight: 500 }}>
                              -{formatAmount(expense.amount, expCurrency)}
                            </td>
                            <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                              {expCurrency === currency ? '-' : `~ ${formatAmount(convertedValue, currency)}`}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
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
                                  alignItems: 'center'
                                }}
                                title="Delete expense"
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {totalAllPages > 1 && (
                <div className="pagination-controls">
                  <button 
                    disabled={safeAllPage === 1} 
                    onClick={() => setAllPage(prev => Math.max(prev - 1, 1))}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="page-indicator">Page {safeAllPage} of {totalAllPages}</span>
                  <button 
                    disabled={safeAllPage >= totalAllPages} 
                    onClick={() => setAllPage(prev => Math.min(prev + 1, totalAllPages))}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="main-grid">
            <div className="main-grid-column">
              <section className="card-panel">
                <h3 className="panel-title">Preferences</h3>
                <form className="expense-form" onSubmit={handleUpdatePreferences}>
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
                      <option value="USD">USD ($)</option>
                      <option value="HNL">HNL (L)</option>
                      <option value="MXN">MXN (MX$)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                  <button type="submit" className="submit-btn" disabled={isSavingPrefs}>
                    {isSavingPrefs ? 'Saving...' : 'Save Preferences'}
                  </button>
                </form>
              </section>

              <section className="card-panel">
                <h3 className="panel-title">Add Category</h3>
                <form className="expense-form" onSubmit={handleAddCategory}>
                  <div className="form-group">
                    <label htmlFor="category-name">Category Name</label>
                    <input
                      id="category-name"
                      type="text"
                      className="form-input"
                      placeholder="e.g., Entertainment, Utilities"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                      disabled={isAddingCategory}
                    />
                  </div>
                  <button type="submit" className="submit-btn" disabled={isAddingCategory}>
                    {isAddingCategory ? 'Adding...' : 'Add Category'}
                  </button>
                </form>
              </section>
            </div>

            <section className="card-panel">
              <h3 className="panel-title">Manage Categories</h3>
              <div className="settings-category-list" style={{
                maxHeight: '380px',
                overflowY: 'auto',
                paddingRight: '4px'
              }}>
                {categories.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No categories created yet.</p>
                ) : (
                  categories.map((cat) => {
                    const isSystemCategory = !cat.userId;
                    return (
                      <div key={cat.id} className="category-item" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontWeight: 500 }}>{cat.name}</span>
                        {isSystemCategory ? (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>System</span>
                        ) : (
                          <button 
                            onClick={() => handleDeleteCategory(cat.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f43f5e',
                              cursor: 'pointer',
                              padding: '4px',
                              opacity: 0.7,
                              transition: 'opacity 0.2s',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Delete category"
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
