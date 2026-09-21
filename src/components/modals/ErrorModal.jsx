export function ErrorModal({ message, close }) {
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="validation-dialog" onClick={e => e.stopPropagation()}>
        <div className="status-circle error-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h2>Une erreur est survenue</h2>
        <p>{message}</p>
        <button className="dialog-btn error-btn" onClick={close}>
          Fermer
        </button>
      </div>
    </div>
  );
}
