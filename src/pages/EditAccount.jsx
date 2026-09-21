import { useState } from 'react';
import { api } from '../api/service';
import { ConfirmSecretModal } from '../components/modals/ConfirmSecretModal';
import Logo from '../components/ui/Logo';
import PasswordField from '../components/ui/PasswordField';

const EDIT_CONFIG = {
  email: {
    title: 'Changement d’email',
    subtitle: 'Changer votre adresse email pour continuer.',
    submit: 'Procéder à la modification',
    confirm: true
  },
  profile: {
    title: 'Modifier les informations du compte',
    subtitle: 'Changer ou non vos informations personnelles.',
    submit: 'Procéder à la modification',
    confirm: true
  },
  password: {
    title: 'Modification du mot de passe',
    subtitle: 'Changer votre mot de passe pour continuer.',
    submit: 'Procéder',
    confirm: false
  }
};
// Pages de modification du compte : mode = 'email' | 'profile' | 'password'
export function EditAccount({ mode, user, onSuccess, onError, onCancel }) {
  const config = EDIT_CONFIG[mode];
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', nouveauMotDePasse: '', confirmation: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const update = e => setForm({ ...form, [e.target.name]: e.target.value });

  function validate() {
    if (mode === 'email') {
      const email = form.email.trim();
      if (!email) return 'Saisissez votre nouvelle adresse email.';
      if (email.toLowerCase() === (user?.email || '').toLowerCase()) {
        return 'Cette adresse est déjà votre adresse email actuelle.';
      }
    }
    if (mode === 'profile' && !form.nom.trim() && !form.prenom.trim()) {
      return 'Renseignez au moins un champ à modifier.';
    }
    if (mode === 'password') {
      if (form.nouveauMotDePasse !== form.confirmation) return 'Les mots de passe ne correspondent pas.';
      if (form.nouveauMotDePasse.length < 8) return 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
    }
    return '';
  }

  function submit(e) {
    e.preventDefault();
    onError('');
    const problem = validate();
    if (problem) return onError(problem);
    if (mode === 'password') sendCode();
    else setConfirmOpen(true);
  }

  // Mot de passe : envoi du code par email, puis ouverture de la fenêtre de saisie
  async function sendCode() {
    setBusy(true);
    try {
      const res = await api.account.requestPasswordChange({ user, newPassword: form.nouveauMotDePasse });
      setSentTo(res?.email || user?.email || '');
      setConfirmOpen(true);
    } catch (e) {
      onError(e.message || 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  }

  // `secret` = mot de passe actuel (infos, email) ou code reçu par email (mot de passe)
  async function run(secret) {
    setBusy(true);
    const changes = mode === 'email' ? { email: form.email.trim().toLowerCase() }
      : mode === 'profile' ? { nom: form.nom.trim() || user?.nom, prenom: form.prenom.trim() || user?.prenom }
        : {};
    try {
      let result;
      if (mode === 'email') {
        result = await api.account.updateEmail({ user, ...changes, currentPassword: secret });
      } else if (mode === 'profile') {
        result = await api.account.updateProfile({ user, ...changes, currentPassword: secret });
      } else {
        result = await api.account.confirmPasswordChange({ user, code: secret });
      }
      const updated = result?.utilisateur || result?.user || (result?.email ? result : {});
      setConfirmOpen(false);
      onSuccess({ ...user, ...changes, ...updated }, { emailVerified: mode === 'password' });
    } catch (e) {
      // Code erroné : la fenêtre reste ouverte pour réessayer ou renvoyer un code
      if (mode !== 'password') setConfirmOpen(false);
      onError(e.message || 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <main className="auth-page">
        <section className="auth-visual">
          <div className="auth-visual-overlay"></div>
          <div className="auth-visual-content">
            <div className="logo-circle">
              <Logo className="auth-logo" />
            </div>
            <h1>Amusez-vous</h1>
            <p>Accédez vos cours, demandez de l'aide au professeur ou via l'assistant IA et entraînez-vous sur notre plateforme d'apprentissage Ne-laiko.</p>
          </div>
        </section>

        <section className="auth-form-container">
          <div className="auth-form-wrapper">
            <h1>{config.title}</h1>
            <p className="auth-subtitle">{config.subtitle}</p>

            <form onSubmit={submit} className="auth-form">
              {mode === 'email' && (
                <div className="input-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={user?.email || 'xxxxx@example.com'}
                    value={form.email}
                    onChange={update}
                    required
                    autoFocus />
                </div>
              )}

              {mode === 'profile' && (
                <>
                  <div className="input-group">
                    <label htmlFor="nom">Nom</label>
                    <input
                      id="nom"
                      name="nom"
                      placeholder={user?.nom || 'Rakotosoa'}
                      value={form.nom}
                      onChange={update}
                      autoFocus />
                  </div>
                  <div className="input-group">
                    <label htmlFor="prenom">Prénoms</label>
                    <input
                      id="prenom"
                      name="prenom"
                      placeholder={user?.prenom || 'Faly Hasy'}
                      value={form.prenom}
                      onChange={update} />
                  </div>
                </>
              )}

              {mode === 'password' && (
                <>
                  <div className="input-group">
                    <label htmlFor="nouveauMotDePasse">Nouveau mot de passe</label>
                    <PasswordField
                      id="nouveauMotDePasse"
                      name="nouveauMotDePasse"
                      value={form.nouveauMotDePasse}
                      onChange={update}
                      autoComplete="new-password"
                      autoFocus />
                  </div>
                  <div className="input-group">
                    <label htmlFor="confirmation">Confirmer votre nouveau mot de passe</label>
                    <PasswordField
                      id="confirmation"
                      name="confirmation"
                      value={form.confirmation}
                      onChange={update}
                      autoComplete="new-password" />
                  </div>
                </>
              )}

              <button type="submit" className="auth-submit-btn" disabled={busy}>
                {busy && !confirmOpen ? 'Chargement...' : config.submit}
              </button>
            </form>

            <p className="auth-switch">
              <button type="button" className="inline-link" onClick={onCancel}>Retour</button>
            </p>
          </div>
        </section>
      </main>

      {confirmOpen && (mode === 'password' ? (
        <ConfirmSecretModal
          title="Confirmation par email"
          text={`Un code à 6 chiffres a été envoyé à ${sentTo}. Saisissez-le pour confirmer.`}
          label="Code de confirmation"
          submitLabel="Valider"
          secret="code"
          busy={busy}
          onConfirm={run}
          onCancel={() => setConfirmOpen(false)}
          onResend={sendCode} />
      ) : (
        <ConfirmSecretModal
          title="Confirmation de modification"
          text="Saisissez votre mot de passe pour confirmer"
          label="Mot de passe"
          busy={busy}
          onConfirm={run}
          onCancel={() => setConfirmOpen(false)} />
      ))}
    </>
  );
}
