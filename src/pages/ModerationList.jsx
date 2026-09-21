import { useState, useEffect } from 'react';
import { api } from '../api/service';
import { Footer } from '../components/layout/Footer';
import { CommentRow } from '../components/moderation/CommentRow';
import { ModerationToolbar } from '../components/moderation/ModerationToolbar';
import { UserRow } from '../components/moderation/UserRow';
import { useMessagesSocket } from '../hooks/useMessagesSocket';
import { commentAuthor } from '../utils/messages';
import { roleKey } from '../utils/roles';
import { norm } from '../utils/text';

const MODERATION_PAGES = {
  users: {
    title: 'Utilisateurs',
    subtitle: 'Analyse 2 - Comptes inscrits',
    placeholder: 'Rechercher par nom ou matricule...',
    empty: 'Aucun utilisateur inscrit.',
    unit: ['utilisateur', 'utilisateurs']
  },
  comments: {
    title: 'Commentaires',
    subtitle: 'Analyse 2 - Discussions publiées',
    placeholder: 'Rechercher un commentaire, un nom ou un matricule...',
    empty: 'Aucun commentaire publié.',
    unit: ['commentaire', 'commentaires']
  },
  reports: {
    title: 'Signalements',
    subtitle: 'Analyse 2 - Commentaires signalés',
    placeholder: 'Rechercher un commentaire, un nom ou un matricule...',
    empty: 'Aucun commentaire signalé.',
    unit: ['signalement', 'signalements']
  }
};
const userText = user => [user.prenom, user.nom, user.matricule, user.email].join(' ');
const commentText = item => {
  const author = commentAuthor(item);
  return [item.contenu || item.content, author.prenom, author.nom, author.matricule].join(' ');
};
// Pages de modération : kind = 'users' | 'comments' | 'reports' (accordéon, lecture seule)
export function ModerationList({ kind, onError }) {
  const page = MODERATION_PAGES[kind];
  const [items, setItems] = useState(null); // null = chargement en cours
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [tick, setTick] = useState(0);

  // Tout événement WebSocket (message, utilisateur, ou reconnexion "OPEN") recharge les données
  useMessagesSocket(() => setTick(v => v + 1));

  // Filet de sécurité si un événement est manqué (réseau coupé, etc.)
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    // Pour les commentaires, le rôle de l'auteur est retrouvé via son matricule (liste des utilisateurs)
    const loadRoles = kind === 'users'
      ? Promise.resolve({})
      : api.moderation.users()
        .then(list => Object.fromEntries(list.filter(u => u.matricule).map(u => [u.matricule, u.role])))
        .catch(() => ({}));

    Promise.all([api.moderation[kind](), loadRoles])
      .then(([list, roles]) => {
        if (!alive) return;
        setItems(kind === 'users'
          ? list
          : list.map(item => {
            const author = commentAuthor(item);
            return { ...item, authorRole: author.role || roles[author.matricule] };
          }));
      })
      .catch(e => {
        if (!alive) return;
        setItems(prev => prev ?? []); // en cas d'erreur de rechargement, on garde la liste déjà affichée
        onError(e.message);
      });
    return () => { alive = false; };
  }, [kind, tick]);

  const terms = norm(search).split(/\s+/).filter(Boolean);
  const visible = (items || []).filter(item => {
    const itemRole = kind === 'users' ? item.role : item.authorRole;
    if (role !== 'all' && roleKey(itemRole) !== role) return false;
    const text = norm(kind === 'users' ? userText(item) : commentText(item));
    return terms.every(term => text.includes(term));
  });
  const filtered = terms.length > 0 || role !== 'all';
  const unit = page.unit[(filtered ? (items || []).length : visible.length) > 1 ? 1 : 0];

  return (
    <>
      <main className="study-space">
        <div className="study-header">
          <h1>{page.title}</h1>
          <p>{page.subtitle}</p>
        </div>

        <div className="mod-content">
          <ModerationToolbar
            search={search}
            onSearch={setSearch}
            role={role}
            onRole={setRole}
            placeholder={page.placeholder} />

          {items === null && <p className="mod-empty">Chargement...</p>}
          {items?.length === 0 && <p className="mod-empty">{page.empty}</p>}
          {items?.length > 0 && visible.length === 0 && <p className="mod-empty">Aucun résultat pour cette recherche.</p>}
          {visible.length > 0 && (
            <p className="mod-count">
              {visible.length}{filtered ? ` sur ${items.length}` : ''} {unit}
            </p>
          )}

          <section className="mod-list">
            {visible.map((item, index) => {
              const id = String((kind === 'users' ? (item.matricule || item.id || item.email) : item.id) ?? `row-${index}`);
              const open = openId === id;
              const toggle = () => setOpenId(open ? null : id);
              return kind === 'users'
                ? <UserRow key={id} id={id} user={item} open={open} onToggle={toggle} />
                : <CommentRow key={id} id={id} item={item} open={open} onToggle={toggle} />;
            })}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
