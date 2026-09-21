import { useState } from 'react';
import { api } from '../api/service';
import Logo from '../components/ui/Logo';
import PasswordField from '../components/ui/PasswordField';

const emptyRegistration = { matricule: '', nom: '', prenom: '', email: '', motDePasse: '' };

export function Auth({ mode, navigate, onSuccess, onError }) {
  const register = mode === 'register';
  const [form, setForm] = useState(
    register
      ? { ...emptyRegistration, etudiant: true }
      : { email: '', motDePasse: '' }
  );
  const [busy, setBusy] = useState(false);

  const update = e => setForm({
    ...form,
    [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    onError('');
    try {
      const result = register
        ? await api.auth.register({
          matricule: form.matricule,
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          motDePasse: form.motDePasse,
          role: form.etudiant ? 'ETUDIANT' : 'PROF'
        })
        : await api.auth.login({
          email: form.email,
          motDePasse: form.motDePasse
        });

      const user = result?.utilisateur || result?.user || (result?.email ? result : null);
      if (!user) {
        throw new Error(result?.message || result?.error || 'Échec d’authentification : données invalides.');
      }

      onSuccess(user, register ? 'register' : 'login');
    } catch (error) {
      onError(error.message || 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-visual-overlay"></div>
        <div className="auth-visual-content">
          <div className="logo-circle">
            <Logo className="auth-logo" />
          </div>
          <h1>{register ? 'Rejoignez-nous' : 'Commencez\nl\'aventure'}</h1>
          <p>
            {register
              ? "Accédez vos cours, demandez de l'aide au professeur ou via l'assistant IA et entraînez-vous sur notre plateforme d'apprentissage Ne-laiko."
              : "Grace à Ne-laiko, vos soucis sur l'accessibilité et la compréhension des études sont épargnez."}
          </p>
        </div>
      </section>

      <section className="auth-form-container">
        <div className="auth-form-wrapper">
          <h1>{register ? 'Créer un compte' : 'Se connecter à votre compte'}</h1>
          <p className="auth-subtitle">
            {register ? 'Remplissez vos informations pour commencer.' : 'Remplissez vos informations pour continuer.'}
          </p>

          <form onSubmit={submit} className="auth-form">
            {register && (
              <>
                <div className="input-group">
                  <label htmlFor="matricule">Matricule</label>
                  <input
                    id="matricule"
                    name="matricule"
                    placeholder="XXXX-HF"
                    value={form.matricule}
                    onChange={update}
                    maxLength="10"
                    required />
                </div>
                <div className="form-grid">
                  <div className="input-group">
                    <label htmlFor="nom">Nom</label>
                    <input
                      id="nom"
                      name="nom"
                      placeholder="Rakotosoa"
                      value={form.nom}
                      onChange={update}
                      required />
                  </div>
                  <div className="input-group">
                    <label htmlFor="prenom">Prénoms</label>
                    <input
                      id="prenom"
                      name="prenom"
                      placeholder="Faly Hasy"
                      value={form.prenom}
                      onChange={update}
                      required />
                  </div>
                </div>
              </>
            )}

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="xxxxx@example.com"
                value={form.email}
                onChange={update}
                required />
            </div>

            <div className="input-group">
              <label htmlFor="motDePasse">Mot de passe</label>
              <PasswordField
                id="motDePasse"
                name="motDePasse"
                value={form.motDePasse}
                onChange={update}
                autoComplete={register ? 'new-password' : 'current-password'} />
            </div>

            {!register && (
              <a href="#forgot" className="forgot-password" onClick={e => e.preventDefault()}>
                Avez-vous oublié votre mot de passe?
              </a>
            )}

            {register && (
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="etudiant"
                  checked={form.etudiant}
                  onChange={update} />
                <span className="custom-checkbox"></span>
                <div className="checkbox-text">
                  <strong>Etudiant</strong>
                  <small>Vous êtes étudiant</small>
                </div>
              </label>
            )}

            <button type="submit" className="auth-submit-btn" disabled={busy}>
              {busy ? 'Chargement...' : (register ? 'Créer le compte' : 'Se connecter')}
            </button>
          </form>

          <p className="auth-switch">
            {register ? (
              <>Vous avez déjà un compte, <button className="inline-link" onClick={() => navigate('login')}>se connecter ici.</button></>
            ) : (
              <>Vous n'avez pas encore de compte, <button className="inline-link" onClick={() => navigate('register')}>cliquez ici.</button></>
            )}
          </p>
        </div>
      </section>
    </main>
  );
}
