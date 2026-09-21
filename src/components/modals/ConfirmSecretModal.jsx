import { useState } from 'react';
import PasswordField from '../ui/PasswordField';

// Fenêtre de confirmation commune : mot de passe (infos, email) ou code reçu par email (mot de passe)
export function ConfirmSecretModal({ title, text, label, submitLabel = 'Modifier', secret = 'password', busy, onConfirm, onCancel, onResend }) {
  const [value, setValue] = useState('');
  const isCode = secret === 'code';

  function submit(e) {
    e.preventDefault();
    if (busy || !value) return;
    onConfirm(value);
  }

  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onCancel}>
      <form
        className="validation-dialog confirm-dialog confirm-password-dialog"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        onSubmit={submit}
      >
        <button type="button" className="close-button" onClick={onCancel} disabled={busy} aria-label="Fermer">×</button>
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="input-group">
          <label htmlFor="confirm-secret">{label}</label>
          {isCode ? (
            <input
              id="confirm-secret"
              className="code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={value}
              onChange={e => setValue(e.target.value.replace(/\D/g, ''))}
              autoFocus
              required />
          ) : (
            <PasswordField
              id="confirm-secret"
              name="confirmPassword"
              value={value}
              onChange={e => setValue(e.target.value)}
              autoComplete="current-password"
              autoFocus />
          )}
          {onResend && (
            <button type="button" className="inline-link resend-link" onClick={onResend} disabled={busy}>
              Renvoyer le code
            </button>
          )}
        </div>
        <div className="dialog-actions dialog-actions-end">
          <button type="button" className="dialog-btn secondary-btn" onClick={onCancel} disabled={busy}>Annuler</button>
          <button type="submit" className="dialog-btn" disabled={busy || !value || (isCode && value.length !== 6)}>{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}
