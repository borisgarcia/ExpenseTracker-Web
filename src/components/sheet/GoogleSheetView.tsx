import React, { useState, useMemo } from 'react';
import type { Expense, Category } from '../../hooks/useDashboard';
import './GoogleSheetView.css';

interface GoogleSheetViewProps {
  expenses: Expense[];
  categories: Category[];
  paymentMethods: any[];
  onUpdateExpense: (id: string, updated: any) => void;
  onDeleteExpense: (id: string) => void;
  onOpenGmailSync: () => void;
  userName?: string;
}

export const GoogleSheetView: React.FC<GoogleSheetViewProps> = ({
  expenses,
  categories,
  paymentMethods,
  onUpdateExpense,
  onDeleteExpense,
  onOpenGmailSync,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [personFilter, setPersonFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Category Color Map with modern vibrant pill styles
  const getCategoryStyle = (catName: string = 'Otros') => {
    const name = catName.toLowerCase();
    if (name.includes('transporte')) {
      return { bg: 'linear-gradient(135deg, #d97706, #b45309)', color: '#ffffff' }; // Amber/Orange
    }
    if (name.includes('servicio')) {
      return { bg: 'linear-gradient(135deg, #4b5563, #374151)', color: '#ffffff' }; // Sleek Gray
    }
    if (name.includes('casa')) {
      return { bg: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#ffffff' }; // Warm Coral/Orange
    }
    if (name.includes('supermercado') || name.includes('super')) {
      return { bg: 'linear-gradient(135deg, #a855f7, #7e22ce)', color: '#ffffff' }; // Vibrant Purple
    }
    if (name.includes('mascota')) {
      return { bg: 'linear-gradient(135deg, #14b8a6, #0f766e)', color: '#ffffff' }; // Emerald/Teal
    }
    if (name.includes('bienes')) {
      return { bg: 'linear-gradient(135deg, #6366f1, #4338ca)', color: '#ffffff' }; // Indigo
    }
    return { bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#ffffff' }; // Electric Blue (Otros)
  };

  // Month list from expenses
  const months = useMemo(() => {
    const monthSet = new Set<string>();
    expenses.forEach((exp) => {
      if (exp.date) {
        const d = new Date(exp.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthSet.add(key);
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      let matchesMonth = true;
      if (selectedMonth !== 'ALL') {
        const d = new Date(exp.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        matchesMonth = key === selectedMonth;
      }

      let matchesPerson = true;
      if (personFilter !== 'ALL') {
        matchesPerson = (exp.personInCharge || 'Boris') === personFilter;
      }

      let matchesCategory = true;
      if (categoryFilter !== 'ALL') {
        matchesCategory = exp.category?.id === categoryFilter;
      }

      let matchesSearch = true;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const desc = (exp.description || '').toLowerCase();
        const det = (exp.detail || '').toLowerCase();
        const pm = (exp.paymentMethod || '').toLowerCase();
        const cat = (exp.category?.name || '').toLowerCase();
        matchesSearch = desc.includes(q) || det.includes(q) || pm.includes(q) || cat.includes(q);
      }

      return matchesMonth && matchesPerson && matchesCategory && matchesSearch;
    });
  }, [expenses, selectedMonth, personFilter, categoryFilter, searchQuery]);

  // Calculate totals and statistics
  const totalAmountHNL = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [filteredExpenses]);

  const avgAmountHNL = useMemo(() => {
    return filteredExpenses.length > 0 ? totalAmountHNL / filteredExpenses.length : 0;
  }, [totalAmountHNL, filteredExpenses]);

  const totalsByPerson = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((exp) => {
      const p = exp.personInCharge || 'Boris';
      map[p] = (map[p] || 0) + (exp.amount || 0);
    });
    return map;
  }, [filteredExpenses]);

  const formatHNL = (amount: number) => {
    return `L ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateSheet = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const handleExportCSV = () => {
    const headers = ['Fecha', 'Categoría', 'Concepto', 'Detalle', 'Método de Pago', 'Encargado', 'Monto'];
    const rows = filteredExpenses.map((exp) => [
      formatDateSheet(exp.date),
      exp.category?.name || 'Otros',
      `"${(exp.description || '').replace(/"/g, '""')}"`,
      `"${(exp.detail || '').replace(/"/g, '""')}"`,
      exp.paymentMethod || 'Efectivo',
      exp.personInCharge || 'Boris',
      exp.amount.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Registro_Gastos_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modern-sheet-container">
      {/* ── Header Title & Actions ───────────────────────────────────────────── */}
      <div className="modern-sheet-header">
        <div className="header-title-block">
          <div className="header-badge">
            <span className="badge-glow"></span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            Consola de Finanzas
          </div>
          <h2 className="header-title">Registro Inteligente de Transacciones</h2>
          <p className="header-subtitle">
            Vista ejecutiva de ingresos, gastos y notificaciones bancarias escaneadas por IA.
          </p>
        </div>

        <div className="header-action-buttons">
          <button onClick={onOpenGmailSync} className="glow-gmail-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            ⚡ Escanear Gmail
          </button>

          <button onClick={handleExportCSV} className="modern-export-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* ── Executive Metric KPI Cards ───────────────────────────────────────── */}
      <div className="kpi-cards-grid">
        <div className="kpi-card total-kpi">
          <div className="kpi-label">Total Gastos ({filteredExpenses.length} reg.)</div>
          <div className="kpi-value green-glow">{formatHNL(totalAmountHNL)}</div>
          <div className="kpi-subtext">Período seleccionado</div>
        </div>

        <div className="kpi-card avg-kpi">
          <div className="kpi-label">Promedio por Transacción</div>
          <div className="kpi-value">{formatHNL(avgAmountHNL)}</div>
          <div className="kpi-subtext">Basado en {filteredExpenses.length} movimientos</div>
        </div>

        <div className="kpi-card person-kpi">
          <div className="kpi-label">Desglose por Encargado</div>
          <div className="kpi-person-breakdown">
            <div className="person-row">
              <span className="person-name boris-tag">Boris</span>
              <span className="person-val">{formatHNL(totalsByPerson['Boris'] || 0)}</span>
            </div>
            <div className="person-row">
              <span className="person-name sofia-tag">Sofia</span>
              <span className="person-val">{formatHNL(totalsByPerson['Sofia'] || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar Filters ─────────────────────────────────────────────────── */}
      <div className="modern-toolbar">
        <div className="toolbar-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por concepto, detalle o banco..."
            className="search-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="clear-search-btn">✕</button>
          )}
        </div>

        <div className="toolbar-filters">
          <div className="filter-item">
            <label>Mes:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="toolbar-select"
            >
              <option value="ALL">📅 Todos los Meses</option>
              {months.map((m) => {
                const [yr, mo] = m.split('-');
                const monthNames = [
                  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ];
                const label = `${monthNames[parseInt(mo, 10) - 1]} ${yr}`;
                return (
                  <option key={m} value={m}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="filter-item">
            <label>Categoría:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="toolbar-select"
            >
              <option value="ALL">🏷️ Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Encargado:</label>
            <select
              value={personFilter}
              onChange={(e) => setPersonFilter(e.target.value)}
              className="toolbar-select"
            >
              <option value="ALL">👤 Todos</option>
              <option value="Boris">Boris</option>
              <option value="Sofia">Sofia</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Modern Interactive Data Table ────────────────────────────────────── */}
      <div className="modern-table-card">
        <table className="modern-table">
          <thead>
            <tr>
              <th style={{ width: '45px', textAlign: 'center' }}>#</th>
              <th style={{ width: '110px' }}>Fecha</th>
              <th style={{ width: '160px' }}>Categoría</th>
              <th style={{ minWidth: '220px' }}>Concepto</th>
              <th style={{ minWidth: '200px' }}>Detalle</th>
              <th style={{ width: '180px' }}>Método de Pago</th>
              <th style={{ width: '130px' }}>Encargado</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Monto</th>
              <th style={{ width: '50px', textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-state-cell">
                  <div className="empty-state-content">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                    </svg>
                    <p>No se encontraron transacciones registradas.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp, idx) => {
                const catStyle = getCategoryStyle(exp.category?.name);
                const person = exp.personInCharge || 'Boris';
                const isSofia = person.toLowerCase() === 'sofia';

                return (
                  <tr key={exp.id} className="modern-row">
                    <td className="row-idx">{idx + 1}</td>

                    {/* Fecha */}
                    <td className="date-cell">{formatDateSheet(exp.date)}</td>

                    {/* Categoría Dropdown Pill */}
                    <td className="category-cell">
                      <select
                        value={exp.category?.id || ''}
                        onChange={(e) => onUpdateExpense(exp.id, { categoryId: e.target.value })}
                        className="modern-category-pill"
                        style={{ background: catStyle.bg, color: catStyle.color }}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} style={{ background: '#1e293b', color: '#f8fafc' }}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Concepto Inline Edit */}
                    <td className="concept-cell">
                      <input
                        type="text"
                        defaultValue={exp.description || ''}
                        onBlur={(e) => {
                          if (e.target.value !== exp.description) {
                            onUpdateExpense(exp.id, { description: e.target.value });
                          }
                        }}
                        className="modern-cell-input concept-input"
                        placeholder="Concepto..."
                      />
                    </td>

                    {/* Detalle Inline Edit */}
                    <td className="detail-cell">
                      <input
                        type="text"
                        defaultValue={exp.detail || ''}
                        onBlur={(e) => {
                          if (e.target.value !== exp.detail) {
                            onUpdateExpense(exp.id, { detail: e.target.value });
                          }
                        }}
                        className="modern-cell-input"
                        placeholder="Detalle de compra..."
                      />
                    </td>

                    {/* Método de Pago Dropdown */}
                    <td className="pm-cell">
                      <select
                        value={exp.paymentMethodId || ''}
                        onChange={(e) => {
                          const pm = paymentMethods.find((p) => p.id === e.target.value);
                          onUpdateExpense(exp.id, {
                            paymentMethodId: e.target.value || null,
                            paymentMethod: pm ? pm.label : 'Efectivo',
                          });
                        }}
                        className="modern-pm-select"
                      >
                        <option value="">{exp.paymentMethod || 'Efectivo'}</option>
                        {paymentMethods.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Encargado Pill Dropdown */}
                    <td className="person-cell">
                      <select
                        value={person}
                        onChange={(e) => onUpdateExpense(exp.id, { personInCharge: e.target.value })}
                        className={`modern-person-pill ${isSofia ? 'sofia-pill' : 'boris-pill'}`}
                      >
                        <option value="Boris">Boris</option>
                        <option value="Sofia">Sofia</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </td>

                    {/* Monto */}
                    <td className="amount-cell">{formatHNL(exp.amount)}</td>

                    {/* Delete Action */}
                    <td className="action-cell">
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="modern-delete-btn"
                        title="Eliminar registro"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filteredExpenses.length > 0 && (
            <tfoot>
              <tr className="modern-footer-row">
                <td colSpan={7} className="footer-label">
                  Total General ({filteredExpenses.length} registros):
                </td>
                <td className="footer-amount">{formatHNL(totalAmountHNL)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
