import { useEffect, useState } from 'react'
import { api } from './api'
import './styles.css'

const BASE = '/Ne-laiko'
const emptyRegistration = { matricule: '', nom: '', prenom: '', email: '', motDePasse: '', etudiant: true }

function pathToScreen(path = window.location.pathname) {
  const clean = path.replace(/\/$/, '') || '/'
  if (clean === `${BASE}/login` || clean === '/login') return 'login'
  if (clean === `${BASE}/register` || clean === '/register') return 'register'
  if (clean === `${BASE}/study/comments` || clean === '/study/comments') return 'comments'
  if (clean === `${BASE}/study` || clean === '/study') return 'study'
  return 'home'
}

function relativeDate(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return ''
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 30) return "à l'instant"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return days < 7 ? `il y a ${days} j` : date.toLocaleDateString('fr-FR')
}

function Logo() { return <span className="logo" aria-label="Ne-laiko">🌳</span> }
function Avatar({ user, name = 'F' }) { return <span className="avatar">{user?.prenom?.[0] || name[0] || 'F'}</span> }

function Header({ user, navigate, onMenu, onAccount, screen }) {
  const isHome = screen === 'home'
  return <header className="topbar"><button className="menu-button" onClick={onMenu}>☰</button><button className="brand-button" onClick={() => navigate('home')}><Logo /></button><nav><button className="contact-link">Contact</button>{user ? <button className="profile-trigger" onClick={onAccount}><Avatar user={user} /><span>⌄</span></button> : <>{isHome ? <button className="register-link" onClick={() => navigate('register')}>S'inscrire</button> : null}<button className="login-link" onClick={() => navigate('login')}>{isHome ? 'Se connecter' : 'Se connecter'}</button></>}</nav></header>
}

function Menu({ open, close, navigate }) {
  if (!open) return null
  return <><div className="menu-backdrop" onClick={close}/><aside className="side-menu"><div className="menu-label">Cours</div><strong>Analyse 2</strong><button onClick={() => navigate('study')}>Assistant IA</button><button onClick={() => navigate('comments')}>Commentaires</button><button onClick={() => navigate('study')}>Méthodologie</button><button onClick={() => navigate('study')}>Révision</button></aside></>
}

function Home({ navigate }) {
  return <><section className="welcome-hero"><div className="hero-content"><Logo /><h1>Bienvenue sur Ne-laiko</h1><p>La clé de votre réussite<br/>universitaire avant tout</p><button className="primary-button" onClick={() => navigate('login')}>Commencer</button></div></section><Footer/></>
}

function Footer() { return <footer><Logo/><div><strong>Cas d'utilisation</strong><span>Apprentissage</span><span>Compréhension des sujets</span><span>Allègement des enseignements</span><span>Plus sur la pratique</span></div><div><strong>Explorations</strong><span>Methodologies d’apprentissage</span><span>Cours, cursus</span></div><div><strong>Ressources</strong><span>Assistant IA</span><span>Forum étudiants-professeurs</span><span>Aide</span></div></footer> }

function Auth({ mode, navigate, onSuccess, onError }) {
  const register = mode === 'register'; const [form, setForm] = useState(register ? emptyRegistration : { email: '', motDePasse: '' }); const [busy, setBusy] = useState(false)
  const update = e => setForm({ ...form, [e.target.name]: e.target.value })
  async function submit(e) { e.preventDefault(); setBusy(true); onError(''); try { const result = register ? await api.auth.register({ matricule: form.matricule, nom: form.nom, prenom: form.prenom, email: form.email, motDePasse: form.motDePasse, role: form.etudiant ? 'ETUDIANT' : 'PROF' }) : await api.auth.login({ email: form.email, motDePasse: form.motDePasse }); onSuccess(result?.utilisateur || result) } catch (error) { onError(`${register ? 'Inscription' : 'Connexion'} impossible : ${error.message}`) } finally { setBusy(false) } }
  return <main className="auth-page"><section className="auth-visual"><Logo/><h1>{register ? 'Rejoignez-nous' : <>Commencez<br/>l’aventure</>}</h1></section><section className="auth-form"><h1>{register ? 'Créer un compte' : 'Se connecter à votre compte'}</h1><p>Remplissez vos informations pour continuer.</p><form onSubmit={submit}>{register && <><label>Matricule<input name="matricule" value={form.matricule} onChange={update} maxLength="10" required/></label><div className="form-grid"><label>Nom<input name="nom" value={form.nom} onChange={update} required/></label><label>Prénom<input name="prenom" value={form.prenom} onChange={update} required/></label></div></>}<label>Email<input name="email" type="email" value={form.email} onChange={update} required/></label><label>Mot de passe<input name="motDePasse" type="password" minLength="8" value={form.motDePasse} onChange={update} required/></label>{register && <label className="check-row"><input type="checkbox" name="etudiant" checked={form.etudiant} onChange={e => setForm({ ...form, etudiant: e.target.checked })}/><span>Étudiant</span></label>}<button className="primary-button" disabled={busy}>{busy ? 'Chargement...' : register ? 'Créer le compte' : 'Se connecter'}</button></form><button className="switch-button" onClick={() => navigate(register ? 'login' : 'register')}>{register ? 'J’ai déjà un compte' : 'Créer un compte'}</button></section></main>
}

function Study({ navigate }) { const cards = [['☷','Méthodologie','Suivez votre progression étape par étape.'],['◯','Assistant IA',"Posez vos questions à l'assistant intelligent."],['◯','Commentaires','Échangez avec étudiants et professeurs.'],['◯','Révision','Repassez un examen pour voir où vous en êtes actuellement.']]; return <><main className="study-space"><h1>Espace d'étude</h1><p>Analyse 2 - Répétition espacée</p><section className="study-grid">{cards.map(([icon,title,text]) => <button className="study-card" key={title} onClick={() => title === 'Commentaires' && navigate('comments')}><span className="study-icon">{icon}</span><h2>{title}</h2><span>{text}</span></button>)}</section></main><Footer/></> }

function Comments({ user, onError }) { const [messages,setMessages]=useState([]); const [search,setSearch]=useState(''); const [question,setQuestion]=useState(''); const [tick,setTick]=useState(0); useEffect(() => { api.messages.list({ q: search }).then(setMessages).catch(e => onError(e.message)) }, [search, tick]); useEffect(() => { const t=setInterval(() => setTick(v=>v+1),60000); return () => clearInterval(t) }, []); async function publish(e) { e.preventDefault(); if (!user) return onError('Connectez-vous pour publier.'); if (!question.trim()) return; try { await api.messages.create({ objet:'Question', contenu:question.trim(), envoyeur:{ matricule:user.matricule } }); setQuestion(''); setTick(v=>v+1) } catch(e) { onError(e.message) } } return <><main className="comments-page"><div className="page-heading"><h1>Commentaires</h1><p>Analyse 2 - Échangez avec la communauté</p></div><div className="comments-toolbar"><div className="search-box">⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher des discussions..."/></div></div><form className="question-box" onSubmit={publish}><strong>Poser une question</strong><textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Écrivez votre question ou commentaire..." rows="4"/><div className="question-actions"><button className="publish-button">Publier</button></div></form>{messages.filter(m=>!['MASQUE','SUPPRIME'].includes(m.statut)).map(m=><article className="discussion-card" key={m.id}><div className="discussion-author"><Avatar name={m.envoyeur?.prenom}/><div><strong>{m.envoyeur?.prenom || 'Utilisateur'} {m.envoyeur?.nom || ''}</strong><small>{relativeDate(m.dateDePublication)}</small></div></div><p>{m.contenu}</p><span className="replies">0 réponses</span></article>)}</main><Footer/></> }

function Account({ user, close, logout }) { return <div className="modal-backdrop" onClick={close}><section className="account-modal" onClick={e=>e.stopPropagation()}><button className="close-button" onClick={close}>×</button><div className="account-card"><Avatar user={user}/><div><h2>{user?.prenom} {user?.nom}</h2><p>{user?.email}</p></div></div><button className="logout-button" onClick={logout}>↪　Se déconnecter</button></section></div> }
function ErrorModal({ message, close }) { return <div className="modal-backdrop"><section className="error-modal"><h2>Une erreur est survenue</h2><p>{message}</p><button className="primary-button" onClick={close}>Fermer</button></section></div> }

export default function App() { const [screen,setScreen]=useState(pathToScreen()); const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('user'))}catch{return null}}); const [menu,setMenu]=useState(false); const [account,setAccount]=useState(false); const [error,setError]=useState(''); useEffect(()=>{const f=()=>setScreen(pathToScreen()); addEventListener('popstate',f); return()=>removeEventListener('popstate',f)},[]); function navigate(next){const path=next==='home'?`${BASE}/`:next==='login'?`${BASE}/login`:next==='register'?`${BASE}/register`:next==='comments'?`${BASE}/study/comments`:`${BASE}/study`; history.pushState({},'',path); setScreen(next); setMenu(false)} function success(next){setUser(next);localStorage.setItem('user',JSON.stringify(next));navigate('study')} function logout(){setUser(null);localStorage.removeItem('user');setAccount(false);navigate('home')} return <div className="app"><Header user={user} navigate={navigate} onMenu={()=>setMenu(true)} onAccount={()=>setAccount(true)} screen={screen}/><Menu open={menu} close={()=>setMenu(false)} navigate={navigate}/>{screen==='home'&&<Home navigate={navigate}/>} {screen==='login'&&<Auth mode="login" navigate={navigate} onSuccess={success} onError={setError}/>} {screen==='register'&&<Auth mode="register" navigate={navigate} onSuccess={success} onError={setError}/>} {screen==='study'&&<Study navigate={navigate}/>} {screen==='comments'&&<Comments user={user} onError={setError}/>} {account&&<Account user={user} close={()=>setAccount(false)} logout={logout}/>} {error&&<ErrorModal message={error} close={()=>setError('')}/>}</div> }
