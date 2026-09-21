// Ligne d'accordéon générique : en-tête cliquable + panneau de détails
export function AccordionItem({ id, open, onToggle, avatar, staff, title, roleText, meta, preview, aside, children }) {
  const panelId = `accordion-panel-${id}`;
  return (
    <article className={`accordion-item ${open ? 'open' : ''}`}>
      <button type="button" className="accordion-header" onClick={onToggle} aria-expanded={open} aria-controls={panelId}>
        <span className={`discussion-avatar ${staff ? 'prof-avatar' : ''}`}>{avatar}</span>
        <span className="accordion-main">
          <span className="author-title">
            <strong>{title}</strong>
            <span className={`role-badge ${staff ? 'prof-badge' : ''}`}>{roleText}</span>
          </span>
          {meta && <small className="time-ago">{meta}</small>}
          {preview && !open && <span className="accordion-preview">{preview}</span>}
        </span>
        {aside}
        <svg className="accordion-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="accordion-panel" id={panelId} role="region">{children}</div>}
    </article>
  );
}
