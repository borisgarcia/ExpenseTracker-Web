import React, { useState } from 'react';
import './Dashboard.css';

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
}

interface DashboardProps {
  user: { name: string; email: string; picture?: string };
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', amount: 45.50, description: 'Supermercado semanal', category: 'Alimentos', date: '2026-06-08' },
    { id: '2', amount: 15.00, description: 'Suscripción mensual', category: 'Entretenimiento', date: '2026-06-07' },
    { id: '3', amount: 120.00, description: 'Electricidad', category: 'Servicios', date: '2026-06-05' },
  ]);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Alimentos');

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description,
      category,
      date: new Date().toISOString().split('T')[0],
    };

    setExpenses([newExpense, ...expenses]);
    setDescription('');
    setAmount('');
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlyLimit = 1500;
  const balance = monthlyLimit - totalExpenses;

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
          <button className="logout-btn" onClick={onLogout}>Cerrar Sesión</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-hero">
          <div className="welcome-msg">
            <h2>Hola, {user.name.split(' ')[0]} 👋</h2>
            <p>Aquí tienes el resumen de tus finanzas para este mes.</p>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-title">Límite de Presupuesto</span>
            <span className="stat-value">${monthlyLimit.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Total Gastado</span>
            <span className="stat-value expenses">${totalExpenses.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-title">Presupuesto Disponible</span>
            <span className="stat-value income">${balance.toFixed(2)}</span>
          </div>
        </section>

        <div className="main-grid">
          <section className="card-panel">
            <h3 className="panel-title">Agregar Gasto</h3>
            <form className="expense-form" onSubmit={handleAddExpense}>
              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Gasolina, Cena, Netflix"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Monto ($)</label>
                <input
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
                <label>Categoría</label>
                <select
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Alimentos">Alimentos</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Entretenimiento">Entretenimiento</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <button type="submit" className="submit-btn">Registrar Gasto</button>
            </form>
          </section>

          <section className="card-panel">
            <h3 className="panel-title">Gastos Recientes</h3>
            <div className="expenses-list">
              {expenses.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No hay gastos registrados aún.</p>
              ) : (
                expenses.map((expense) => (
                  <div key={expense.id} className="expense-item">
                    <div className="item-left">
                      <span className="item-description">{expense.description}</span>
                      <div className="item-meta">
                        <span className="item-category">{expense.category}</span>
                        <span>•</span>
                        <span>{expense.date}</span>
                      </div>
                    </div>
                    <span className="item-amount">-${expense.amount.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
