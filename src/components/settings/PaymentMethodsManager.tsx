import React, { useState } from 'react';
import {
  PAYMENT_TYPE_LABELS,
  CARD_NETWORKS,
  TYPE_GRADIENT,
  NETWORK_STYLES,
  buildLabel,
  type PaymentMethod,
  type PaymentMethodType,
  type CardNetwork,
  type CreatePaymentMethodPayload,
  type UpdatePaymentMethodPayload,
} from '../../utils/paymentMethods';
import { formatAmount } from '../../utils/currencies';

// ── Icons ──────────────────────────────────────────────────────────────────────

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

// ── Wallet Card ────────────────────────────────────────────────────────────────

interface WalletCardProps {
  method: PaymentMethod;
  onEdit: (method: PaymentMethod) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const WalletCard: React.FC<WalletCardProps> = ({ method, onEdit, onDelete, onSetDefault }) => {
  const gradient = method.color
    ? `linear-gradient(135deg, ${method.color}cc 0%, ${method.color} 100%)`
    : TYPE_GRADIENT[method.type];

  const networkStyle = method.network ? NETWORK_STYLES[method.network] : null;
  const isCash = method.type === 'CASH';

  return (
    <div className="wallet-card" style={{ background: gradient }}>
      {/* Top row */}
      <div className="wallet-card-top">
        <div className="wallet-card-type">{PAYMENT_TYPE_LABELS[method.type]}</div>
        <div className="wallet-card-actions">
          {!method.isDefault && (
            <button
              className="wallet-action-btn"
              title="Set as default"
              onClick={() => onSetDefault(method.id)}
            >
              <StarIcon />
            </button>
          )}
          {method.isDefault && (
            <span className="wallet-default-badge">
              <StarIcon filled /> Default
            </span>
          )}
          <button
            className="wallet-action-btn"
            title="Editar método de pago"
            onClick={() => onEdit(method)}
          >
            <EditIcon />
          </button>
          {!isCash && (
            <button
              className="wallet-action-btn wallet-action-delete"
              title="Archive method"
              onClick={() => onDelete(method.id)}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>

      {/* Card number row */}
      {method.lastFour && (
        <div className="wallet-card-number">
          <span>····</span><span>····</span><span>····</span>
          <span className="wallet-last-four">{method.lastFour}</span>
        </div>
      )}
      {method.type === 'BANK_ACCOUNT' && !method.lastFour && (
        <div className="wallet-card-number" style={{ letterSpacing: 2 }}>
          ···· ···· ····
        </div>
      )}
      {isCash && (
        <div className="wallet-cash-icon">💵</div>
      )}

      {/* Bottom row */}
      <div className="wallet-card-bottom">
        <div>
          <div className="wallet-card-label">{method.label}</div>
          {method.bank && <div className="wallet-card-bank">{method.bank}</div>}
          {method.creditLimit != null && (
            <div className="wallet-card-bank">
              Límite: {formatAmount(method.creditLimit, 'USD')}
              {method.cutoffDay ? ` · Corte día ${method.cutoffDay}` : ''}
            </div>
          )}
        </div>
        {networkStyle && (
          <div className="wallet-network-badge" style={{ background: networkStyle.color }}>
            {networkStyle.icon}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Payment Method Form (Unified Add/Edit) ──────────────────────────────────────

interface PaymentMethodFormProps {
  onSubmit: (payload: any) => Promise<void>;
  initialData?: PaymentMethod | null;
  onCancel: () => void;
}

const FORM_DEFAULTS = {
  type: 'CREDIT_CARD' as PaymentMethodType,
  label: '',
  bank: '',
  network: 'VISA' as CardNetwork,
  lastFour: '',
  creditLimit: '',
  cutoffDay: '',
  color: '#6610f2',
  isDefault: false,
};

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(FORM_DEFAULTS);

  React.useEffect(() => {
    if (initialData) {
      setForm({
        type: initialData.type,
        label: initialData.label || '',
        bank: initialData.bank || '',
        network: initialData.network || 'VISA',
        lastFour: initialData.lastFour || '',
        creditLimit: initialData.creditLimit != null ? String(initialData.creditLimit) : '',
        cutoffDay: initialData.cutoffDay != null ? String(initialData.cutoffDay) : '',
        color: initialData.color || '#6610f2',
        isDefault: initialData.isDefault,
      });
    } else {
      setForm(FORM_DEFAULTS);
    }
  }, [initialData]);

  const set = (field: keyof typeof FORM_DEFAULTS, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const needsCard = form.type === 'CREDIT_CARD' || form.type === 'DEBIT_CARD';
  const needsCredit = form.type === 'CREDIT_CARD';
  const isCash = form.type === 'CASH';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsCard && form.lastFour && !/^\d{4}$/.test(form.lastFour)) {
      alert('Los últimos 4 dígitos deben ser exactamente 4 números.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        label: form.label.trim() || undefined,
        bank: form.bank.trim() || undefined,
        color: form.color,
        isDefault: form.isDefault,
      };

      if (!initialData) {
        payload.type = form.type;
      }

      if (needsCard) {
        payload.network = form.network;
        payload.lastFour = form.lastFour || undefined;
      } else {
        payload.network = undefined;
        payload.lastFour = undefined;
      }

      if (needsCredit) {
        payload.creditLimit = form.creditLimit ? parseFloat(form.creditLimit) : undefined;
        payload.cutoffDay = form.cutoffDay ? parseInt(form.cutoffDay) : undefined;
      } else {
        payload.creditLimit = undefined;
        payload.cutoffDay = undefined;
      }

      await onSubmit(payload);
    } catch (err: any) {
      alert(err.message || 'Error al guardar el método de pago.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Type */}
      <div className="form-group">
        <label htmlFor="pm-type">Tipo</label>
        <select
          id="pm-type"
          className="form-input"
          value={form.type}
          onChange={(e) => set('type', e.target.value as PaymentMethodType)}
          disabled={!!initialData || isCash}
        >
          {Object.entries(PAYMENT_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v} disabled={v === 'CASH' && !initialData}>{l}</option>
          ))}
        </select>
      </div>

      {/* Label */}
      <div className="form-group">
        <label htmlFor="pm-label">Nombre / Etiqueta Personalizada (opcional)</label>
        <input
          id="pm-label"
          className="form-input"
          placeholder="e.g. Tarjeta Principal, BAC Negocios (vacío para auto-generar)"
          value={form.label}
          onChange={(e) => set('label', e.target.value)}
        />
      </div>

      {/* Bank (only if not CASH) */}
      {!isCash && (
        <div className="form-group">
          <label htmlFor="pm-bank">Banco</label>
          <input
            id="pm-bank"
            className="form-input"
            placeholder="e.g. BBVA, BAC, Banpais"
            value={form.bank}
            onChange={(e) => set('bank', e.target.value)}
          />
        </div>
      )}

      {/* Card-specific fields */}
      {needsCard && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="pm-network">Red</label>
            <select
              id="pm-network"
              className="form-input"
              value={form.network}
              onChange={(e) => set('network', e.target.value as CardNetwork)}
            >
              {CARD_NETWORKS.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="pm-last4">Últimos 4 dígitos</label>
            <input
              id="pm-last4"
              className="form-input"
              placeholder="1234"
              maxLength={4}
              value={form.lastFour}
              onChange={(e) => set('lastFour', e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>
      )}

      {/* Credit-specific fields */}
      {needsCredit && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="pm-limit">Límite de crédito</label>
            <input
              id="pm-limit"
              type="number"
              step="0.01"
              className="form-input"
              placeholder="5000.00"
              value={form.creditLimit}
              onChange={(e) => set('creditLimit', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="pm-cutoff">Día de corte</label>
            <input
              id="pm-cutoff"
              type="number"
              min={1}
              max={31}
              className="form-input"
              placeholder="15"
              value={form.cutoffDay}
              onChange={(e) => set('cutoffDay', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Color + preview */}
      <div className="pm-color-row">
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="pm-color">Color de tarjeta</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              id="pm-color"
              type="color"
              className="pm-color-input"
              value={form.color}
              onChange={(e) => set('color', e.target.value)}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Preview: <strong style={{ color: form.color }}>
                {buildLabel(form.type, form.network, form.lastFour, form.bank, form.label)}
              </strong>
            </span>
          </div>
        </div>
        {!initialData && (
          <label className="pm-default-toggle" style={{ marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set('isDefault', e.target.checked)}
            />
            <span>Predeterminado</span>
          </label>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button type="submit" className="submit-btn" disabled={isSaving} style={{ flex: 1 }}>
          {isSaving ? 'Guardando...' : initialData ? 'Guardar Cambios' : 'Agregar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="submit-btn"
          style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.08)' }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

interface PaymentMethodsManagerProps {
  paymentMethods: PaymentMethod[];
  onCreate: (payload: CreatePaymentMethodPayload) => Promise<PaymentMethod>;
  onUpdate: (id: string, payload: UpdatePaymentMethodPayload) => Promise<PaymentMethod>;
  onDelete: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
}

export const PaymentMethodsManager: React.FC<PaymentMethodsManagerProps> = ({
  paymentMethods,
  onCreate,
  onUpdate,
  onDelete,
  onSetDefault,
}) => {
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Archivar este método de pago? Los gastos existentes seguirán mostrándolo.')) return;
    try {
      await onDelete(id);
      if (editingMethod?.id === id) {
        setEditingMethod(null);
      }
    } catch (err: any) {
      alert(err.message || 'No se pudo archivar el método de pago.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await onSetDefault(id);
    } catch (err: any) {
      alert(err.message || 'Error al establecer como predeterminado.');
    }
  };

  return (
    <section className="card-panel">
      <h3 className="panel-title">Métodos de Pago</h3>

      <div className="wallet-grid">
        {paymentMethods.map((m) => (
          <WalletCard
            key={m.id}
            method={m}
            onEdit={(method) => {
              setEditingMethod(method);
              setIsAdding(false);
              document.getElementById('pm-form-anchor')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
          />
        ))}
      </div>

      <div id="pm-form-anchor" style={{ marginBottom: isAdding || editingMethod ? '12px' : '0px' }} />

      {editingMethod ? (
        <div className="add-pm-form-container">
          <h4 className="add-pm-form-title">Editar método de pago: {editingMethod.label}</h4>
          <PaymentMethodForm
            initialData={editingMethod}
            onSubmit={async (payload) => {
              await onUpdate(editingMethod.id, payload);
              setEditingMethod(null);
            }}
            onCancel={() => setEditingMethod(null)}
          />
        </div>
      ) : isAdding ? (
        <div className="add-pm-form-container">
          <h4 className="add-pm-form-title">Nuevo método de pago</h4>
          <PaymentMethodForm
            onSubmit={async (payload) => {
              await onCreate(payload as any);
              setIsAdding(false);
            }}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      ) : (
        <button className="add-payment-method-btn" onClick={() => setIsAdding(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Agregar método de pago
        </button>
      )}
    </section>
  );
};
