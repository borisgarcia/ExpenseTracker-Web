import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { api } from '../../utils/api';
import './GmailSyncModal.css';

interface GmailSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userName?: string;
}

export const GmailSyncModal: React.FC<GmailSyncModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userName = 'Boris',
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'paste'>('scan');
  const [rawText, setRawText] = useState('');
  const [personInCharge, setPersonInCharge] = useState(userName || 'Boris');
  const [isScanning, setIsScanning] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(
    localStorage.getItem('google_access_token')
  );

  const handleCloseModal = () => {
    setParsedTransactions([]);
    setStatusMsg('');
    setRawText('');
    onClose();
  };

  const handleTabChange = (tab: 'scan' | 'paste') => {
    setActiveTab(tab);
    setParsedTransactions([]);
    setStatusMsg('');
  };

  // Real Google OAuth Login for Gmail Readonly scope
  const loginWithGmailScope = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    onSuccess: (tokenResponse) => {
      if (tokenResponse.access_token) {
        localStorage.setItem('google_access_token', tokenResponse.access_token);
        setGoogleAccessToken(tokenResponse.access_token);
        setStatusMsg('¡Cuenta de Gmail conectada! Escaneando tus correos reales...');
        performScan(tokenResponse.access_token);
      }
    },
    onError: (error) => {
      console.error('Gmail OAuth error:', error);
      setStatusMsg('No se pudo conectar a Gmail.');
    },
  });

  if (!isOpen) return null;

  const performScan = async (token?: string) => {
    setParsedTransactions([]);
    const activeToken = token || googleAccessToken || localStorage.getItem('google_access_token') || undefined;

    if (!activeToken) {
      setStatusMsg('ℹ️ Para escanear tus correos reales, haz clic en el botón azul "🔑 Conectar mi Gmail Real".');
      return;
    }

    setIsScanning(true);
    setStatusMsg('Buscando notificaciones bancarias reales en tu bandeja de entrada de Gmail...');

    try {
      const res = await api.post('/gmail/sync-live', {
        defaultUser: personInCharge,
        googleAccessToken: activeToken,
      });

      if (res && res.transactions) {
        const adjusted = res.transactions.map((tx: any) => ({
          ...tx,
          personInCharge,
          detail: tx.detail || '',
        }));
        setParsedTransactions(adjusted);
        if (adjusted.length > 0) {
          setStatusMsg(`¡Escaneo real completado! Se encontraron ${adjusted.length} transacciones en tu Gmail.`);
        } else {
          setStatusMsg('No se encontraron notificaciones bancarias nuevas en tu cuenta de Gmail.');
        }
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      const msg = err?.message || err?.toString() || 'Por favor intenta de nuevo.';
      setStatusMsg(`⚠️ Error al escanear Gmail: ${msg}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleParseText = async () => {
    if (!rawText.trim()) return;
    setParsedTransactions([]);
    setIsScanning(true);
    setStatusMsg('Analizando texto del correo con IA (Gemini)...');
    try {
      const res = await api.post('/gmail/parse-text', {
        text: rawText,
        defaultUser: personInCharge,
      });
      if (res && res.transactions) {
        const adjusted = res.transactions.map((tx: any) => ({
          ...tx,
          detail: tx.detail || '',
        }));
        setParsedTransactions(adjusted);
        setStatusMsg(`Se extrajeron y clasificaron ${adjusted.length} transacciones del texto.`);
      }
    } catch (err: any) {
      console.error('Parse error:', err);
      setStatusMsg('Error al analizar el texto.');
    } finally {
      setIsScanning(false);
    }
  };

  const updateTxField = (idx: number, field: string, value: any) => {
    setParsedTransactions((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleImportAll = async () => {
    if (parsedTransactions.length === 0) return;
    setImporting(true);
    try {
      const res = await api.post('/gmail/import', {
        transactions: parsedTransactions,
      });
      alert(`¡Éxito! Se guardaron ${res.importedCount} transacciones en tu consola de gastos.`);
      onSuccess();
      handleCloseModal();
    } catch (err: any) {
      console.error('Import error:', err);
      alert('Error al guardar transacciones en la base de datos.');
    } finally {
      setImporting(false);
    }
  };

  const removeItem = (idx: number) => {
    setParsedTransactions((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="modal-backdrop" onClick={handleCloseModal}>
      <div className="gmail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gmail-modal-header">
          <div className="header-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#ea4335" style={{ marginRight: '8px' }}>
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <h3>Importador de Transacciones de Gmail</h3>
          </div>
          <button onClick={handleCloseModal} className="modal-close-btn">
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="gmail-tabs">
          <button
            className={`gmail-tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => handleTabChange('scan')}
          >
            Escaneo de Gmail
          </button>
          <button
            className={`gmail-tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
            onClick={() => handleTabChange('paste')}
          >
            Pegar Texto de Correo
          </button>
        </div>

        <div className="gmail-modal-body">
          {/* Person Selector */}
          <div className="modal-input-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>
              Persona que realiza las transacciones (Encargado por defecto):
            </label>
            <select
              value={personInCharge}
              onChange={(e) => setPersonInCharge(e.target.value)}
              className="person-select-input"
            >
              <option value="Boris">Boris</option>
              <option value="Sofia">Sofia</option>
            </select>
          </div>

          {activeTab === 'scan' ? (
            <div className="scan-section">
              <p className="scan-desc">
                Escanea tu bandeja de entrada en búsqueda de notificaciones bancarias reales de BAC Credomatic, Ficohsa, Banpaís, Banco Atlántida, PayPal, etc.
              </p>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => loginWithGmailScope()}
                  className="start-scan-btn"
                  style={{ background: 'linear-gradient(135deg, #4285f4, #1a73e8)', flex: 1 }}
                >
                  🔑 Conectar mi Gmail Real
                </button>

                <button
                  onClick={() => performScan()}
                  disabled={isScanning}
                  className="start-scan-btn"
                  style={{ flex: 1 }}
                >
                  {isScanning ? 'Escaneando...' : '🔍 Escanear Correos'}
                </button>
              </div>
            </div>
          ) : (
            <div className="paste-section">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Pega aquí el texto de tu correo de banco real (ejemplo: Notificación BAC: Compra aprobada por L 2,450.00 en ESTACION SERC TEXAC...)"
                rows={5}
                className="raw-email-textarea"
              />
              <button
                onClick={handleParseText}
                disabled={isScanning || !rawText.trim()}
                className="start-scan-btn"
                style={{ marginTop: '10px' }}
              >
                {isScanning ? 'Analizando...' : '⚡ Analizar Correo con IA'}
              </button>
            </div>
          )}

          {statusMsg && <div className="status-banner">{statusMsg}</div>}

          {/* Results Preview List with Editable Fields */}
          {parsedTransactions.length > 0 && (
            <div className="parsed-results-list">
              <h4 style={{ margin: '14px 0 8px 0', color: '#f3f4f6' }}>
                Transacciones Extraídas ({parsedTransactions.length}) - Puedes editar cualquier campo antes de guardar:
              </h4>
              <div className="results-scroll">
                {parsedTransactions.map((tx, idx) => (
                  <div key={idx} className="parsed-item-card-editable">
                    <div className="card-row-top">
                      <div className="input-field-group flex-2">
                        <label className="field-label">Comercio / Concepto:</label>
                        <input
                          type="text"
                          value={tx.concept}
                          onChange={(e) => updateTxField(idx, 'concept', e.target.value)}
                          className="editable-input concept-input-field"
                          placeholder="Comercio..."
                        />
                      </div>

                      <div className="input-field-group flex-1">
                        <label className="field-label">Monto (HNL):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={tx.amount}
                          onChange={(e) => updateTxField(idx, 'amount', parseFloat(e.target.value) || 0)}
                          className="editable-input amount-input-field"
                        />
                      </div>

                      <button onClick={() => removeItem(idx)} className="item-remove-btn" title="Quitar de la lista">
                        ✕
                      </button>
                    </div>

                    <div className="card-row-middle">
                      <div className="input-field-group full-width">
                        <label className="field-label">Detalle / Notas (Opcional):</label>
                        <input
                          type="text"
                          value={tx.detail || ''}
                          onChange={(e) => updateTxField(idx, 'detail', e.target.value)}
                          className="editable-input detail-input-field"
                          placeholder="Escribe un detalle opcional para esta transacción..."
                        />
                      </div>
                    </div>

                    <div className="card-row-bottom">
                      <div className="input-field-group">
                        <label className="field-label">Categoría:</label>
                        <input
                          type="text"
                          value={tx.categoryName}
                          onChange={(e) => updateTxField(idx, 'categoryName', e.target.value)}
                          className="editable-input pill-input"
                        />
                      </div>

                      <div className="input-field-group">
                        <label className="field-label">Método de Pago:</label>
                        <input
                          type="text"
                          value={tx.paymentMethodName}
                          onChange={(e) => updateTxField(idx, 'paymentMethodName', e.target.value)}
                          className="editable-input pm-input"
                        />
                      </div>

                      <div className="input-field-group">
                        <label className="field-label">Encargado:</label>
                        <select
                          value={tx.personInCharge}
                          onChange={(e) => updateTxField(idx, 'personInCharge', e.target.value)}
                          className="editable-select"
                        >
                          <option value="Boris">Boris</option>
                          <option value="Sofia">Sofia</option>
                        </select>
                      </div>

                      <div className="input-field-group">
                        <label className="field-label">Fecha (CST):</label>
                        <input
                          type="date"
                          value={tx.date}
                          onChange={(e) => updateTxField(idx, 'date', e.target.value)}
                          className="editable-input date-input"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="import-action-bar">
                <button onClick={handleImportAll} disabled={importing} className="confirm-import-btn">
                  {importing ? 'Guardando...' : `📥 Guardar ${parsedTransactions.length} Transacciones en la Consola`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
