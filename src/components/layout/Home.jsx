import { Footer } from './Footer';

export function Home({ navigate }) {
  return (
    <>
      <section className="welcome-hero">
        <div className="hero-content">
          <h1>Bienvenue sur Ne-laiko</h1>
          <p>La clé de votre réussite{"\n"}universitaire avant tout</p>
          <button className="hero-button" onClick={() => navigate('login')}>Commencer</button>
        </div>
      </section>
      <Footer />
    </>
  );
}
