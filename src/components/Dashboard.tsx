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
}

interface Category {
  id: string;
  name: string;
}

interface DashboardProps {
  user: { name: string; email: string; picture?: string };
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

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
        date: new Date().toISOString(),
      });

      setExpenses([newExpense, ...expenses]);
      setDescription('');
      setAmount('');
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Error registering expense. Please try again.');
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

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlyLimit = 1500;
  const balance = monthlyLimit - totalExpenses;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  };

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

      <main className="dashboard-content">
        <section className="dashboard-hero">
          <div className="welcome-msg">
            <h2>Hello, {user.name.split(' ')[0]} 👋</h2>
            <p>Here is your financial summary for this month.</p>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-title">Monthly Budget Limit</span>
            <span className="stat-value">${monthlyLimit.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Total Spent</span>
            <span className="stat-value expenses">${totalExpenses.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Available Balance</span>
            <span className="stat-value income">${balance.toFixed(2)}</span>
          </div>
        </section>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading your finances...</p>
          </div>
        ) : (
          <div className="main-grid">
            <div className="main-grid-column">
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
                  <div className="form-group">
                    <label htmlFor="expense-amount">Amount ($)</label>
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
                  <button type="submit" className="submit-btn">Add Expense</button>
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
              <h3 className="panel-title">Recent Expenses</h3>
              <div className="expenses-list">
                {expenses.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No expenses registered yet.</p>
                ) : (
                  expenses.map((expense) => (
                    <div key={expense.id} className="expense-item">
                      <div className="item-left">
                        <span className="item-description">{expense.description}</span>
                        <div className="item-meta">
                          <span className="item-category">{expense.category?.name || 'Other'}</span>
                          <span>•</span>
                          <span>{formatDate(expense.date)}</span>
                        </div>
                      </div>
                      <div className="expense-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="item-amount">-${expense.amount.toFixed(2)}</span>
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
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
