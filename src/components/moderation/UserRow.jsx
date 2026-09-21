import { AccordionItem } from './AccordionItem';
import { isStaffRole, roleLabel } from '../../utils/roles';

export function UserRow({ id, user, open, onToggle }) {
  const name = [user.prenom, user.nom].filter(Boolean).join(' ') || 'Utilisateur';
  return (
    <AccordionItem
      id={id}
      open={open}
      onToggle={onToggle}
      avatar={(user.prenom || user.nom || 'U')[0].toUpperCase()}
      staff={isStaffRole(user.role)}
      title={name}
      roleText={roleLabel(user.role)}
      meta={user.matricule}
    >
      <dl className="mod-details">
        <div><dt>Prénoms</dt><dd>{user.prenom || '—'}</dd></div>
        <div><dt>Nom</dt><dd>{user.nom || '—'}</dd></div>
        <div><dt>Matricule</dt><dd>{user.matricule || '—'}</dd></div>
        <div><dt>Email</dt><dd>{user.email || '—'}</dd></div>
        <div><dt>Connexion</dt><dd>{user.connecte ? 'Connecté' : 'Non connecté'}</dd></div>
      </dl>
    </AccordionItem>
  );
}
