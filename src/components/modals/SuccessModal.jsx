const SUCCESS_CONTENT = {
  emailVerified: {
    title: 'Email validé',
    text: 'Votre adresse email a bien été confirmée.',
    button: 'Continuer'
  },
  reply: {
    title: 'Réponse envoyée',
    text: 'Votre réponse a bien été publiée sous ce commentaire.',
    button: 'D’accord'
  },
  edit: {
    title: 'Commentaire modifié',
    text: 'Votre commentaire a bien été mis à jour.',
    button: 'D’accord'
  },
  delete: {
    title: 'Commentaire supprimé',
    text: 'Votre commentaire a bien été supprimé.',
    button: 'D’accord'
  },
  report: {
    title: 'Signalement envoyé',
    text: 'Merci, ce commentaire a été transmis à la modération.',
    button: 'D’accord'
  },
  login: {
    title: 'Connexion réussie',
    text: 'Vous pouvez passer à l’étape suivante',
    button: 'Ok'
  },
  register: {
    title: 'Inscription terminée',
    text: 'Merci d’être inscrit à Ne-laiko',
    button: 'Continuer'
  },
  logout: {
    title: 'Déconnexion réussie',
    text: 'Vous avez été déconnecté avec succès. À bientôt !',
    button: 'Ok'
  },
  publish: {
    title: 'Commentaire publié',
    text: 'Votre commentaire a bien été publié et est désormais visible par les autres utilisateurs.',
    button: 'D’accord'
  },
  update: {
    title: 'Modification réussie',
    text: 'Vous pouvez maintenant retourner où vous en êtes actuellement',
    button: 'D’accord'
  }
};
export function SuccessModal({ mode, onConfirm }) {
  const content = SUCCESS_CONTENT[mode] || SUCCESS_CONTENT.login;
  return (
    <div className="modal-backdrop">
      <div className="validation-dialog">
        <div className="status-circle success-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2>{content.title}</h2>
        <p>{content.text}</p>
        <button className="dialog-btn success-btn" onClick={onConfirm}>
          {content.button}
        </button>
      </div>
    </div>
  );
}
