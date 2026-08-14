import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import Swal from 'sweetalert2';
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
  const [personInCharge, setPersonInCharge] = useState<string>(userName);
  const [googleAccessToken, setGoogleAccessToken] = useState<string>(
    () => localStorage.getItem('google_access_token') || ''
  );

  const [rawText, setRawText] = useState<string>('');
  const [parsedTransactions, setParsedTransactions] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);

  const handleCloseModal = () => {
    if (importing) return; // Prevent closing while importing
    setParsedTransactions([]);
    setStatusMsg('');
    setRawText('');
    onClose();
  };

  const handleTabChange = (tab: 'scan' | 'paste') => {
    if (importing || isScanning) return;
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
        setStatusMsg('¡Cuenta de Gmail autorizada! Escaneando correos reales...');
        performScan(tokenResponse.access_token);
      }
    },
    onError: (error) => {
      console.error('Gmail OAuth error:', error);
      setStatusMsg('⚠️ No se pudo conectar a la cuenta de Gmail.');
      setIsScanning(false);
    },
  });

  if (!isOpen) return null;

  const forceReconnect = () => {
    localStorage.removeItem('google_access_token');
    setGoogleAccessToken('');
    loginWithGmailScope();
  };

  const performScan = async (token?: string) => {
    setParsedTransactions([]);
    const activeToken = token || googleAccessToken || localStorage.getItem('google_access_token') || undefined;

    if (!activeToken) {
      loginWithGmailScope();
      return;
    }

    setIsScanning(true);
    setStatusMsg('Buscando notificaciones bancarias en tu bandeja de Gmail...');

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
          setStatusMsg(`¡Escaneo completado! Se encontraron ${adjusted.length} transacciones en tu Gmail.`);
        } else {
          setStatusMsg('No se encontraron notificaciones bancarias nuevas en tu cuenta de Gmail.');
        }
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      // Remove stale/expired token from storage so next click launches OAuth popup
      localStorage.removeItem('google_access_token');
      setGoogleAccessToken('');

      setStatusMsg('🔑 Tu pase de acceso a Gmail expiró. Por favor haz clic en "Conectar y Escanear mi Gmail" para ingresar de nuevo.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanButtonClick = () => {
    const activeToken = googleAccessToken || localStorage.getItem('google_access_token');
    if (activeToken) {
      performScan(activeToken);
    } else {
      // Synchronous call inside user click handler allows browser popup to open cleanly
      loginWithGmailScope();
    }
  };

  const handleParseText = async () => {
    if (!rawText.trim()) return;
    setParsedTransactions([]);
    setIsScanning(true);
    setStatusMsg('Analizando texto del correo con IA...');
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
      setStatusMsg('⚠️ Error al analizar el texto.');
    } finally {
      setIsScanning(false);
    }
  };

  const updateTxField = (idx: number, field: string, value: any) => {
    if (importing) return;
    setParsedTransactions((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleImportAll = async () => {
    if (parsedTransactions.length === 0 || importing) return;
    setImporting(true);
    try {
      const res = await api.post('/gmail/import', {
        transactions: parsedTransactions,
      });
      onSuccess();
      handleCloseModal();
      
      // Modern Swal dark theme success alert
      Swal.fire({
        icon: 'success',
        title: '¡Transacciones Guardadas!',
        text: `Se importaron ${res.importedCount} transacciones a tu consola de gastos.`,
        background: '#1f2937',
        color: '#f8fafc',
        confirmButtonColor: '#107c41',
        confirmButtonText: 'Genial, Continuar',
        customClass: {
          popup: 'modern-swal-dark-popup',
        },
      });
    } catch (err: any) {
      console.error('Import error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error al importar',
        text: 'Ocurrió un problema al guardar las transacciones en la base de datos.',
        background: '#1f2937',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setImporting(false);
    }
  };

  const removeItem = (idx: number) => {
    if (importing) return;
    setParsedTransactions((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="modal-backdrop" onClick={() => !importing && handleCloseModal()}>
      <div className="gmail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="gmail-modal-header">
          <div className="header-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#ea4335" style={{ marginRight: '8px' }}>
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <h3>Importador de Transacciones de Gmail</h3>
          </div>
          <button onClick={handleCloseModal} disabled={importing} className="modal-close-btn" title="Cerrar modal">
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="gmail-tabs">
          <button
            className={`gmail-tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => handleTabChange('scan')}
            disabled={importing || isScanning}
          >
            Escaneo de Gmail
          </button>
          <button
            className={`gmail-tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
            onClick={() => handleTabChange('paste')}
            disabled={importing || isScanning}
          >
            Pegar Texto de Correo
          </button>
        </div>

        <div className="gmail-modal-body">
          {/* Narrow Compact Person Selector */}
          <div className="modal-input-group person-group-compact">
            <label className="person-select-label">Encargado por defecto:</label>
            <select
              value={personInCharge}
              onChange={(e) => setPersonInCharge(e.target.value)}
              disabled={importing || isScanning}
              className="person-select-input-narrow"
            >
              <option value="Boris">Boris</option>
              <option value="Sofia">Sofia</option>
            </select>
          </div>

          {activeTab === 'scan' ? (
            <div className="scan-section">
              <p className="scan-desc">
                Escanea tu bandeja de entrada en búsqueda de notificaciones bancarias de BAC Credomatic, Ficohsa, Banpaís, Banco Atlántida, PayPal, etc.
              </p>

              {/* UNIFIED SINGLE BUTTON */}
              <div style={{ marginTop: '12px' }}>
                <button
                  onClick={handleScanButtonClick}
                  disabled={isScanning || importing}
                  className="start-scan-btn unified-scan-btn"
                >
                  {isScanning ? (
                    <>
                      <span className="btn-spinner"></span>
                      Escaneando bandeja de Gmail...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                      Conectar y Escanear mi Gmail
                    </>
                  )}
                </button>

                <div style={{ marginTop: '8px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={forceReconnect}
                    disabled={isScanning || importing}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    🔄 Cambiar o Reconectar mi cuenta de Gmail
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="paste-section">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                disabled={isScanning || importing}
                placeholder="Pega aquí el texto de tu correo bancario (ejemplo: BAC Credomatic: Compra aprobada por L 1,400.00 en ESTACION SERC TEXAC...)"
                rows={5}
                className="raw-email-textarea"
              />
              <button
                onClick={handleParseText}
                disabled={isScanning || importing || !rawText.trim()}
                className="start-scan-btn unified-scan-btn"
                style={{ marginTop: '10px' }}
              >
                {isScanning ? (
                  <>
                    <span className="btn-spinner"></span>
                    Analizando texto con IA...
                  </>
                ) : (
                  '⚡ Analizar Correo con IA'
                )}
              </button>
            </div>
          )}

          {/* Scanning Box Loading Indicator */}
          {isScanning && (
            <div className="scanning-loading-box">
              <div className="scanning-spinner"></div>
              <p className="scanning-text">🔍 Buscando notificaciones bancarias en tu Gmail...</p>
            </div>
          )}

          {statusMsg && !isScanning && <div className="status-banner">{statusMsg}</div>}

          {/* Results Preview List with Editable Fields */}
          {parsedTransactions.length > 0 && (
            <div className="parsed-results-list">
              <h4 className="preview-list-header">
                Transacciones Extraídas ({parsedTransactions.length}) - Revisa o edita cualquier campo:
              </h4>
              <div className="results-scroll">
                {parsedTransactions.map((tx, idx) => (
                  <div key={idx} className={`parsed-item-card-editable ${importing ? 'disabled-card' : ''}`}>
                    <div className="card-row-top">
                      <div className="input-field-group flex-2">
                        <label className="field-label">Comercio / Concepto:</label>
                        <input
                          type="text"
                          value={tx.concept}
                          disabled={importing}
                          onChange={(e) => updateTxField(idx, 'concept', e.target.value)}
                          className="editable-input concept-input-field"
                        />
                      </div>

                      <div className="input-field-group flex-1">
                        <label className="field-label">Monto ({tx.currency || 'HNL'}):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={tx.amount}
                          disabled={importing}
                          onChange={(e) => updateTxField(idx, 'amount', parseFloat(e.target.value) || 0)}
                          className="editable-input amount-input-field"
                        />
                      </div>

                      <button
                        onClick={() => removeItem(idx)}
                        disabled={importing}
                        className="item-remove-btn"
                        title="Quitar esta transacción"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="card-row-middle">
                      <div className="input-field-group full-width">
                        <label className="field-label">Detalle / Notas (Opcional):</label>
                        <input
                          type="text"
                          value={tx.detail}
                          disabled={importing}
                          onChange={(e) => updateTxField(idx, 'detail', e.target.value)}
                          placeholder="Escribe un detalle opcional..."
                          className="editable-input detail-input-field"
                        />
                      </div>
                    </div>

                    <div className="card-row-bottom">
                      <div className="input-field-group flex-1">
                        <label className="field-label">Categoría:</label>
                        <select
                          value={tx.categoryName}
                          disabled={importing}
                          onChange={(e) => updateTxField(idx, 'categoryName', e.target.value)}
                          className="editable-select"
                        >
                          <option value="Transporte">Transporte</option>
                          <option value="Servicios">Servicios</option>
                          <option value="Casa">Casa (Tiendas Dpto)</option>
                          <option value="Supermercado">Supermercado</option>
                          <option value="Mascotas">Mascotas</option>
                          <option value="Bienes">Bienes</option>
                          <option value="Otros">Otros</option>
                        </select>
                      </div>

                      <div className="input-field-group flex-1">
                        <label className="field-label">Método de Pago:</label>
                        <input
                          type="text"
                          value={tx.paymentMethodName}
                          disabled={importing}
                          onChange={(e) => updateTxField(idx, 'paymentMethodName', e.target.value)}
                          className="editable-input"
                        />
                      </div>

                      <div className="input-field-group">
                        <label className="field-label">Encargado:</label>
                        <select
                          value={tx.personInCharge}
                          disabled={importing}
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
                          disabled={importing}
                          onChange={(e) => updateTxField(idx, 'date', e.target.value)}
                          className="editable-input date-input"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* SAVE / IMPORT BUTTON WITH SPINNER */}
              <div className="import-action-bar">
                <button onClick={handleImportAll} disabled={importing} className="confirm-import-btn">
                  {importing ? (
                    <>
                      <span className="btn-spinner"></span>
                      Guardando e Importando Transacciones...
                    </>
                  ) : (
                    `📥 Guardar ${parsedTransactions.length} Transacciones en la Consola`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
