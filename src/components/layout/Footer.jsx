import Logo from '../ui/Logo';

export function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Logo className="footer-logo" />
          <div className="contact-icons">
            <span className="contact-icon" title="Téléphone">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <span className="contact-icon" title="Email">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
          </div>
        </div>

        <div className="footer-col">
          <strong>Cas d'utilisation</strong>
          <span>Apprentissage</span>
          <span>Compréhension des sujets</span>
          <span>Allègement des enseignements</span>
          <span>Plus sur la pratique</span>
        </div>

        <div className="footer-col">
          <strong>Explorations</strong>
          <span>Méthodologies d'apprentissage</span>
          <span>Cours, cursus</span>
        </div>

        <div className="footer-col">
          <strong>Ressources</strong>
          <span>Assistant IA</span>
          <span>Forum étudiants-professeurs</span>
          <span>Plateforme d'examen en ligne</span>
          <span>Plateforme d'étude en ligne</span>
          <span>Aide</span>
        </div>
      </div>
    </footer>
  );
}
