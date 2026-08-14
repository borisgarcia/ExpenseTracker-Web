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

  // Category Color Map matching the user's reference Google Sheet
  const getCategoryStyle = (catName: string = 'Otros') => {
    const name = catName.toLowerCase();
    if (name.includes('transporte')) {
      return { bg: '#613214', color: '#fef3c7' }; // Brown
    }
    if (name.includes('servicio')) {
      return { bg: '#4b5563', color: '#f9fafb' }; // Gray
    }
    if (name.includes('casa')) {
      return { bg: '#e07a5f', color: '#ffffff' }; // Peach / Salmon
    }
    if (name.includes('supermercado') || name.includes('super')) {
      return { bg: '#9333ea', color: '#ffffff' }; // Purple
    }
    if (name.includes('mascota')) {
      return { bg: '#0d9488', color: '#ffffff' }; // Teal
    }
    if (name.includes('bienes')) {
      return { bg: '#581c87', color: '#ffffff' }; // Dark Purple
    }
    return { bg: '#1d4ed8', color: '#ffffff' }; // Blue (Otros)
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

      return matchesMonth && matchesPerson;
    });
  }, [expenses, selectedMonth, personFilter]);

  // Calculate totals
  const totalAmountHNL = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => {
      const val = exp.amount || 0;
      return sum + val;
    }, 0);
  }, [filteredExpenses]);

  const formatHNL = (amount: number) => {
    return `L${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateSheet = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
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
    link.setAttribute('download', `Expense_Tracker_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="sheet-container">
      {/* ── Top Google Sheets Bar ───────────────────────────────────────────── */}
      <div className="sheet-header-bar">
        <div className="sheet-title-group">
          <div className="sheet-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#107c41">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
              <path d="M7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z" fill="#ffffff" />
            </svg>
          </div>
          <div className="sheet-month-selector">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="sheet-select-btn"
            >
              <option value="ALL">Ver Todos los Meses</option>
              {months.map((m) => {
                const [yr, mo] = m.split('-');
                const monthNames = [
                  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ];
                const label = `${monthNames[parseInt(mo, 10) - 1]} ${yr}_${parseInt(mo, 10)}`;
                return (
                  <option key={m} value={m}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="sheet-actions">
          <div className="sheet-person-filter">
            <label style={{ fontSize: '0.8rem', color: '#9ca3af', marginRight: '6px' }}>Encargado:</label>
            <select
              value={personFilter}
              onChange={(e) => setPersonFilter(e.target.value)}
              className="sheet-filter-select"
            >
              <option value="ALL">Todos</option>
              <option value="Boris">Boris</option>
              <option value="Sofia">Sofia</option>
            </select>
          </div>

          <button onClick={onOpenGmailSync} className="gmail-sync-header-btn" title="Revisar correos de Gmail">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            Revisar Gmail
          </button>

          <button onClick={handleExportCSV} className="export-csv-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar Hoja
          </button>
        </div>
      </div>

      {/* ── Google Sheets Table ────────────────────────────────────────────── */}
      <div className="sheet-table-wrapper">
        <table className="google-sheet-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center', background: '#1b4332' }}>#</th>
              <th style={{ width: '110px' }}>
                <div className="th-content">
                  <span>Fecha</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
              </th>
              <th style={{ width: '160px' }}>
                <div className="th-content">
                  <span>Categoría</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
              </th>
              <th style={{ minWidth: '220px' }}>
                <div className="th-content">
                  <span>Concepto</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
              </th>
              <th style={{ minWidth: '180px' }}>
                <div className="th-content">
                  <span>Detalle</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
              </th>
              <th style={{ width: '180px' }}>
                <div className="th-content">
                  <span>Método de Pago</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
              </th>
              <th style={{ width: '140px' }}>
                <div className="th-content">
                  <span>Encargado</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
              </th>
              <th style={{ width: '140px', textAlign: 'right' }}>
                <div className="th-content" style={{ justifyContent: 'flex-end' }}>
                  <span>Monto</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
              </th>
              <th style={{ width: '50px', textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  No hay transacciones registradas en este período.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp, idx) => {
                const catStyle = getCategoryStyle(exp.category?.name);
                const person = exp.personInCharge || 'Boris';
                const isSofia = person.toLowerCase() === 'sofia';

                return (
                  <tr key={exp.id} className="sheet-row">
                    <td className="row-number">{idx + 8}</td>

                    {/* Fecha */}
                    <td className="sheet-cell">{formatDateSheet(exp.date)}</td>

                    {/* Categoría Dropdown Badge */}
                    <td className="sheet-cell">
                      <select
                        value={exp.category?.id || ''}
                        onChange={(e) => onUpdateExpense(exp.id, { categoryId: e.target.value })}
                        className="category-pill-select"
                        style={{ backgroundColor: catStyle.bg, color: catStyle.color }}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} style={{ background: '#1f2937', color: '#ffffff' }}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Concepto */}
                    <td className="sheet-cell concept-cell">
                      <input
                        type="text"
                        defaultValue={exp.description || ''}
                        onBlur={(e) => {
                          if (e.target.value !== exp.description) {
                            onUpdateExpense(exp.id, { description: e.target.value });
                          }
                        }}
                        className="cell-input bold-text"
                        placeholder="Agregar concepto..."
                      />
                    </td>

                    {/* Detalle */}
                    <td className="sheet-cell">
                      <input
                        type="text"
                        defaultValue={exp.detail || ''}
                        onBlur={(e) => {
                          if (e.target.value !== exp.detail) {
                            onUpdateExpense(exp.id, { detail: e.target.value });
                          }
                        }}
                        className="cell-input"
                        placeholder="Detalle o notas..."
                      />
                    </td>

                    {/* Método de Pago */}
                    <td className="sheet-cell">
                      <select
                        value={exp.paymentMethodId || ''}
                        onChange={(e) => {
                          const pm = paymentMethods.find((p) => p.id === e.target.value);
                          onUpdateExpense(exp.id, {
                            paymentMethodId: e.target.value || null,
                            paymentMethod: pm ? pm.label : 'Efectivo',
                          });
                        }}
                        className="payment-select"
                      >
                        <option value="">{exp.paymentMethod || 'Efectivo'}</option>
                        {paymentMethods.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Encargado */}
                    <td className="sheet-cell">
                      <select
                        value={person}
                        onChange={(e) => onUpdateExpense(exp.id, { personInCharge: e.target.value })}
                        className={`person-pill-select ${isSofia ? 'person-sofia' : 'person-boris'}`}
                      >
                        <option value="Boris">Boris</option>
                        <option value="Sofia">Sofia</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </td>

                    {/* Monto */}
                    <td className="sheet-cell amount-cell">{formatHNL(exp.amount)}</td>

                    {/* Quick Delete */}
                    <td className="sheet-cell action-cell">
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="sheet-delete-btn"
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
              <tr className="sheet-footer-row">
                <td colSpan={7} style={{ textAlign: 'right', fontWeight: 600, paddingRight: '16px' }}>
                  Total General:
                </td>
                <td className="amount-cell total-amount">{formatHNL(totalAmountHNL)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
