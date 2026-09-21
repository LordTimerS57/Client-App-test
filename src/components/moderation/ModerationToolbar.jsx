import { ROLE_FILTERS } from '../../utils/roles';

// Recherche + filtre par rôle (pastilles)
export function ModerationToolbar({ search, onSearch, role, onRole, placeholder }) {
  return (
    <div className="mod-toolbar">
      <div className="search-input-wrapper mod-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label="Rechercher" />
      </div>
      <div className="mod-chips" role="group" aria-label="Filtrer par rôle">
        {ROLE_FILTERS.map(filter => (
          <button
            type="button"
            key={filter.key}
            className={`mod-chip ${role === filter.key ? 'active' : ''}`}
            aria-pressed={role === filter.key}
            onClick={() => onRole(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
