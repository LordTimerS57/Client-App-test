import { useEffect, useState } from 'react'
import './styles.css'

// Fallback Mock API if ./api is unavailable or offline
let externalApi = null
try {
  const mod = await import('./api')
  externalApi = mod.api || mod.default
} catch {
  externalApi = null
}

const mockStore = {
  getUsers: () => JSON.parse(localStorage.getItem('nl_users') || '[]'),
  saveUsers: (u) => localStorage.setItem('nl_users', JSON.stringify(u)),
  getMessages: () => JSON.parse(localStorage.getItem('nl_messages') || '[]'),
  saveMessages: (m) => localStorage.setItem('nl_messages', JSON.stringify(m))
}

const api = {
  auth: {
    async login({ email, motDePasse }) {
      if (externalApi?.auth?.login) {
        try { return await externalApi.auth.login({ email, motDePasse }) } catch (e) { /* fallback */ }
      }
      const users = mockStore.getUsers()
      const user = users.find(u => u.email === email && u.motDePasse === motDePasse)
      if (user) return { utilisateur: user }
      // Default demo login if not registered yet
      if (email && motDePasse) {
        const demoUser = { matricule: '1024-HF', nom: 'Rakotosoa', prenom: 'Faly Hasy', email, role: 'ETUDIANT' }
        return { utilisateur: demoUser }
      }
      throw new Error('Identifiants incorrects')
    },
    async register(data) {
      if (externalApi?.auth?.register) {
        try { return await externalApi.auth.register(data) } catch (e) { /* fallback */ }
      }
      const users = mockStore.getUsers()
      if (users.some(u => u.email === data.email)) {
        throw new Error('Un compte existe déjà avec cet email.')
      }
      const newUser = { ...data, id: Date.now().toString() }
      users.push(newUser)
      mockStore.saveUsers(users)
      return { utilisateur: newUser }
    }
  },
  messages: {
    async list({ q } = {}) {
      if (externalApi?.messages?.list) {
        try { return await externalApi.messages.list({ q }) } catch (e) { /* fallback */ }
      }
      let msgs = mockStore.getMessages()
      if (q) {
        const term = q.toLowerCase()
        msgs = msgs.filter(m => (m.contenu || '').toLowerCase().includes(term))
      }
      return msgs
    },
    async create(msgData) {
      if (externalApi?.messages?.create) {
        try { return await externalApi.messages.create(msgData) } catch (e) { /* fallback */ }
      }
      const msgs = mockStore.getMessages()
      const newMsg = {
        id: Date.now().toString(),
        contenu: msgData.contenu,
        dateDePublication: new Date().toISOString(),
        envoyeur: msgData.envoyeur || { prenom: 'Utilisateur', role: 'Étudiant' },
        replies: []
      }
      msgs.unshift(newMsg)
      mockStore.saveMessages(msgs)
      return newMsg
    }
  }
}

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

function Logo({ className = "logo-svg" }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 78C42 78 35 84 28 88C35 82 45 78 50 78Z" fill="#2E6B34" />
      <path d="M50 78C58 78 65 84 72 88C65 82 55 78 50 78Z" fill="#1D8A8D" />
      <path d="M50 78C48 83 40 92 32 94C42 90 47 84 50 78Z" fill="#3D2314" />
      <path d="M50 78C52 83 60 92 68 94C58 90 53 84 50 78Z" fill="#A8322D" />
      <path d="M46 54C46 54 44 68 38 78C44 78 48 72 50 66C52 72 56 78 62 78C56 68 54 54 54 54H46Z" fill="#523219" />
      <circle cx="50" cy="22" r="9" fill="#EFA020" />
      <circle cx="36" cy="28" r="8.5" fill="#E05B26" />
      <circle cx="64" cy="28" r="8.5" fill="#F4C430" />
      <circle cx="25" cy="38" r="8" fill="#C8372D" />
      <circle cx="75" cy="38" r="8" fill="#88B04B" />
      <circle cx="21" cy="52" r="7.5" fill="#1D8A8D" />
      <circle cx="79" cy="52" r="7.5" fill="#2E6B34" />
      <circle cx="33" cy="46" r="9.5" fill="#D94125" />
      <circle cx="67" cy="46" r="9.5" fill="#2A8B88" />
      <circle cx="50" cy="38" r="11" fill="#E58A13" />
      <circle cx="41" cy="52" r="8" fill="#A42921" />
      <circle cx="59" cy="52" r="8" fill="#1B6063" />
    </svg>
  )
}

function Avatar({ user, name = 'F' }) { 
  const letter = user?.prenom?.[0] || name[0] || 'F'
  return <span className="avatar">{letter}</span> 
}

function Header({ user, navigate, onMenu, onAccount, screen }) {
  const isHome = screen === 'home'
  return (
    <header className="topbar">
      {!isHome && (
        <button className="menu-button" onClick={onMenu} title="Menu">
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 2H19M1 8H19M1 14H19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
      <button className="brand-button" onClick={() => navigate('home')}>
        <Logo className="header-logo" />
      </button>
      <nav className="header-nav">
        <button className="contact-link">Contact</button>
        {user ? (
          <button className="profile-trigger" onClick={onAccount}>
            <Avatar user={user} />
            <span className="chevron-down">⌄</span>
          </button>
        ) : isHome ? (
          <button className="register-link" onClick={() => navigate('register')}>S'inscrire</button>
        ) : (
          <button className="login-link" onClick={() => navigate('login')}>Se connecter</button>
        )}
      </nav>
    </header>
  )
}

function Menu({ open, close, navigate }) {
  if (!open) return null
  return (
    <>
      <div className="menu-backdrop" onClick={close}/>
      <aside className="side-menu">
        <div className="menu-header">
          <span className="menu-label">Cours</span>
          <strong>Analyse 2</strong>
        </div>
        <nav className="menu-links">
          <button onClick={() => navigate('study')}>Assistant IA</button>
          <button onClick={() => navigate('comments')}>Commentaires</button>
          <button onClick={() => navigate('study')}>Méthodologie</button>
          <button onClick={() => navigate('study')}>Révision</button>
        </nav>
      </aside>
    </>
  )
}

function Home({ navigate }) {
  return (
    <>
      <section className="welcome-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Bienvenue sur Ne-laiko</h1>
          <p>La clé de votre réussite<br/>universitaire avant tout</p>
          <button className="hero-button" onClick={() => navigate('login')}>Commencer</button>
        </div>
      </section>
      <Footer/>
    </>
  )
}

function Footer() { 
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Logo className="footer-logo" />
          <div className="contact-icons">
            <span className="contact-icon" title="Téléphone">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </span>
            <span className="contact-icon" title="Email">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
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
          <span>Méthodologies d’apprentissage</span>
          <span>Cours, cursus</span>
        </div>
        
        <div className="footer-col">
          <strong>Ressources</strong>
          <span>Assistant IA</span>
          <span>Forum étudiants-professeurs</span>
          <span>Plateforme d’examen en ligne</span>
          <span>Plateforme d’étude en ligne</span>
          <span>Aide</span>
        </div>
      </div>
    </footer> 
  )
}

function Auth({ mode, navigate, onSuccess, onError }) {
  const register = mode === 'register'
  const [form, setForm] = useState(
    register 
      ? { ...emptyRegistration, etudiant: true } 
      : { email: '', motDePasse: '', etudiant: true }
  )
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  const update = e => setForm({ 
    ...form, 
    [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value 
  })

  async function submit(e) { 
    e.preventDefault()
    setBusy(true)
    onError('')
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
          })
      onSuccess(result?.utilisateur || result) 
    } catch (error) { 
      onError(`${register ? 'Inscription' : 'Connexion'} impossible : ${error.message}`) 
    } finally { 
      setBusy(false) 
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
          <p>Grace à Ne-laiko, vos soucis sur l'accessibilité et la compréhension des études sont épargnez.</p>
        </div>
      </section>

      <section className="auth-form-container">
        <div className="auth-form-wrapper">
          <h1>{register ? 'Créer un compte' : 'Se connecter à votre compte'}</h1>
          <p className="auth-subtitle">Remplissez vos informations pour continuer.</p>

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
                    required
                  />
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
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="prenom">Prénoms</label>
                    <input 
                      id="prenom"
                      name="prenom" 
                      placeholder="Faly Hasy" 
                      value={form.prenom} 
                      onChange={update} 
                      required
                    />
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
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="motDePasse">Mot de passe</label>
              <div className="password-field">
                <input 
                  id="motDePasse"
                  name="motDePasse" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="**********" 
                  value={form.motDePasse} 
                  onChange={update} 
                  required
                />
                <button 
                  type="button" 
                  className="eye-toggle" 
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Afficher ou masquer le mot de passe"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {showPassword ? (
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {!register && (
              <a href="#forgot" className="forgot-password" onClick={e => e.preventDefault()}>
                Avez-vous oublié votre mot de passe?
              </a>
            )}

            <label className="checkbox-row">
              <input 
                type="checkbox" 
                name="etudiant" 
                checked={form.etudiant} 
                onChange={update}
              />
              <span className="custom-checkbox"></span>
              <div className="checkbox-text">
                <strong>Etudiant</strong>
                <small>Vous êtes étudiant</small>
              </div>
            </label>

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
  )
}

function Study({ navigate }) { 
  const cards = [
    {
      id: 'methodology',
      title: 'Méthodologie',
      text: 'Suivez votre progression étape par étape.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
      )
    },
    {
      id: 'assistant',
      title: 'Assistant IA',
      text: 'Posez vos questions à l\'assistant intelligent.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )
    },
    {
      id: 'comments',
      title: 'Commentaires',
      text: 'Échangez avec étudiants et professeurs.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )
    },
    {
      id: 'revision',
      title: 'Révision',
      text: 'Repassez un examen pour voir où vous en êtes actuellement.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )
    }
  ]

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
      <Footer/>
    </>
  ) 
}

function Comments({ user, onError }) { 
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [question, setQuestion] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => { 
    api.messages.list({ q: search })
      .then(setMessages)
      .catch(e => onError(e.message)) 
  }, [search, tick])

  useEffect(() => { 
    const t = setInterval(() => setTick(v => v + 1), 60000)
    return () => clearInterval(t) 
  }, [])

  async function publish(e) { 
    e.preventDefault()
    if (!user) return onError('Connectez-vous pour publier.')
    if (!question.trim()) return
    try { 
      await api.messages.create({ 
        objet: 'Question', 
        contenu: question.trim(), 
        envoyeur: { prenom: user.prenom || 'Vous', matricule: user.matricule } 
      })
      setQuestion('')
      setTick(v => v + 1) 
    } catch(e) { 
      onError(e.message) 
    } 
  }

  const defaultDiscussions = [
    {
      id: 'demo-1',
      author: { prenom: 'Vous', role: 'Étudiant', isUser: true },
      date: 'maintenant',
      content: "Quelqu'un peut m'expliquer la marche à suivre pour le changement de variables avec les intégrales doubles",
      repliesCount: 0,
      replies: []
    },
    {
      id: 'demo-2',
      author: { prenom: 'Marie Leclerc', role: 'Étudiante', initials: 'ML' },
      date: 'il y a 2h',
      content: "Quelqu'un peut m'expliquer la différence entre intégrale simple et double ?",
      repliesCount: 2,
      replies: [
        {
          id: 'reply-1',
          author: { prenom: 'Prof. Dubois', role: 'Professeur', initials: 'PD', isProf: true },
          date: 'il y a 1h',
          content: "L'intégrale simple est utilisée pour calculer l'aire sous une courbe dans un plan 2D, tandis que l'intégrale double est utilisée pour des volumes dans l'espace 3D."
        }
      ]
    }
  ]

  const displayList = messages.length > 0 ? messages : defaultDiscussions

  return (
    <>
      <main className="comments-page">
        <div className="comments-header">
          <h1>Commentaires</h1>
          <p>Analyse 2 - Échangez avec la communauté</p>
        </div>

        <div className="comments-toolbar">
          <div className="search-input-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8896A6" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Rechercher des discussions..."
            />
          </div>
          <button className="filter-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="6" y1="12" x2="18" y2="12"/>
              <line x1="8" y1="18" x2="16" y2="18"/>
            </svg>
            <span>Filtrer</span>
          </button>
        </div>

        <form className="question-box" onSubmit={publish}>
          <h3>Poser une question</h3>
          <textarea 
            value={question} 
            onChange={e => setQuestion(e.target.value)} 
            placeholder="Écrivez votre question ou commentaire..." 
            rows="4"
          />
          <div className="question-actions">
            <button type="button" className="attach-btn" title="Joindre un fichier">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <button type="submit" className="publish-button">Publier</button>
          </div>
        </form>

        <section className="discussions-list">
          {displayList.map(item => {
            const authorName = item.author ? item.author.prenom : (item.envoyeur?.prenom || 'Utilisateur')
            const authorRole = item.author ? item.author.role : 'Étudiant'
            const initials = item.author?.initials || authorName[0]
            const timeText = item.date || relativeDate(item.dateDePublication)
            const replies = item.replies || []

            return (
              <article className="discussion-card" key={item.id}>
                <div className="discussion-author">
                  <span className="discussion-avatar">{initials}</span>
                  <div className="author-details">
                    <div className="author-title">
                      <strong>{authorName}</strong>
                      <span className="role-badge">{authorRole}</span>
                    </div>
                    <small className="time-ago">{timeText}</small>
                  </div>
                </div>

                <p className="discussion-content">{item.contenu || item.content}</p>

                {replies.length > 0 && (
                  <div className="replies-container">
                    {replies.map(reply => (
                      <div className="reply-card" key={reply.id}>
                        <div className="discussion-author">
                          <span className="discussion-avatar prof-avatar">{reply.author.initials}</span>
                          <div className="author-details">
                            <div className="author-title">
                              <strong>{reply.author.prenom}</strong>
                              <span className="role-badge prof-badge">{reply.author.role}</span>
                            </div>
                            <small className="time-ago">{reply.date}</small>
                          </div>
                        </div>
                        <p className="reply-content">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="discussion-footer">
                  <span className="replies-count">
                    {item.repliesCount ?? replies.length} réponses
                  </span>
                </div>
              </article>
            )
          })}
        </section>
      </main>
      <Footer/>
    </>
  ) 
}

function Account({ user, close, logout }) { 
  return (
    <div className="modal-backdrop" onClick={close}>
      <section className="account-modal" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={close}>×</button>
        <div className="account-card">
          <Avatar user={user}/>
          <div>
            <h2>{user?.prenom} {user?.nom}</h2>
            <p>{user?.email}</p>
          </div>
        </div>
        <button className="logout-button" onClick={logout}>↪ Se déconnecter</button>
      </section>
    </div>
  ) 
}

function ErrorModal({ message, close }) { 
  return (
    <div className="modal-backdrop">
      <section className="error-modal">
        <h2>Une erreur est survenue</h2>
        <p>{message}</p>
        <button className="primary-button" onClick={close}>Fermer</button>
      </section>
    </div>
  ) 
}

export default function App() { 
  const [screen, setScreen] = useState(pathToScreen())
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [menu, setMenu] = useState(false)
  const [account, setAccount] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const f = () => setScreen(pathToScreen())
    window.addEventListener('popstate', f)
    return () => window.removeEventListener('popstate', f)
  }, [])

  function navigate(next) {
    const path = next === 'home' ? `${BASE}/` 
      : next === 'login' ? `${BASE}/login`
      : next === 'register' ? `${BASE}/register`
      : next === 'comments' ? `${BASE}/study/comments`
      : `${BASE}/study`
    history.pushState({}, '', path)
    setScreen(next)
    setMenu(false)
  }

  function success(next) {
    setUser(next)
    localStorage.setItem('user', JSON.stringify(next))
    navigate('study')
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('user')
    setAccount(false)
    navigate('home')
  }

  return (
    <div className="app">
      <Header 
        user={user} 
        navigate={navigate} 
        onMenu={() => setMenu(true)} 
        onAccount={() => setAccount(true)} 
        screen={screen}
      />
      <Menu 
        open={menu} 
        close={() => setMenu(false)} 
        navigate={navigate}
      />
      
      {screen === 'home' && <Home navigate={navigate}/>} 
      {screen === 'login' && <Auth mode="login" navigate={navigate} onSuccess={success} onError={setError}/>} 
      {screen === 'register' && <Auth mode="register" navigate={navigate} onSuccess={success} onError={setError}/>} 
      {screen === 'study' && <Study navigate={navigate}/>} 
      {screen === 'comments' && <Comments user={user} onError={setError}/>} 
      
      {account && <Account user={user} close={() => setAccount(false)} logout={logout}/>} 
      {error && <ErrorModal message={error} close={() => setError('')}/>}
    </div>
  ) 
}