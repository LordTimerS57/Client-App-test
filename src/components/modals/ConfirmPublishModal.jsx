export function ConfirmPublishModal({
  busy, onConfirm, onCancel, title = 'Confirmation de publication', text = <>Voulez-vous vraiment publier<br />ce commentaire ?</>
}) {
  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onCancel}>
      <div
        className="validation-dialog confirm-dialog"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        <button type="button" className="close-button" onClick={onCancel} disabled={busy} aria-label="Fermer">×</button>
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="dialog-actions">
          <button type="button" className="dialog-btn secondary-btn" onClick={onConfirm} disabled={busy}>Oui</button>
          <button type="button" className="dialog-btn" onClick={onCancel} disabled={busy}>Non</button>
        </div>
      </div>
    </div>
  );
}
