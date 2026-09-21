import { byDateDesc } from './dates';
import { commentAuthor, reportCount, hasVisible } from './messages';
import { roleKey } from './roles';
import { norm } from './text';

// ================= Page Activités (admin) =================
const DAY_MS = 24 * 60 * 60 * 1000;
// Fenêtres glissantes : modifiez ici pour changer les périodes
export const ACTIVITY_PERIODS = [
  { key: 'day', label: '24 dernières heures', ms: DAY_MS },
  { key: 'week', label: '7 derniers jours', ms: 7 * DAY_MS },
  { key: 'month', label: '30 derniers jours', ms: 30 * DAY_MS },
  { key: 'year', label: '12 derniers mois', ms: 365 * DAY_MS }
];
const repliesOf = m => m.replies || m.messagesReponses || [];
// Aplatit l'arbre (racines + réponses à tous les niveaux), sans les messages supprimés
function collectMessages(list, isReply = false) {
  return list.flatMap(m => [
    ...(m.statut === 'SUPPRIME' ? [] : [{ ...m, isReply, authorRole: commentAuthor(m).role }]),
    ...collectMessages(repliesOf(m), true)
  ]);
}
function countByPeriod(items, getDate, now) {
  const counts = {};
  for (const period of ACTIVITY_PERIODS) {
    counts[period.key] = items.filter(item => {
      const time = Date.parse(getDate(item));
      return !Number.isNaN(time) && now - time <= period.ms;
    }).length;
  }
  return counts;
}
// Top 3 des auteurs (égalité : ordre alphabétique du nom)
function topContributors(messages) {
  const byUser = new Map();
  for (const m of messages) {
    const author = commentAuthor(m);
    if (!author.matricule) continue;
    const entry = byUser.get(author.matricule) || { author, count: 0 };
    entry.count += 1;
    byUser.set(author.matricule, entry);
  }
  return [...byUser.values()]
    .sort((a, b) => b.count - a.count || norm(a.author.nom).localeCompare(norm(b.author.nom)))
    .slice(0, 3);
}
export function computeActivity(users, comments) {
  const now = Date.now();
  const all = collectMessages(comments);
  const reported = all.filter(m => reportCount(m) > 0);
  const replyCount = m => repliesOf(m).filter(hasVisible).length;
  const withReplies = all
    .filter(m => replyCount(m) > 0)
    .sort((a, b) => replyCount(b) - replyCount(a) || byDateDesc(a, b));

  // Répartition exclusive : bloqué > connecté > non connecté
  const blocked = users.filter(u => u.status === false).length;
  const connected = users.filter(u => u.status !== false && u.connecte).length;
  const roles = { etudiant: 0, prof: 0, admin: 0 };
  users.forEach(u => { roles[roleKey(u.role)] += 1; });

  return {
    messages: {
      total: all.length,
      roots: all.filter(m => !m.isReply).length,
      replies: all.filter(m => m.isReply).length,
      created: countByPeriod(all, m => m.dateDePublication, now),
      reportedTotal: reported.length,
      reported: countByPeriod(reported, m => m.dateDePublication, now),
      withReplies
    },
    users: {
      total: users.length,
      connected,
      blocked,
      offline: users.length - connected - blocked,
      created: countByPeriod(users, u => u.dateInscription, now),
      roles
    },
    top: {
      publishers: topContributors(all),
      responders: topContributors(all.filter(m => m.isReply))
    }
  };
}
