import { useState, useEffect } from 'react';
import { api } from '../api/service';
import { ContributorPanel } from '../components/activity/ContributorPanel';
import { PeriodCards } from '../components/activity/PeriodCards';
import { RoleBars } from '../components/activity/RoleBars';
import { StatCard } from '../components/activity/StatCard';
import { Footer } from '../components/layout/Footer';
import { CommentRow } from '../components/moderation/CommentRow';
import { useMessagesSocket } from '../hooks/useMessagesSocket';
import { computeActivity } from '../utils/activity';

function ActivityContent({ data }) {
  const { messages: m, users: u, top } = data;
  const [showReplied, setShowReplied] = useState(false);
  const [openId, setOpenId] = useState(null);
  const repliedPct = m.total ? Math.round((m.withReplies.length / m.total) * 100) : 0;

  return (
    <div className="stats-content">
      {/* ---------- Messages ---------- */}
      <section>
        <h2 className="stats-section-title">Messages</h2>

        <h3 className="stats-subtitle">Messages créés</h3>
        <PeriodCards
          total={m.total}
          totalSub={`${m.roots} discussion${m.roots > 1 ? 's' : ''} · ${m.replies} réponse${m.replies > 1 ? 's' : ''}`}
          byPeriod={m.created} />

        <h3 className="stats-subtitle">Messages signalés</h3>
        <PeriodCards total={m.reportedTotal} totalSub="En attente de modération" byPeriod={m.reported} />
        <p className="stats-note">
          Les périodes se basent sur la date de publication du message signalé (la date du signalement n'est pas enregistrée).
        </p>

        <h3 className="stats-subtitle">Messages avec au moins une réponse</h3>
        <div className="stat-grid">
          <StatCard label="Messages avec réponse" value={m.withReplies.length} sub={`${repliedPct} % des messages`} accent />
        </div>
        {m.withReplies.length > 0 && (
          <div className="stats-toggle-row">
            <button type="button" className="mod-chip" aria-expanded={showReplied} onClick={() => setShowReplied(v => !v)}>
              {showReplied ? 'Masquer la liste' : 'Voir la liste'}
            </button>
          </div>
        )}
        {showReplied && (
          <div className="mod-list">
            {m.withReplies.map(item => {
              const id = String(item.id);
              const open = openId === id;
              return <CommentRow key={id} id={id} item={item} open={open} onToggle={() => setOpenId(open ? null : id)} />;
            })}
          </div>
        )}
      </section>

      {/* ---------- Utilisateurs ---------- */}
      <section>
        <h2 className="stats-section-title">Utilisateurs</h2>

        <h3 className="stats-subtitle">Comptes</h3>
        <div className="stat-grid">
          <StatCard label="Total utilisateurs" value={u.total} accent />
          <StatCard label="Connectés" value={u.connected} />
          <StatCard label="Non connectés" value={u.offline} />
          <StatCard label="Bloqués" value={u.blocked} />
        </div>

        <h3 className="stats-subtitle">Nouveaux utilisateurs</h3>
        <PeriodCards total={u.total} byPeriod={u.created} />

        <h3 className="stats-subtitle">Répartition par rôle</h3>
        <RoleBars roles={u.roles} total={u.total} />
      </section>

      {/* ---------- Top contributeurs ---------- */}
      <section>
        <h2 className="stats-section-title">Top contributeurs</h2>
        <div className="contrib-grid">
          <ContributorPanel title="Plus de messages publiés" units={['message', 'messages']} list={top.publishers} />
          <ContributorPanel title="Plus de réponses" units={['réponse', 'réponses']} list={top.responders} />
        </div>
      </section>
    </div>
  );
}
export function Activity({ onError }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  // Tout événement WebSocket (message, connexion, déconnexion, inscription) recharge les chiffres
  useMessagesSocket(() => setTick(v => v + 1));

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([api.moderation.users(), api.moderation.comments()])
      .then(([users, comments]) => {
        if (!alive) return;
        setData(computeActivity(users, comments));
        setFailed(false);
      })
      .catch(e => {
        if (!alive) return;
        setFailed(true);
        onError(e.message);
      });
    return () => { alive = false; };
  }, [tick]);

  return (
    <>
      <main className="study-space">
        <div className="study-header">
          <h1>Activités</h1>
          <p>Analyse 2 - Statistiques de la plateforme</p>
        </div>

        {data === null
          ? <p className="mod-empty">{failed ? 'Impossible de charger les statistiques.' : 'Chargement...'}</p>
          : <ActivityContent data={data} />}
      </main>
      <Footer />
    </>
  );
}
