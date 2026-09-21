import { Footer } from '../components/layout/Footer';

export function Moderation({ navigate }) {
  const icon = paths => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {paths}
    </svg>
  );

  const cards = [
    {
      id: 'users',
      to: 'moderation-users',
      title: 'Utilisateurs',
      text: 'Consultez les comptes étudiants et professeurs.',
      icon: icon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>)
    },
    {
      id: 'comments',
      to: 'moderation-comments',
      title: 'Commentaires',
      text: 'Consultez les discussions publiées.',
      icon: icon(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />)
    },
    {
      id: 'reports',
      to: 'moderation-reports',
      title: 'Signalements',
      text: 'Examinez les commentaires signalés.',
      icon: icon(<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>)
    },
    {
      id: 'activity',
      to: 'activity',
      title: 'Activités',
      text: 'Suivez l’activité de la plateforme.',
      icon: icon(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />)
    }
  ];

  return (
    <>
      <main className="study-space">
        <div className="study-header">
          <h1>Espace de modération</h1>
          <p>Analyse 2 - Suivi des échanges</p>
        </div>

        <section className="study-grid">
          {cards.map(card => (
            <button
              className="study-card"
              key={card.id}
              onClick={() => card.to && navigate(card.to)}
            >
              <div className="study-icon-wrapper">
                {card.icon}
              </div>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
            </button>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
