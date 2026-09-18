import { useEffect, useState } from 'react'
import { api } from './api'
import './styles.css'

const emptyRegistration = { matricule: '', nom: '', prenom: '', email: '', motDePasse: '', etudiant: true }

function formatRelativeDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 30) return "à l'instant"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return date.toLocaleDateString('fr-FR')
}

function Logo() { return <span className="logo" aria-label="Ne-laiko">🌳</span> }
function Avatar({ user, name }) { return <span className="avatar">{user?.prenom?.[0] || name?.[0] || user?.email?.[0] || 'F'}</span> }

function Header({ user, onMenu, onAccount, onLogin }) {
  return <header className="topbar"><button className="menu-button" onClick={onMenu} aria-label="Ouvrir le menu">☰</button><button className="brand-button" onClick={() => onLogin(true)} aria-label="Accueil"><Logo /></button><nav><button className="contact-link">Contact</button>{user ? <button className="profile-trigger" onClick={onAccount}><Avatar user={user} /><span>⌄</span></button> : <button className="login-link" onClick={() => onLogin(false)}>Se connecter</button>}</nav></header>
}

function SideMenu({ open, onClose, onNavigate, onLogin }) {
  if (!open) return null
  return <><div className="menu-backdrop" onClick={onClose} /><aside className="side-menu"><div className="menu-label">Cours</div><strong>Analyse 2</strong><button onClick={() => onNavigate('/study/ai')}>Assistant IA</button><button onClick={() => onNavigate('/study/comments')}>Commentaires</button><button onClick={() => onNavigate('/study/methodology')}>Méthodologie</button><button onClick={() => onNavigate('/study/revision')}>Révision</button><button className="menu-login" onClick={onLogin}>Se connecter</button></aside></>
}

function AccountModal({ user, onClose, onLogout }) {
  return <div className="modal-backdrop" onClick={onClose}><section className="account-modal" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={onClose}>×</button><div className="account-card"><Avatar user={user} /><div><h2>{user?.prenom} {user?.nom}</h2><p>{user?.email}</p></div></div><button className="manage-account"><Logo /> Gérer votre compte <span>⌄</span></button><div className="account-actions"><button>Modifier vos informations personnelles</button><button>Changer d’email</button><button>Changer votre mot de passe</button></div><button className="logout-button" onClick={onLogout}>↪　Se déconnecter</button></section></div>
}

function AuthLayout({ mode, children, onSwitch }) { return <main className="auth-page"><section className="auth-visual"><Logo /><h1>{mode === 'login' ? <>Commencez<br />l’aventure</> : 'Rejoignez-nous'}</h1></section><section className="auth-form"><h1>{mode === 'login' ? 'Se connecter à votre compte' : 'Créer un compte'}</h1><p>Remplissez vos informations pour continuer.</p>{children}<button className="switch-button" onClick={onSwitch}>{mode === 'login' ? 'Créer un compte' : 'J’ai déjà un compte'}</button></section></main> }

function Login({ onRegister, onSuccess, onError }) {
  const [form, setForm] = useState({ email: '', motDePasse: '' }); const [busy, setBusy] = useState(false)
  async function submit(event) { event.preventDefault(); setBusy(true); onError(''); try { const result = await api.auth.login(form); onSuccess(result.utilisateur) } catch (error) { onError(`Connexion impossible : ${error.message}`) } finally { setBusy(false) } }
  return <AuthLayout mode="login" onSwitch={onRegister}><form onSubmit={submit}><label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label><label>Mot de passe<input type="password" value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} required /></label><button className="primary-button" disabled={busy}>{busy ? 'Connexion...' : 'Se connecter'}</button></form></AuthLayout>
}

function Register({ onLogin, onSuccess, onError }) {
  const [form, setForm] = useState(emptyRegistration); const [busy, setBusy] = useState(false)
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  async function submit(event) { event.preventDefault(); setBusy(true); onError(''); try { const { etudiant, ...values } = form; const result = await api.auth.register({ ...values, role: etudiant ? 'ETUDIANT' : 'PROF' }); onSuccess(result.utilisateur) } catch (error) { onError(`Inscription impossible : ${error.message}`) } finally { setBusy(false) } }
  return <AuthLayout mode="register" onSwitch={onLogin}><form onSubmit={submit}><label>Matricule<input name="matricule" value={form.matricule} onChange={update} maxLength="10" required /></label><div className="form-grid"><label>Nom<input name="nom" value={form.nom} onChange={update} required /></label><label>Prénom<input name="prenom" value={form.prenom} onChange={update} required /></label></div><label>Email<input name="email" type="email" value={form.email} onChange={update} required /></label><label>Mot de passe<input name="motDePasse" type="password" minLength="8" value={form.motDePasse} onChange={update} required /></label><button className="primary-button" disabled={busy}>{busy ? 'Création...' : 'Créer le compte'}</button></form></AuthLayout>
}

function CommentsPage({ user, onError }) {
  const [messages, setMessages] = useState([]); const [search, setSearch] = useState(''); const [date, setDate] = useState(''); const [question, setQuestion] = useState(''); const [busy, setBusy] = useState(false); const [, refresh] = useState(0)
  async function load() { try { setMessages(await api.messages.list({ q: search, from: date })) } catch (error) { onError(`Chargement impossible : ${error.message}`) } }
  useEffect(() => { load() }, [search, date])
  useEffect(() => { const timer = setInterval(() => refresh((value) => value + 1), 60000); return () => clearInterval(timer) }, [])
  async function publish(event) { event.preventDefault(); if (!user) return onError('Connectez-vous pour publier une question.'); if (!question.trim()) return; setBusy(true); try { await api.messages.create({ objet: 'Question', contenu: question.trim(), envoyeur: { matricule: user.matricule } }); setQuestion(''); await load() } catch (error) { onError(`Publication impossible : ${error.message}`) } finally { setBusy(false) } }
  return <main className="comments-page"><div className="page-heading"><h1>Commentaires</h1><p>Analyse 2 - Échangez avec la communauté</p></div><div className="comments-toolbar"><div className="search-box">⌕<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher des discussions..." /></div><label className="date-filter">Filtrer par date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label></div><form className="question-box" onSubmit={publish}><strong>Poser une question</strong><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Écrivez votre question ou commentaire..." rows="4" /><div className="question-actions"><span className="attachment">⌕</span><button className="publish-button" disabled={busy}>{busy ? 'Publication...' : 'Publier'}</button></div></form><section className="discussion-list">{messages.length === 0 ? <p className="empty-state">Aucune discussion trouvée.</p> : messages.filter((message) => message.statut !== 'MASQUE' && message.statut !== 'SUPPRIME').map((message) => <article className="discussion-card" key={message.id}><div className="discussion-author"><Avatar name={message.envoyeur?.prenom} /><div><strong>{message.envoyeur?.prenom || 'Utilisateur'} {message.envoyeur?.nom || ''}</strong><span className="role-badge">{message.envoyeur?.role === 'PROF' ? 'Professeur' : 'Étudiant'}</span><small>{formatRelativeDate(message.dateDePublication)}</small></div></div><p>{message.contenu}</p><span className="replies">0 réponses</span></article>)}</section></main>
}

function StudySpace({ onComments }) { const cards = [['☷', 'Méthodologie', 'Suivez votre progression étape par étape.'], ['◯', 'Assistant IA', "Posez vos questions à l'assistant intelligent."], ['◯', 'Commentaires', 'Échangez avec étudiants et professeurs.'], ['◯', 'Révision', 'Repassez un examen pour voir où vous en êtes actuellement.']]; return <main className="study-space"><h1>Espace d'étude</h1><p>Analyse 2 - Répétition espacée</p><section className="study-grid">{cards.map(([icon, title, description]) => <button className="study-card" onClick={title === 'Commentaires' ? onComments : undefined} key={title}><span className="study-icon">{icon}</span><h2>{title}</h2><span>{description}</span></button>)}</section></main> }
function Footer() { return <footer><Logo /><div><strong>Cas d'utilisation</strong><span>Apprentissage</span><span>Compréhension des sujets</span><span>Allègement des enseignements</span></div><div><strong>Explorations</strong><span>Methodologies d’apprentissage</span><span>Cours, cursus</span></div><div><strong>Ressources</strong><span>Assistant IA</span><span>Forum étudiants-professeurs</span><span>Aide</span></div></footer> }
function ErrorModal({ message, onClose }) { return <div className="modal-backdrop"><section className="error-modal"><h2>Une erreur est survenue</h2><p>{message}</p><button className="primary-button" onClick={onClose}>Fermer</button></section></div> }

export default function App() {
  const route = window.location.pathname
  const initialScreen = route === '/study/comments' ? 'comments' : route === '/login' ? 'login' : route === '/register' ? 'register' : 'study'
  const [screen, setScreen] = useState(initialScreen); const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } }); const [menu, setMenu] = useState(false); const [account, setAccount] = useState(false); const [error, setError] = useState('')
  useEffect(() => { const onPopState = () => { const path = window.location.pathname; setScreen(path === '/study/comments' ? 'comments' : path === '/login' ? 'login' : path === '/register' ? 'register' : 'study') }; window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState) }, [])
  function navigate(path) { if (window.location.pathname !== path) window.history.pushState({}, '', path); setMenu(false); setScreen(path === '/study/comments' ? 'comments' : path === '/login' ? 'login' : path === '/register' ? 'register' : 'study') }
  function loggedIn(nextUser) { setUser(nextUser); localStorage.setItem('user', JSON.stringify(nextUser)); navigate('/study') }
  function logout() { setUser(null); localStorage.removeItem('user'); setAccount(false); navigate('/study') }
  return <div className="app"><Header user={user} onMenu={() => setMenu(true)} onAccount={() => setAccount(true)} onLogin={(home) => navigate(home ? '/study' : '/login')} /><SideMenu open={menu} onClose={() => setMenu(false)} onNavigate={navigate} onLogin={() => navigate('/login')} />{screen === 'login' && <Login onRegister={() => navigate('/register')} onSuccess={loggedIn} onError={setError} />}{screen === 'register' && <Register onLogin={() => navigate('/login')} onSuccess={loggedIn} onError={setError} />}{screen === 'study' && <><StudySpace onComments={() => navigate('/study/comments')} /><Footer /></>}{screen === 'comments' && <CommentsPage user={user} onError={setError} />}{account && <AccountModal user={user} onClose={() => setAccount(false)} onLogout={logout} />}{error && <ErrorModal message={error} onClose={() => setError('')} />}</div>
}
