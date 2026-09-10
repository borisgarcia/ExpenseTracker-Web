import React, { useState, useMemo } from 'react';
import type { Expense, Category } from '../../hooks/useDashboard';
import './GoogleSheetView.css';

interface GoogleSheetViewProps {
  expenses: Expense[];
  categories: Category[];
  paymentMethods: any[];
  onUpdateExpense: (id: string, updated: any) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteAllExpenses?: () => Promise<void> | void;
  onOpenGmailSync: () => void;
  userName?: string;
}

export const GoogleSheetView: React.FC<GoogleSheetViewProps> = ({
  expenses,
  categories,
  paymentMethods,
  onUpdateExpense,
  onDeleteExpense,
  onDeleteAllExpenses,
  onOpenGmailSync,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [personFilter, setPersonFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showExtraColumns, setShowExtraColumns] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState<boolean>(false);
  const [isDeletingAll, setIsDeletingAll] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Category Color Map with modern vibrant pill styles
  const getCategoryStyle = (catName: string = 'Otros') => {
    const name = catName.toLowerCase();
    if (name.includes('transporte')) {
      return { bg: 'rgba(217, 119, 6, 0.22)', color: '#fbbf24', border: '1px solid rgba(217, 119, 6, 0.45)' };
    }
    if (name.includes('servicio')) {
      return { bg: 'rgba(75, 85, 99, 0.25)', color: '#9ca3af', border: '1px solid rgba(75, 85, 99, 0.45)' };
    }
    if (name.includes('casa')) {
      return { bg: 'rgba(249, 115, 22, 0.22)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.45)' };
    }
    if (name.includes('supermercado') || name.includes('super')) {
      return { bg: 'rgba(168, 85, 247, 0.22)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.45)' };
    }
    if (name.includes('mascota')) {
      return { bg: 'rgba(20, 184, 166, 0.22)', color: '#2dd4bf', border: '1px solid rgba(20, 184, 166, 0.45)' };
    }
    if (name.includes('bienes')) {
      return { bg: 'rgba(99, 102, 241, 0.22)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.45)' };
    }
    return { bg: 'rgba(59, 130, 246, 0.22)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.45)' };
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

  // Totals calculations
  const totalAmountHNL = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [filteredExpenses]);

  const totalsByPerson = useMemo(() => {
    const res: Record<string, number> = { Boris: 0, Sofia: 0 };
    filteredExpenses.forEach((exp) => {
      const p = exp.personInCharge || 'Boris';
      res[p] = (res[p] || 0) + (exp.amount || 0);
    });
    return res;
  }, [filteredExpenses]);

  // Format currency helpers
  const formatHNL = (val: number) => {
    return `L ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateSheet = (dStr: Date | string) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // CSV Export Handler
  const handleExportCSV = async () => {
    if (filteredExpenses.length === 0) return;
    setIsExporting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const headers = ['Fecha', 'Categoría', 'Concepto', 'Detalle', 'Método de Pago', 'Encargado', 'Monto HNL'];
      const rows = filteredExpenses.map((exp) => [
        formatDateSheet(exp.date),
        `"${(exp.category?.name || 'Otros').replace(/"/g, '""')}"`,
        `"${(exp.description || '').replace(/"/g, '""')}"`,
        `"${(exp.detail || '').replace(/"/g, '""')}"`,
        `"${(exp.paymentMethod || 'Efectivo').replace(/"/g, '""')}"`,
        `"${(exp.personInCharge || 'Boris').replace(/"/g, '""')}"`,
        exp.amount.toFixed(2),
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `gastos_export_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmDeleteAll = async () => {
    if (!onDeleteAllExpenses) return;
    setIsDeletingAll(true);
    try {
      await onDeleteAllExpenses();
      setIsDeleteAllModalOpen(false);
    } catch (err) {
      console.error('Error deleting all expenses:', err);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const colSpanCount = showExtraColumns ? 9 : 7;

  return (
    <div className="sheet-view-container">
      {/* ── Action Header Bar ─────────────────────────────────────────── */}
      <div className="sheet-header-actions">
        <div className="actions-left">
          <button onClick={onOpenGmailSync} className="gmail-import-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ea4335">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            Importar desde Gmail
          </button>

          {onDeleteAllExpenses && (
            <button
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="delete-all-btn"
              title="Eliminar todos los registros de la consola"
            >
              🗑️ Eliminar Todo
            </button>
          )}
        </div>

        <div className="actions-right">
          <button
            onClick={() => setShowExtraColumns(!showExtraColumns)}
            className="modern-export-btn density-toggle-btn"
            title="Mostrar u ocultar columnas avanzadas (Detalle y Encargado)"
          >
            {showExtraColumns ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                Ver Vista Compacta
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                </svg>
                Mostrar Columnas Avanzadas
              </>
            )}
          </button>

          <button onClick={handleExportCSV} disabled={isExporting} className="modern-export-btn">
            {isExporting ? (
              <>
                <span className="btn-spinner"></span>
                Exportando CSV...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exportar a Excel / CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Executive KPI Summary Grid ─────────────────────────────────── */}
      <div className="kpi-cards-grid">
        <div className="kpi-card total-card">
          <div className="kpi-icon-wrapper">💰</div>
          <div className="kpi-content">
            <span className="kpi-title">Total de Gastos Filtrados</span>
            <span className="kpi-value">{formatHNL(totalAmountHNL)}</span>
            <span className="kpi-subtitle">{filteredExpenses.length} transacciones en vista</span>
          </div>
        </div>

        <div className="kpi-card breakdown-card">
          <div className="kpi-icon-wrapper">👥</div>
          <div className="kpi-content">
            <span className="kpi-title">Desglose por Encargado</span>
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

      {/* ── Toolbar Filters & Search ───────────────────────────────────────── */}
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
            placeholder="Buscar por concepto, detalle o comercio..."
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

      {/* ── High-Contrast Modern Data Grid Table (With Resizable Headers) ──── */}
      <div className="modern-table-card">
        <div className="table-responsive-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th className="th-idx">#</th>
                <th className="th-date resizable-th">FECHA</th>
                <th className="th-category resizable-th">CATEGORÍA</th>
                <th className="th-concept resizable-th">CONCEPTO / COMERCIO</th>
                {showExtraColumns && <th className="th-detail resizable-th">DETALLE</th>}
                <th className="th-pm resizable-th">MÉTODOS DE PAGO</th>
                {showExtraColumns && <th className="th-person resizable-th">ENCARGADO</th>}
                <th className="th-amount resizable-th">MONTO</th>
                <th className="th-action">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={colSpanCount} className="empty-state-cell">
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
                          style={{ background: catStyle.bg, color: catStyle.color, border: catStyle.border }}
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

                      {/* Detalle Inline Edit (Only when extra columns active) */}
                      {showExtraColumns && (
                        <td className="detail-cell">
                          <input
                            type="text"
                            defaultValue={exp.detail || ''}
                            onBlur={(e) => {
                              if (e.target.value !== exp.detail) {
                                onUpdateExpense(exp.id, { detail: e.target.value });
                              }
                            }}
                            className="modern-cell-input detail-input"
                            placeholder="Detalle opcional..."
                          />
                        </td>
                      )}

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

                      {/* Encargado Pill Dropdown (Only when extra columns active) */}
                      {showExtraColumns && (
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
                      )}

                      {/* Monto */}
                      <td className="amount-cell">{formatHNL(exp.amount)}</td>

                      {/* Action Cell (View Details & Delete) */}
                      <td className="action-cell">
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => setSelectedExpense(exp)}
                            className="modern-view-btn"
                            title="Ver detalle completo de esta transacción"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="modern-delete-btn"
                            title="Eliminar registro"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot>
                <tr className="modern-footer-row">
                  <td colSpan={colSpanCount - 2} className="footer-label">
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

      {/* ── Transaction Details Glassmorphism Modal ────────────────────────── */}
      {selectedExpense && (
        <div className="modal-backdrop" onClick={() => setSelectedExpense(null)}>
          <div className="expense-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <div className="detail-title-group">
                <span className="detail-badge">Detalle de Transacción</span>
                <h3>{selectedExpense.description || 'Sin concepto'}</h3>
              </div>
              <button onClick={() => setSelectedExpense(null)} className="modal-close-btn">
                ✕
              </button>
            </div>

            <div className="detail-modal-body">
              <div className="detail-amount-hero">
                <span className="hero-label">Monto de la Transacción:</span>
                <span className="hero-amount">{formatHNL(selectedExpense.amount)}</span>
              </div>

              <div className="detail-grid">
                <div className="detail-field">
                  <label>Fecha de Transacción (CST):</label>
                  <input
                    type="date"
                    defaultValue={selectedExpense.date ? new Date(selectedExpense.date).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      onUpdateExpense(selectedExpense.id, { date: e.target.value });
                      setSelectedExpense({ ...selectedExpense, date: e.target.value });
                    }}
                    className="detail-input"
                  />
                </div>

                <div className="detail-field">
                  <label>Categoría:</label>
                  <select
                    value={selectedExpense.category?.id || ''}
                    onChange={(e) => {
                      onUpdateExpense(selectedExpense.id, { categoryId: e.target.value });
                      const cat = categories.find((c) => c.id === e.target.value);
                      if (cat) setSelectedExpense({ ...selectedExpense, category: cat });
                    }}
                    className="detail-select"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="detail-field">
                  <label>Método de Pago:</label>
                  <select
                    value={selectedExpense.paymentMethodId || ''}
                    onChange={(e) => {
                      const pm = paymentMethods.find((p) => p.id === e.target.value);
                      onUpdateExpense(selectedExpense.id, {
                        paymentMethodId: e.target.value || null,
                        paymentMethod: pm ? pm.label : 'Efectivo',
                      });
                      setSelectedExpense({
                        ...selectedExpense,
                        paymentMethod: pm ? pm.label : 'Efectivo',
                        paymentMethodId: e.target.value || null,
                      });
                    }}
                    className="detail-select"
                  >
                    <option value="">Efectivo</option>
                    {paymentMethods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="detail-field">
                  <label>Encargado / Persona:</label>
                  <select
                    value={selectedExpense.personInCharge || 'Boris'}
                    onChange={(e) => {
                      onUpdateExpense(selectedExpense.id, { personInCharge: e.target.value });
                      setSelectedExpense({ ...selectedExpense, personInCharge: e.target.value });
                    }}
                    className="detail-select"
                  >
                    <option value="Boris">Boris</option>
                    <option value="Sofia">Sofia</option>
                  </select>
                </div>
              </div>

              <div className="detail-field full-width" style={{ marginTop: '16px' }}>
                <label>Detalle / Notas Completas:</label>
                <textarea
                  rows={3}
                  defaultValue={selectedExpense.detail || ''}
                  onBlur={(e) => {
                    onUpdateExpense(selectedExpense.id, { detail: e.target.value });
                    setSelectedExpense({ ...selectedExpense, detail: e.target.value });
                  }}
                  placeholder="Escribe notas adicionales o detalles de la compra..."
                  className="detail-textarea"
                />
              </div>

              <div className="detail-footer-info">
                <span>📌 Origen: {selectedExpense.source === 'GMAIL' ? '📧 Gmail Live' : '✏️ Manual'}</span>
                <span>ID: {selectedExpense.id.slice(0, 8)}...</span>
              </div>
            </div>

            <div className="detail-modal-actions">
              <button
                onClick={() => {
                  onDeleteExpense(selectedExpense.id);
                  setSelectedExpense(null);
                }}
                className="detail-delete-btn"
              >
                🗑️ Eliminar Transacción
              </button>
              <button onClick={() => setSelectedExpense(null)} className="detail-close-btn">
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal for Delete All with Spinner Loading ──────────── */}
      {isDeleteAllModalOpen && (
        <div className="modal-backdrop" onClick={() => !isDeletingAll && setIsDeleteAllModalOpen(false)}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            {isDeletingAll ? (
              <div className="deleting-loading-state">
                <div className="deleting-spinner"></div>
                <h3 className="confirm-title" style={{ marginTop: '16px' }}>Eliminando Transacciones...</h3>
                <p className="confirm-desc">
                  Por favor espera un momento mientras eliminamos los registros y reajustamos los saldos de tus tarjetas.
                </p>
              </div>
            ) : (
              <>
                <div className="confirm-icon-wrapper">⚠️</div>
                <h3 className="confirm-title">¿Eliminar Todas las Transacciones?</h3>
                <p className="confirm-desc">
                  Esta acción eliminará de forma permanente los <strong>{expenses.length} registros de gastos</strong> en tu cuenta y reajustará el saldo de tus tarjetas y cuentas.
                  <br /><br />
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>Esta acción no se puede deshacer.</span>
                </p>
                <div className="confirm-actions">
                  <button onClick={() => setIsDeleteAllModalOpen(false)} className="confirm-cancel-btn">
                    Cancelar
                  </button>
                  <button onClick={handleConfirmDeleteAll} className="confirm-delete-btn">
                    Sí, Eliminar Todo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
