import { useEffect, useState } from 'react'


import { isStaffRole, roleLabel, isAdmin } from './utils/roles'

import { ROUTES, EDIT_SCREENS, MODERATION_SCREENS, ADMIN_SCREENS, pathToScreen } from './config/routes'

import { api } from './api/service'
import { useSocketConnection } from './hooks/useSocketConnection'
import { useMessagesSocket } from './hooks/useMessagesSocket'
import Logo from './components/ui/Logo'
import { Footer } from './components/layout/Footer'
import { Menu } from './components/layout/Menu'
import { Home } from './pages/Home'
import { Header } from './components/layout/Header'
import { SuccessModal } from './components/modals/SuccessModal'
import { ErrorModal } from './components/modals/ErrorModal'
import { Study } from './pages/Study'
import { Moderation } from './pages/Moderation'
import { CommentRow } from './components/moderation/CommentRow'
import { ModerationList } from './pages/ModerationList'
import { Auth } from './pages/Auth'
import { EditAccount } from './pages/EditAccount'
import { Comments } from './pages/Comments'
import { ACTIVITY_PERIODS, computeActivity } from './utils/activity'


function Account({ user, close, logout, onEdit }) { 
  const [showManageMenu, setShowManageMenu] = useState(false)
  const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim()
  const email = user.email || ''
  const initial = (user.prenom?.[0] || '?').toUpperCase()

  return (
    <div className="modal-backdrop" onClick={close}>
      <section className="account-modal" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={close} aria-label="Fermer">×</button>
        
        <div className="account-user-card">
          <div className="account-user-avatar">{initial}</div>
          <div className="account-user-info">
            <span className="account-user-name">{fullName}</span>
            <span className="account-user-email">{email}</span>
          </div>
        </div>

        <div className="account-manage-wrapper">
          <button 
            type="button" 
            className="account-manage-row" 
            onClick={() => setShowManageMenu(prev => !prev)}
          >
            <Logo className="account-manage-logo" />
            <span>Gérer votre compte</span>
            <span style={{ fontSize: '12px', marginLeft: 'auto', transform: showManageMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
          </button>

          {showManageMenu && (
            <div className="manage-account-dropdown" onClick={e => e.stopPropagation()}>
              <button type="button" className="dropdown-item" onClick={() => onEdit('edit-profile')}>
                Modifier vos informations<br />personnelles
              </button>
              <div className="dropdown-divider"></div>
              <button type="button" className="dropdown-item" onClick={() => onEdit('edit-email')}>
                Changer d’email
              </button>
              <div className="dropdown-divider"></div>
              <button type="button" className="dropdown-item" onClick={() => onEdit('edit-password')}>
                Changer votre mot de passe
              </button>
            </div>
          )}
        </div>

        <div className="account-divider"></div>

        <button className="logout-button-red" onClick={logout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Se déconnecter</span>
        </button>
      </section>
    </div>
  ) 
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`stat-card ${accent ? 'accent' : ''}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}

function PeriodCards({ total, totalSub, byPeriod }) {
  return (
    <div className="stat-grid">
      <StatCard label="Total global" value={total} sub={totalSub} accent />
      {ACTIVITY_PERIODS.map(period => (
        <StatCard key={period.key} label={period.label} value={byPeriod[period.key]} />
      ))}
    </div>
  )
}

function RoleBars({ roles, total }) {
  const rows = [
    { key: 'etudiant', label: 'Étudiants', value: roles.etudiant },
    { key: 'prof', label: 'Professeurs', value: roles.prof },
    { key: 'admin', label: 'Administrateurs', value: roles.admin }
  ]
  return (
    <div className="stat-panel">
      {rows.map(row => {
        const pct = total ? Math.round((row.value / total) * 100) : 0
        return (
          <div className="stat-bar-row" key={row.key}>
            <span>{row.label}</span>
            <div className="stat-bar-track">
              <div className={`stat-bar-fill ${row.key}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="stat-bar-value">{row.value} <small>({pct}%)</small></span>
          </div>
        )
      })}
    </div>
  )
}

function ContributorPanel({ title, units, list }) {
  return (
    <div className="stat-panel">
      <h4 className="stat-panel-title">{title}</h4>
      {list.length === 0 ? (
        <p className="stats-note">Aucune donnée pour le moment.</p>
      ) : (
        <ol className="contrib-list">
          {list.map((entry, index) => {
            const a = entry.author
            const name = [a.prenom, a.nom].filter(Boolean).join(' ') || 'Utilisateur'
            const staff = isStaffRole(a.role)
            return (
              <li key={a.matricule} className={`contrib-item ${index === 0 ? 'first' : ''}`}>
                <span className={`discussion-avatar ${staff ? 'prof-avatar' : ''}`}>{name[0].toUpperCase()}</span>
                <span className="contrib-main">
                  <span className="author-title">
                    <strong>{name}</strong>
                    <span className={`role-badge ${staff ? 'prof-badge' : ''}`}>{roleLabel(a.role)}</span>
                  </span>
                  <small className="time-ago">{a.matricule}</small>
                </span>
                <span className="contrib-count">
                  <strong>{entry.count}</strong> {units[entry.count > 1 ? 1 : 0]}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function ActivityContent({ data }) {
  const { messages: m, users: u, top } = data
  const [showReplied, setShowReplied] = useState(false)
  const [openId, setOpenId] = useState(null)
  const repliedPct = m.total ? Math.round((m.withReplies.length / m.total) * 100) : 0

  return (
    <div className="stats-content">
      {/* ---------- Messages ---------- */}
      <section>
        <h2 className="stats-section-title">Messages</h2>

        <h3 className="stats-subtitle">Messages créés</h3>
        <PeriodCards
          total={m.total}
          totalSub={`${m.roots} discussion${m.roots > 1 ? 's' : ''} · ${m.replies} réponse${m.replies > 1 ? 's' : ''}`}
          byPeriod={m.created}
        />

        <h3 className="stats-subtitle">Messages signalés</h3>
        <PeriodCards total={m.reportedTotal} totalSub="En attente de modération" byPeriod={m.reported} />
        <p className="stats-note">
          Les périodes se basent sur la date de publication du message signalé (la date du signalement n'est pas enregistrée).
        </p>

        <h3 className="stats-subtitle">Messages avec au moins une réponse</h3>
        <div className="stat-grid">
          <StatCard label="Messages avec réponse" value={m.withReplies.length} sub={`${repliedPct} % des messages`} accent />
        </div>
        {m.withReplies.length > 0 && (
          <div className="stats-toggle-row">
            <button type="button" className="mod-chip" aria-expanded={showReplied} onClick={() => setShowReplied(v => !v)}>
              {showReplied ? 'Masquer la liste' : 'Voir la liste'}
            </button>
          </div>
        )}
        {showReplied && (
          <div className="mod-list">
            {m.withReplies.map(item => {
              const id = String(item.id)
              const open = openId === id
              return <CommentRow key={id} id={id} item={item} open={open} onToggle={() => setOpenId(open ? null : id)} />
            })}
          </div>
        )}
      </section>

      {/* ---------- Utilisateurs ---------- */}
      <section>
        <h2 className="stats-section-title">Utilisateurs</h2>

        <h3 className="stats-subtitle">Comptes</h3>
        <div className="stat-grid">
          <StatCard label="Total utilisateurs" value={u.total} accent />
          <StatCard label="Connectés" value={u.connected} />
          <StatCard label="Non connectés" value={u.offline} />
          <StatCard label="Bloqués" value={u.blocked} />
        </div>

        <h3 className="stats-subtitle">Nouveaux utilisateurs</h3>
        <PeriodCards total={u.total} byPeriod={u.created} />

        <h3 className="stats-subtitle">Répartition par rôle</h3>
        <RoleBars roles={u.roles} total={u.total} />
      </section>

      {/* ---------- Top contributeurs ---------- */}
      <section>
        <h2 className="stats-section-title">Top contributeurs</h2>
        <div className="contrib-grid">
          <ContributorPanel title="Plus de messages publiés" units={['message', 'messages']} list={top.publishers} />
          <ContributorPanel title="Plus de réponses" units={['réponse', 'réponses']} list={top.responders} />
        </div>
      </section>
    </div>
  )
}

function Activity({ onError }) {
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const [tick, setTick] = useState(0)

  // Tout événement WebSocket (message, connexion, déconnexion, inscription) recharge les chiffres
  useMessagesSocket(() => setTick(v => v + 1))

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let alive = true
    Promise.all([api.moderation.users(), api.moderation.comments()])
      .then(([users, comments]) => {
        if (!alive) return
        setData(computeActivity(users, comments))
        setFailed(false)
      })
      .catch(e => {
        if (!alive) return
        setFailed(true)
        onError(e.message)
      })
    return () => { alive = false }
  }, [tick])

  return (
    <>
      <main className="study-space">
        <div className="study-header">
          <h1>Activités</h1>
          <p>Analyse 2 - Statistiques de la plateforme</p>
        </div>

        {data === null
          ? <p className="mod-empty">{failed ? 'Impossible de charger les statistiques.' : 'Chargement...'}</p>
          : <ActivityContent data={data} />}
      </main>
      <Footer/>
    </>
  )
}

export default function App() { 
  const [screen, setScreen] = useState(pathToScreen())
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [pendingUser, setPendingUser] = useState(null)
  const [successDialogMode, setSuccessDialogMode] = useState(null)
  const [menu, setMenu] = useState(false)
  const [account, setAccount] = useState(false)
  const [returnTo, setReturnTo] = useState('study')
  const [error, setError] = useState('')

  useSocketConnection(user?.matricule)

  useEffect(() => {
    const f = () => setScreen(pathToScreen())
    window.addEventListener('popstate', f)
    return () => window.removeEventListener('popstate', f)
  }, [])

  function navigate(next) {
    const path = ROUTES[next] || ROUTES.study
    history.pushState({}, '', path)
    setScreen(next)
    setMenu(false)
  }

  function handleAuthSuccess(userData, mode) {
    setPendingUser(userData)
    setSuccessDialogMode(mode)
  }

  function confirmSuccessDialog() {
    const mode = successDialogMode
    setSuccessDialogMode(null)

    if (mode === 'emailVerified') return setSuccessDialogMode('update')
    if (mode === 'logout') return navigate('home')
    if (['publish', 'reply', 'report', 'edit', 'delete'].includes(mode)) return
    if (mode === 'update') return navigate(backTo)

    if (pendingUser) {
      setUser(pendingUser)
      localStorage.setItem('user', JSON.stringify(pendingUser))
    }
    setPendingUser(null)
    navigate(isAdmin(pendingUser) ? 'moderation' : 'study')
  }

  function handleAccountUpdated(updatedUser, { emailVerified = false } = {}) {
    const { motDePasse, ...sessionUser } = updatedUser
    setUser(sessionUser)
    localStorage.setItem('user', JSON.stringify(sessionUser))
    setSuccessDialogMode(emailVerified ? 'emailVerified' : 'update')
  }

  // Ouvre une page de modification du compte en mémorisant l'écran d'origine
  function openAccountEdit(next) {
    setReturnTo(screen)
    setAccount(false)
    navigate(next)
  }

  function logout() {
    api.auth.logout(user)
    setUser(null)
    localStorage.removeItem('user')
    setAccount(false)
    setSuccessDialogMode('logout')
  }

  const isEditScreen = EDIT_SCREENS.includes(screen)
  const isModerationScreen = MODERATION_SCREENS.includes(screen)
  const showHeader = screen !== 'login' && screen !== 'register' && !isEditScreen

  const admin = isAdmin(user)
  const adminBlocked = admin && !ADMIN_SCREENS.includes(screen)
  const backTo = admin && !ADMIN_SCREENS.includes(returnTo) ? 'moderation' : returnTo
  
  useEffect(() => {
    if (successDialogMode === 'logout') return
    if ((isEditScreen || isModerationScreen) && !user) return navigate('login')
    if (isModerationScreen && !admin) return navigate('study')
    if (admin && !ADMIN_SCREENS.includes(screen)) return navigate('moderation')
  }, [screen, user, successDialogMode])
  
return (
    <div className="app">
      {showHeader && (
        <Header 
          user={user} 
          navigate={navigate} 
          onMenu={() => setMenu(m => !m)} 
          onAccount={() => setAccount(true)} 
          screen={screen}
        />
      )}
      <Menu 
        open={menu} 
        close={() => setMenu(false)} 
        navigate={navigate}
        admin={isAdmin(user)}
      />
      
      {screen === 'home' && <Home navigate={navigate}/>} 
      {screen === 'login' && <Auth mode="login" navigate={navigate} onSuccess={handleAuthSuccess} onError={setError}/>} 
      {screen === 'register' && <Auth mode="register" navigate={navigate} onSuccess={handleAuthSuccess} onError={setError}/>} 
      {screen === 'study' && !adminBlocked && <Study navigate={navigate}/>} 
      {isEditScreen && user && (
        <EditAccount
          key={screen}
          mode={screen.replace('edit-', '')}
          user={user}
          onSuccess={handleAccountUpdated}
          onError={setError}
          onCancel={() => navigate(backTo)}
        />
      )}
      {screen === 'moderation' && isAdmin(user) && <Moderation navigate={navigate}/>}
      {isModerationScreen && screen !== 'moderation' && screen !== 'activity' && isAdmin(user) && (
        <ModerationList key={screen} kind={screen.replace('moderation-', '')} onError={setError}/>
      )}
      {screen === 'activity' && isAdmin(user) && <Activity onError={setError}/>}
      {screen === 'comments' && !adminBlocked && <Comments user={user} onError={setError} onPublished={(mode = 'publish') => setSuccessDialogMode(mode)}/>}
      
      {successDialogMode && (
        <SuccessModal mode={successDialogMode} onConfirm={confirmSuccessDialog} />
      )}
      {account && <Account user={user} close={() => setAccount(false)} logout={logout} onEdit={openAccountEdit}/>} 
      {error && <ErrorModal message={error} close={() => setError('')}/>}
    </div>
  ) 
}