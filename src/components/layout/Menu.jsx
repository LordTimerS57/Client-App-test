export function Menu({ open, close, navigate, admin }) {
  if (!open) return null;
  return (
    <>
      <div className="menu-backdrop" onClick={close} />
      <aside className="side-menu">
        {admin ? (
          <button type="button" className="menu-header menu-header-link" onClick={() => navigate('moderation')}>
            <span className="menu-label">Administration</span>
            <strong>Modération</strong>
          </button>
        ) : (
          <div className="menu-header">
            <span className="menu-label">Cours</span>
            <strong>Analyse 2</strong>
          </div>
        )}
        <nav className="menu-links">
          {admin ? (
            <>
              <button onClick={() => navigate('moderation-users')}>Utilisateurs</button>
              <button onClick={() => navigate('moderation-comments')}>Commentaires</button>
              <button onClick={() => navigate('moderation-reports')}>Signalements</button>
              <button onClick={() => navigate('activity')}>Activités</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('study')}>Assistant IA</button>
              <button onClick={() => navigate('comments')}>Commentaires</button>
              <button onClick={() => navigate('study')}>Méthodologie</button>
              <button onClick={() => navigate('study')}>Révision</button>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
