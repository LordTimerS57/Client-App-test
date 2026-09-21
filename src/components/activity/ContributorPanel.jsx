import { isStaffRole, roleLabel } from '../../utils/roles';

export function ContributorPanel({ title, units, list }) {
  return (
    <div className="stat-panel">
      <h4 className="stat-panel-title">{title}</h4>
      {list.length === 0 ? (
        <p className="stats-note">Aucune donnée pour le moment.</p>
      ) : (
        <ol className="contrib-list">
          {list.map((entry, index) => {
            const a = entry.author;
            const name = [a.prenom, a.nom].filter(Boolean).join(' ') || 'Utilisateur';
            const staff = isStaffRole(a.role);
            return (
              <li key={a.matricule} className={`contrib-item ${index === 0 ? 'first' : ''}`}>
                <span className={`discussion-avatar ${staff ? 'prof-avatar' : ''}`}>{name[0].toUpperCase()}</span>
                <span className="contrib-main">
                  <span className="author-title">
                    <strong>{name}</strong>
                    <span className={`role-badge ${staff ? 'prof-badge' : ''}`}>{roleLabel(a.role)}</span>
                  </span>
                  <small className="time-ago">{a.matricule}</small>
                </span>
                <span className="contrib-count">
                  <strong>{entry.count}</strong> {units[entry.count > 1 ? 1 : 0]}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
