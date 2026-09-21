import { Footer } from '../components/layout/Footer';

export function Study({ navigate }) {
  const cards = [
    {
      id: 'methodology',
      title: 'Méthodologie',
      text: 'Suivez votre progression étape par étape.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      )
    },
    {
      id: 'assistant',
      title: 'Assistant IA',
      text: 'Posez vos questions à l\'assistant intelligent.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      id: 'comments',
      title: 'Commentaires',
      text: 'Échangez avec étudiants et professeurs.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      id: 'revision',
      title: 'Revision',
      text: 'Repassez un examen pour voir où vous en êtes actuellement',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    }
  ];

  return (
    <>
      <main className="study-space">
        <div className="study-header">
          <h1>Espace d'étude</h1>
          <p>Analyse 2 - Répétition espacée</p>
        </div>

        <section className="study-grid">
          {cards.map((card) => (
            <button
              className="study-card"
              key={card.id}
              onClick={() => card.id === 'comments' && navigate('comments')}
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
