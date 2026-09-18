import { useEffect, useState } from 'react'
import { api } from './api'
import './styles.css'

const emptyRegistration = {
  matricule: '', nom: '', prenom: '', email: '', motDePasse: '', etudiant: true,
}

function BrandMark() {
  return <span className="brand-mark" aria-label="Ne-laiko"><span>✦</span><i>Y</i></span>
}

function Shell({ children, onHome, onRegister }) {
  return <div className="site-shell">
    {children}
  </div>
}

function Home({ onLogin }) {
  return <>
    <section className="welcome-hero"><div className="hero-content"><h1>Bienvenue sur Ne-laiko</h1><p>La clé de votre réussite<br />universitaire avant tout</p><button onClick={onLogin}>Commencer</button></div></section>
    <footer className="home-footer">
      <div className="footer-brand"><BrandMark /><div className="footer-icons"><span aria-label="Téléphone">⌕</span><span aria-label="Email">✉</span></div></div>
      <FooterColumn title="Cas d'utilisation" items={['Apprentissage', 'Compréhension des sujets', 'Allègement des enseignements', 'Plus sur la pratique']} />
      <FooterColumn title="Explorations" items={["Méthodologies d’apprentissage", 'Cours, cursus']} />
      <FooterColumn title="Ressources" items={['Assistant IA', 'Forum étudiants-professeurs', 'Plateforme d’examen en ligne', 'Plateforme d’étude en ligne', 'Aide']} />
    </footer>
  </>
}

function FooterColumn({ title, items }) {
  return <div className="footer-column"><strong>{title}</strong>{items.map((item) => <span key={item}>{item}</span>)}</div>
}

function EyeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.1 12s3.6-6 9.9-6 9.9 6 9.9 6-3.6 6-9.9 6-9.9-6-9.9-6Z" /><circle cx="12" cy="12" r="2.7" /></svg>
}

function EyeOffIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 6.2A10.2 10.2 0 0 1 12 6c6.3 0 9.9 6 9.9 6a16.7 16.7 0 0 1-3.1 3.5M6.2 6.8C3.5 8.5 2.1 12 2.1 12s3.6 6 9.9 6c1.1 0 2.1-.2 3-.5" /></svg>
}

function PasswordField({ name, value, onChange }) {
  const [visible, setVisible] = useState(false)
  return <div className="password-field"><input name={name} type={visible ? 'text' : 'password'} placeholder="••••••••••" value={value} onChange={onChange} required /><button className="password-toggle" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{visible ? <EyeIcon /> : <EyeOffIcon />}</button></div>
}

function AuthLayout({ title, subtitle, children, mode, onSwitch }) {
  return <main className="auth-page"><section className="auth-visual"><div className="visual-copy"><BrandMark /><h1>{mode === 'login' ? <>Commencez<br />l’aventure</> : 'Rejoignez-nous'}</h1><p>{mode === 'login' ? 'Grâce à Ne-laiko, vos soucis sur l’accessibilité et la compréhension des études sont épargnés.' : 'Accédez vos cours, demandez de l’aide au professeur ou via l’assistant IA et entraînez-vous sur notre plateforme d’apprentissage Ne-laiko.'}</p></div></section><section className="auth-form-wrap"><div className="auth-form"><h2>{title}</h2><p className="form-intro">{subtitle}</p>{children}<button className="switch-auth" onClick={onSwitch}>{mode === 'login' ? "Vous n’avez pas encore de compte, cliquez ici." : 'Vous avez déjà un compte ? Se connecter'}</button></div></section></main>
}

function Login({ onRegister, onSuccess, onError }) {
  const [form, setForm] = useState({ email: '', motDePasse: '', etudiant: true })
  const [busy, setBusy] = useState(false)
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  async function submit(event) {
    event.preventDefault(); setBusy(true); onError('')
    try {
      try { await api.auth.login({ email: form.email, motDePasse: form.motDePasse }) }
      catch (authError) {
        const users = await api.users.list()
        const user = users.find((item) => item.email === form.email && (item.motDePasse === form.motDePasse || item.password === form.motDePasse))
        if (!user) throw authError
      }
      onSuccess()
    } catch (error) { onError(`Connexion impossible : ${error.message}`) } finally { setBusy(false) }
  }
  return <AuthLayout mode="login" title="Se connecter à votre compte" subtitle="Remplissez vos informations pour continuer." onSwitch={onRegister}><form onSubmit={submit}>
    <label>Email<input name="email" type="email" placeholder="xxxxx@example.com" value={form.email} onChange={update} required /></label>
    <label>Mot de passe<PasswordField name="motDePasse" value={form.motDePasse} onChange={update} /></label>
    <button className="forgot" type="button">Avez-vous oublié votre mot de passe?</button>
    <label className="check-row"><input type="checkbox" checked={form.etudiant} onChange={(event) => setForm({ ...form, etudiant: event.target.checked })} /><span><b>Etudiant</b><small>Vous êtes étudiant</small></span></label>
    <button className="primary" disabled={busy}>{busy ? 'Connexion...' : 'Se connecter'}</button>
  </form></AuthLayout>
}

function Register({ onLogin, onSuccess, onError }) {
  const [form, setForm] = useState(emptyRegistration); const [busy, setBusy] = useState(false)
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  async function submit(event) {
    event.preventDefault(); setBusy(true); onError('')
    try {
      const { etudiant, ...values } = form
      await api.auth.register({ ...values, role: etudiant ? 'Etudiant' : 'Utilisateur', type: etudiant ? 'Etudiant' : 'Utilisateur', dateInscription: new Date().toISOString().slice(0, 10) })
      onSuccess()
    } catch (error) { onError(`Inscription impossible : ${error.message}`) } finally { setBusy(false) }
  }
  return <AuthLayout mode="register" title="Créer un compte" subtitle="Remplissez vos informations pour commencer." onSwitch={onLogin}><form onSubmit={submit}>
    <label>Matricule<input name="matricule" placeholder="XXXX-HE" value={form.matricule} onChange={update} required /></label>
    <div className="form-grid"><label>Nom<input name="nom" placeholder="Rakotosoa" value={form.nom} onChange={update} required /></label><label>Prénoms<input name="prenom" placeholder="Faly Hasy" value={form.prenom} onChange={update} required /></label></div>
    <label>Email<input name="email" type="email" placeholder="xxxxx@example.com" value={form.email} onChange={update} required /></label>
    <label>Mot de passe<PasswordField name="motDePasse" value={form.motDePasse} onChange={update} /></label>
    <label className="check-row"><input type="checkbox" checked={form.etudiant} onChange={(event) => setForm({ ...form, etudiant: event.target.checked })} /><span><b>Etudiant</b><small>Vous êtes étudiant</small></span></label>
    <button className="primary" disabled={busy}>{busy ? 'Création...' : 'Créer le compte'}</button>
  </form></AuthLayout>
}

function SuccessModal({ type, onContinue }) {
  const registration = type === 'register'
  return <div className="modal-backdrop"><div className="success-modal"><div className="success-icon">✓</div><h2>{registration ? 'Inscription terminée' : 'Connexion réussie'}</h2><p>{registration ? 'Merci d’être inscrit à Ne-laiko' : 'Vous pouvez passer à l’étape suivante'}</p><button onClick={onContinue}>{registration ? 'Continuer' : 'Ok'}</button></div></div>
}

function ErrorModal({ message, onClose }) {
  return <div className="modal-backdrop"><div className="error-modal" role="alertdialog" aria-modal="true" aria-labelledby="error-title"><div className="error-icon">!</div><h2 id="error-title">Une erreur est survenue</h2><p>{message}</p><button onClick={onClose}>Ok</button></div></div>
}

function App() {
  const basePath = '/Ne-laiko'
  const routeToScreen = (path) => path === `${basePath}/login` ? 'login' : path === `${basePath}/register` ? 'register' : 'home'
  const [screen, setScreen] = useState(() => routeToScreen(window.location.pathname)); const [modal, setModal] = useState(''); const [error, setError] = useState('')
  useEffect(() => {
    const handlePopState = () => { setError(''); setScreen(routeToScreen(window.location.pathname)) }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  const show = (next) => {
    const path = next === 'login' ? `${basePath}/login` : next === 'register' ? `${basePath}/register` : `${basePath}/`
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setError(''); setScreen(next)
  }
  return <Shell>
    {screen === 'home' && <><header className="topbar"><button className="brand" onClick={() => show('home')} aria-label="Retour à l'accueil"><BrandMark /></button><nav><button className="nav-link" onClick={() => window.alert('Contactez-nous à contact@ne-laiko.fr')}>Contact</button><button className="signup-small" onClick={() => show('register')}>S'inscrire</button></nav></header><Home onLogin={() => show('login')} /></>}
    {screen === 'login' && <Login onRegister={() => show('register')} onSuccess={() => setModal('login')} onError={setError} />}
    {screen === 'register' && <Register onLogin={() => show('login')} onSuccess={() => setModal('register')} onError={setError} />}
    {modal && <SuccessModal type={modal} onContinue={() => { const current = modal; setModal(''); show(current === 'register' ? 'login' : 'home') }} />}
    {error && <ErrorModal message={error} onClose={() => setError('')} />}
  </Shell>
}

export default App
