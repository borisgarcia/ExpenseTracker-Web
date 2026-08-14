import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { DEFAULT_EXCHANGE_RATES, formatDate } from '../utils/currencies';
import { usePaymentMethods } from './usePaymentMethods';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  detail?: string | null;
  personInCharge?: string | null;
  source?: string | null;
  emailId?: string | null;
  category: { id: string; name: string };
  date: string;
  paymentMethod?: string;
  paymentMethodId?: string | null;
  paymentMethodRef?: {
    id: string; type: string; label: string;
    bank?: string | null; network?: string | null;
    lastFour?: string | null; color?: string | null;
  } | null;
  currency?: string;
}

export interface Category {
  id: string;
  name: string;
  userId?: string | null;
}

interface UseDashboardOptions {
  user: { name: string; email: string; picture?: string; monthlyBudget?: number; currency?: string };
}

export const useDashboard = ({ user }: UseDashboardOptions) => {
  // ── Core data ──────────────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Payment methods (own hook)
  const pm = usePaymentMethods();

  // ── Add expense form ───────────────────────────────────────────────────────
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  // paymentMethodId: ID of selected PaymentMethod entity (null = unlinked)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [expenseCurrency, setExpenseCurrency] = useState(user.currency ?? 'USD');

  // ── Preferences ───────────────────────────────────────────────────────────
  const [monthlyLimit, setMonthlyLimit] = useState(user.monthlyBudget ?? 1500);
  const [editLimit, setEditLimit] = useState(String(user.monthlyBudget ?? 1500));
  const [currency, setCurrency] = useState(user.currency ?? 'USD');
  const [editCurrency, setEditCurrency] = useState(user.currency ?? 'USD');
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // ── Categories form ────────────────────────────────────────────────────────
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [recentPage, setRecentPage] = useState(1);
  const [allPage, setAllPage] = useState(1);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Exchange rates ─────────────────────────────────────────────────────────
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>(DEFAULT_EXCHANGE_RATES);

  // Sync user prefs when the parent re-renders with updated user object
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

  // Auto-select default payment method once loaded
  useEffect(() => {
    if (pm.defaultMethod && !selectedPaymentMethodId) {
      setSelectedPaymentMethodId(pm.defaultMethod.id);
    }
  }, [pm.defaultMethod, selectedPaymentMethodId]);

  // Reset all-expenses page when any filter changes
  useEffect(() => {
    setAllPage(1);
  }, [searchQuery, filterCategory, filterPayment, filterCurrency]);

  // Fetch live exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://api.frankfurter.app/latest?from=USD');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (data?.rates) {
          const rates: { [key: string]: number } = {
            USD: 1.0,
            HNL: 0.0405,
          };
          Object.keys(data.rates).forEach((curr) => {
            rates[curr] = 1 / data.rates[curr];
          });
          setExchangeRates(rates);
        }
      } catch {
        // Silent fallback to DEFAULT_EXCHANGE_RATES already set
      }
    };
    fetchRates();
  }, []);

  // Fetch expenses and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedExpenses, fetchedCategories] = await Promise.all([
          api.get('/expenses'),
          api.get('/categories'),
        ]);
        setExpenses(fetchedExpenses);
        setCategories(fetchedCategories);
        if (fetchedCategories.length > 0) setCategoryId(fetchedCategories[0].id);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const convertAmount = (val: number, from: string, to: string): number => {
    const fromRate = exchangeRates[from] ?? 1.0;
    const toRate = exchangeRates[to] ?? 1.0;
    return (val * fromRate) / toRate;
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalExpenses = expenses.reduce((sum, exp) => {
    return sum + convertAmount(exp.amount, exp.currency ?? 'USD', currency);
  }, 0);
  const balance = monthlyLimit - totalExpenses;

  // Recent expenses (last 30 days), paginated at 5
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentExpenses = expenses.filter((exp) => new Date(exp.date) >= thirtyDaysAgo);
  const recentPageSize = 5;
  const totalRecentPages = Math.ceil(recentExpenses.length / recentPageSize) || 1;
  const safeRecentPage = Math.min(recentPage, totalRecentPages);
  const paginatedRecentExpenses = recentExpenses.slice(
    (safeRecentPage - 1) * recentPageSize,
    safeRecentPage * recentPageSize,
  );

  // All expenses with client-side filters, paginated at 10
  const filteredAllExpenses = expenses.filter((exp) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      (exp.description && exp.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === '' || exp.category?.id === filterCategory;
    const matchesPayment = filterPayment === '' || exp.paymentMethod === filterPayment;
    const matchesCurrency = filterCurrency === '' || (exp.currency ?? 'USD') === filterCurrency;
    return matchesSearch && matchesCategory && matchesPayment && matchesCurrency;
  });
  const allPageSize = 10;
  const totalAllPages = Math.ceil(filteredAllExpenses.length / allPageSize) || 1;
  const safeAllPage = Math.min(allPage, totalAllPages);
  const paginatedAllExpenses = filteredAllExpenses.slice(
    (safeAllPage - 1) * allPageSize,
    safeAllPage * allPageSize,
  );

  // Unique payment method labels from all expenses for filters dropdown
  const paymentMethodOptions = Array.from(
    new Set(expenses.map((exp) => exp.paymentMethod || 'Cash'))
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !categoryId) return;
    try {
      const newExpense = await api.post('/expenses', {
        amount: parseFloat(amount),
        description,
        categoryId,
        paymentMethodId: selectedPaymentMethodId ?? undefined,
        currency: expenseCurrency,
        date: new Date().toISOString(),
      });
      setExpenses([newExpense, ...expenses]);
      setDescription('');
      setAmount('');
      // Keep selected payment method (user likely pays the same way)
      setExpenseCurrency(currency);
      setRecentPage(1);
      setAllPage(1);
      pm.refetch(); // sync balances
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Error registering expense. Please try again.');
    }
  };

  const refetchExpenses = async () => {
    try {
      const fetched = await api.get('/expenses');
      setExpenses(fetched);
    } catch (err) {
      console.error('Failed to refetch expenses:', err);
    }
  };

  const handleUpdateExpense = async (id: string, updatedFields: Partial<Expense> & { categoryId?: string }) => {
    try {
      const updated = await api.patch(`/expenses/${id}`, updatedFields);
      setExpenses((prev) => prev.map((item) => (item.id === id ? updated : item)));
      pm.refetch();
    } catch (error) {
      console.error('Failed to update expense:', error);
      alert('Error updating expense.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(expenses.filter((exp) => exp.id !== id));
      pm.refetch(); // sync balances
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Could not delete expense.');
    }
  };

  const handleDeleteAllExpenses = async () => {
    try {
      await api.delete('/expenses/all');
      setExpenses([]);
      pm.refetch(); // sync balances
    } catch (error) {
      console.error('Failed to delete all expenses:', error);
      alert('Error al eliminar todas las transacciones.');
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
      const storedUser = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')!)
        : {};
      localStorage.setItem(
        'user',
        JSON.stringify({ ...storedUser, monthlyBudget: updatedUser.monthlyBudget, currency: updatedUser.currency }),
      );
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
      const newCategory = await api.post('/categories', { name: cleanName });
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

  const handleDeleteCategory = async (id: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this category? All expenses in this category will remain, but the category name will default to Other.',
      )
    )
      return;
    try {
      await api.delete(`/categories/${id}`);
      const remaining = categories.filter((cat) => cat.id !== id);
      setCategories(remaining);
      if (categoryId === id) setCategoryId(remaining.length > 0 ? remaining[0].id : '');
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      alert(error.message || 'Could not delete category.');
    }
  };

  return {
    // Data
    expenses, categories, isLoading,
    // Payment methods
    paymentMethods: pm.paymentMethods,
    paymentMethodsLoading: pm.isLoading,
    createPaymentMethod: pm.createMethod,
    updatePaymentMethod: pm.updateMethod,
    deletePaymentMethod: pm.deleteMethod,
    setDefaultPaymentMethod: pm.setDefaultMethod,
    payCardPaymentMethod: pm.payCard,
    // Currency / budget
    currency, monthlyLimit, totalExpenses, balance, convertAmount,
    // Add expense form
    description, setDescription,
    amount, setAmount,
    categoryId, setCategoryId,
    selectedPaymentMethodId, setSelectedPaymentMethodId,
    expenseCurrency, setExpenseCurrency,
    handleAddExpense,
    // Recent expenses (Overview)
    paginatedRecentExpenses, totalRecentPages, safeRecentPage, setRecentPage,
    // All expenses
    filteredAllExpenses,
    paginatedAllExpenses, totalAllPages, safeAllPage, setAllPage,
    paymentMethodOptions,
    // Filters
    searchQuery, setSearchQuery,
    filterCategory, setFilterCategory,
    filterPayment, setFilterPayment,
    filterCurrency, setFilterCurrency,
    // Preferences
    editLimit, setEditLimit,
    editCurrency, setEditCurrency,
    isSavingPrefs, handleUpdatePreferences,
    // Categories
    newCategoryName, setNewCategoryName,
    isAddingCategory, handleAddCategory,
    handleDeleteExpense,
    handleDeleteAllExpenses,
    handleUpdateExpense,
    handleDeleteCategory,
    refetchExpenses,
    // Helpers
    formatDate,
  };
};
