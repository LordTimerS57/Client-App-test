import { useEffect, useRef, useState } from 'react'

import { norm, splitTerms } from './utils/text'

import { isStaffRole, roleLabel, roleKey, isAdmin } from './utils/roles'
import { relativeDate, toDayKey, formatDay, byDateDesc } from './utils/dates'
import {
  reportCount, hasVisible, commentAuthor, messageTime,
  filterThread, COMMENT_ROLE_FILTERS, COMMENT_SORTS
} from './utils/messages'

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
import { ConfirmPublishModal } from './components/modals/ConfirmPublishModal'
import { ErrorModal } from './components/modals/ErrorModal'
import { Study } from './pages/Study'
import { Moderation } from './pages/Moderation'
import { CommentRow } from './components/moderation/CommentRow'
import { ModerationList } from './pages/ModerationList'
import { Auth } from './pages/Auth'
import { EditAccount } from './pages/EditAccount'


function MessageThread({ item, depth, user, replyingId, replyText, setReplyText, onToggleReply, onSubmitReply, submitting, onReport, reportedIds, editingId, editText, setEditText, onToggleEdit, onSubmitEdit, onDelete }) {
  const author = item.envoyeur || {}
  // Mon propre message : je peux le modifier / supprimer, mais ni y répondre ni le signaler
  const isMine = !!user && !!author.matricule && author.matricule === user.matricule
  const authorName = isMine ? 'Vous' : (author.prenom || 'Utilisateur')
  const authorRole = roleLabel(author.role)
  const initials = (author.prenom?.[0] || author.nom?.[0] || '?').toUpperCase()
  const isProf = isStaffRole(author.role)
  const timeText = relativeDate(item.dateDePublication)
  const children = (item.replies || item.messagesReponses || []).filter(hasVisible)
  const deleted = item.statut === 'SUPPRIME'
  const canReply = !!user && !isMine && !deleted
  const canReport = canReply
  const isReplying = replyingId === item.id
  const isEditing = editingId === item.id
  const reported = item.statut === 'SIGNALE' || reportedIds.includes(item.id)
  const repliesCount = item.repliesCount ?? children.length

  return (
    <div className={depth > 0 ? 'reply-card' : 'discussion-card'}>
      <div className="discussion-author">
        <span className={`discussion-avatar ${isProf ? 'prof-avatar' : ''}`}>
          {initials}
        </span>
        <div className="author-details">
          <div className="author-title">
            <strong>{authorName}</strong>
            <span className={`role-badge ${isProf ? 'prof-badge' : ''}`}>{authorRole}</span>
          </div>
          <small className="time-ago">{timeText}</small>
        </div>
      </div>

      {isEditing ? (
        <form className="reply-form" onSubmit={e => { e.preventDefault(); onSubmitEdit(item.id) }}>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows="3"
            autoFocus
          />
          <div className="reply-form-actions">
            <button type="button" className="dialog-btn secondary-btn" onClick={() => onToggleEdit(null)}>Annuler</button>
            <button type="submit" className="dialog-btn" disabled={submitting || !editText.trim()}>Enregistrer</button>
          </div>
        </form>
      ) : (
        <p className={`${depth > 0 ? 'reply-content' : 'discussion-content'} ${deleted ? 'message-deleted' : ''}`}>
          {deleted ? 'Ce message a été supprimé.' : (item.contenu || item.content)}
        </p>
      )}

      <div className="discussion-footer">
        {depth === 0 && (
          <span className="replies-count">{repliesCount} réponse{repliesCount > 1 ? 's' : ''}</span>
        )}
        {!deleted && !isEditing && (canReply || canReport || isMine) && (
          <div className="discussion-actions">
            {canReply && (
              <button type="button" className="reply-trigger" onClick={() => onToggleReply(isReplying ? null : item.id)}>
                Répondre
              </button>
            )}
            {canReport && (
              <button type="button" className="report-trigger" onClick={() => onReport(item.id)} disabled={reported}>
                {reported ? 'Signalé' : 'Signaler'}
              </button>
            )}
            {isMine && (
              <>
                <button type="button" className="edit-trigger" onClick={() => onToggleEdit(item.id, item.contenu || item.content || '')}>
                  Modifier
                </button>
                <button type="button" className="delete-trigger" onClick={() => onDelete(item.id)}>
                  Supprimer
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {isReplying && (
        <form className="reply-form" onSubmit={e => { e.preventDefault(); onSubmitReply(item.id) }}>
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Écrivez votre réponse..."
            rows="2"
            autoFocus
          />
          <div className="reply-form-actions">
            <button type="button" className="dialog-btn secondary-btn" onClick={() => onToggleReply(null)}>Annuler</button>
            <button type="submit" className="dialog-btn" disabled={submitting || !replyText.trim()}>Répondre</button>
          </div>
        </form>
      )}

      {children.length > 0 && (
        <div className="replies-container">
          {children.map((child, index) => (
            <MessageThread
              key={child.id ?? index}
              item={child}
              depth={depth + 1}
              user={user}
              replyingId={replyingId}
              replyText={replyText}
              setReplyText={setReplyText}
              onToggleReply={onToggleReply}
              onSubmitReply={onSubmitReply}
              submitting={submitting}
              onReport={onReport}
              reportedIds={reportedIds}
              editingId={editingId}
              editText={editText}
              setEditText={setEditText}
              onToggleEdit={onToggleEdit}
              onSubmitEdit={onSubmitEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Comments({ user, onError, onPublished }) { 
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')   // 'all' | 'prof' | 'etudiant'
  const [sortOrder, setSortOrder] = useState('')        // '' (récent par défaut) | 'oldest' | 'recent'
  const [objetSearch, setObjetSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [openSection, setOpenSection] = useState(null)  // 'auteur' | 'date' | 'objet' | null
  const [dayFilter, setDayFilter] = useState('')          // '' ou 'AAAA-MM-JJ'
  const [dayPickerOpen, setDayPickerOpen] = useState(false)
  const filterRef = useRef(null)
  const [question, setQuestion] = useState('')
  const [subject, setSubject] = useState('')
  const [tick, setTick] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [replyingId, setReplyingId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [reportedIds, setReportedIds] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  useMessagesSocket(event => { if (!event.type?.startsWith('USER_')) setTick(v => v + 1) })
  
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 300000)
    return () => clearInterval(t)
  }, [])

    // On charge tout : le filtrage (nom, contenu, objet, rôle, réponses incluses) se fait côté client
  const loadFailed = useRef(false)

  useEffect(() => {
    api.messages.list({})
      .then(list => { loadFailed.current = false; setMessages(list) })
      .catch(e => {
        if (!loadFailed.current) onError(e.message) // une seule alerte tant que le serveur ne répond pas
        loadFailed.current = true
      })
  }, [tick])

  // Ferme le menu de filtres au clic à l'extérieur
  useEffect(() => {
    if (!filtersOpen) return
    const close = e => { if (!filterRef.current?.contains(e.target)) setFiltersOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [filtersOpen])

  const toggleSection = key => setOpenSection(s => (s === key ? null : key))
  const pickRole = key => setRoleFilter(r => (r === key ? 'all' : key))
  const pickSort = key => setSortOrder(s => (s === key ? '' : key))

  const togglePrecise = () => {
    if (dayPickerOpen || dayFilter) { setDayPickerOpen(false); setDayFilter('') }
    else setDayPickerOpen(true)
  }

  function toggleReply(id) {
    setReplyingId(id)
    setReplyText('')
    setEditingId(null)
  }

  function toggleEdit(id, content = '') {
    setEditingId(id)
    setEditText(content)
    setReplyingId(null)
  }

  async function submitEdit(id) {
    if (!editText.trim()) return
    setEditSubmitting(true)
    try {
      await api.messages.update(id, { contenu: editText.trim(), envoyeur: { matricule: user.matricule } })
      setEditingId(null)
      setEditText('')
      setTick(v => v + 1)
      onPublished('edit')
    } catch (e) {
      onError(e.message)
    } finally {
      setEditSubmitting(false)
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await api.messages.remove(deleteId, user.matricule)
      setDeleteId(null)
      setTick(v => v + 1)
      onPublished('delete')
    } catch (e) {
      setDeleteId(null)
      onError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  async function submitReply(parentId) {
    if (!replyText.trim()) return
    setReplySubmitting(true)
    try {
      await api.messages.create({
        objet: 'Réponse',
        contenu: replyText.trim(),
        envoyeur: { prenom: user.prenom || 'Vous', matricule: user.matricule },
        messageParent: { id: parentId }
      })
      setReplyingId(null)
      setReplyText('')
      setTick(v => v + 1)
      onPublished('reply')
    } catch (e) {
      onError(e.message)
    } finally {
      setReplySubmitting(false)
    }
  }

  async function reportMessage(id) {
    try {
      await api.messages.report(id, user.matricule)
      setReportedIds(ids => [...ids, id])
      setTick(v => v + 1)
      onPublished('report')
    } catch (e) {
      onError(e.message)
    }
  }

  function requestPublish(e) {
    e.preventDefault()
    if (!user) return onError('Connectez-vous pour publier.')
    if (!question.trim()) return
    setConfirmOpen(true)
  }

  async function confirmPublish() {
    setPublishing(true)
    try {
      await api.messages.create({
        objet: subject.trim() || 'Question',
        contenu: question.trim(),
        envoyeur: { prenom: user.prenom || 'Vous', matricule: user.matricule }
      })
      setQuestion('')
      setSubject('')
      setTick(v => v + 1)
      setConfirmOpen(false)
      onPublished()
    } catch (e) {
      setConfirmOpen(false)
      onError(e.message)
    } finally {
      setPublishing(false)
    }
  }

  function resetFilters() {
    setSearch('')
    setRoleFilter('all')
    setSortOrder('')
    setObjetSearch('')
    setDayFilter('')
    setDayPickerOpen(false)
  }

  const baseList = messages.filter(hasVisible)

  // ---- Filtres ----
  const terms = splitTerms(search)
  const objetTerms = splitTerms(objetSearch)
  const filtersActive = terms.length > 0 || objetTerms.length > 0 || roleFilter !== 'all' || !!dayFilter
  const panelActiveCount = (roleFilter !== 'all' ? 1 : 0) + (objetTerms.length > 0 ? 1 : 0) + (sortOrder ? 1 : 0) + (dayFilter ? 1 : 0)
  const roleSel = COMMENT_ROLE_FILTERS.find(f => f.key === roleFilter)
  const sortSel = COMMENT_SORTS.find(s => s.key === sortOrder)

  // Tri des fils racines (récent par défaut). Les réponses restent en ordre chronologique.
  const sortedList = [...baseList].sort((a, b) =>
    sortOrder === 'oldest' ? messageTime(a) - messageTime(b) : messageTime(b) - messageTime(a)
  )
  const criteria = { role: roleFilter, terms, objetTerms, day: dayFilter }
  const displayList = filtersActive
    ? sortedList.map(item => filterThread(item, criteria)).filter(Boolean)
    : sortedList

  const chevron = (
    <svg className="filter-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )

  return (
    <>
      <main className="comments-page">
        <div className="comments-header">
          <h1>Commentaires</h1>
          <p>Analyse 2 - Échangez avec la communauté</p>
        </div>

        <div className="comments-toolbar">
          <div className="search-input-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Rechercher par nom ou par contenu..."
              aria-label="Rechercher par nom ou par contenu"
            />
          </div>

          <div className="filter-wrapper" ref={filterRef}>
            <button
              type="button"
              className={`filter-btn ${filtersOpen ? 'active' : ''}`}
              onClick={() => setFiltersOpen(open => !open)}
              aria-expanded={filtersOpen}
              aria-haspopup="true"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="6" y1="12" x2="18" y2="12"/>
                <line x1="8" y1="18" x2="16" y2="18"/>
              </svg>
              <span>Filtrer</span>
              {panelActiveCount > 0 && <span className="filter-count">{panelActiveCount}</span>}
            </button>

            {filtersOpen && (
              <div className="filter-dropdown">
                {/* A -> Auteur */}
                <button type="button" className={`filter-row ${openSection === 'auteur' ? 'open' : ''}`}
                        onClick={() => toggleSection('auteur')} aria-expanded={openSection === 'auteur'}>
                  <span>Auteur</span>
                  <span className="filter-row-value">{roleSel?.label}</span>
                  {chevron}
                </button>
                {openSection === 'auteur' && (
                  <div className="filter-sub">
                    {COMMENT_ROLE_FILTERS.map(f => (
                      <button type="button" key={f.key}
                              className={`filter-option ${roleFilter === f.key ? 'selected' : ''}`}
                              onClick={() => pickRole(f.key)}>
                        {f.label}{roleFilter === f.key && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
                <div className="dropdown-divider"></div>

                {/* B -> Date */}
                <button type="button" className={`filter-row ${openSection === 'date' ? 'open' : ''}`}
                        onClick={() => toggleSection('date')} aria-expanded={openSection === 'date'}>
                  <span>Date</span>
                  <span className="filter-row-value">
                    {[sortSel?.label, dayFilter && formatDay(dayFilter)].filter(Boolean).join(' · ')}
                  </span>
                  {chevron}
                </button>
                {openSection === 'date' && (
                  <div className="filter-sub">
                    {COMMENT_SORTS.map(s => (
                      <button type="button" key={s.key}
                              className={`filter-option ${sortOrder === s.key ? 'selected' : ''}`}
                              onClick={() => pickSort(s.key)}>
                        {s.label}{sortOrder === s.key && <span>✓</span>}
                      </button>
                    ))}

                    <button type="button"
                            className={`filter-option ${dayPickerOpen || dayFilter ? 'selected' : ''}`}
                            onClick={togglePrecise}>
                      Précise{(dayPickerOpen || dayFilter) && <span>✓</span>}
                    </button>
                    {(dayPickerOpen || dayFilter) && (
                      <input
                        type="date"
                        className="filter-input"
                        value={dayFilter}
                        max={toDayKey(Date.now())}
                        onChange={e => setDayFilter(e.target.value)}
                        aria-label="Choisir une date"
                      />
                    )}
                  </div>
                )}
                <div className="dropdown-divider"></div>

                {/* C -> Objet */}
                <button type="button" className={`filter-row ${openSection === 'objet' ? 'open' : ''}`}
                        onClick={() => toggleSection('objet')} aria-expanded={openSection === 'objet'}>
                  <span>Objet</span>
                  <span className="filter-row-value">{objetSearch.trim()}</span>
                  {chevron}
                </button>
                {openSection === 'objet' && (
                  <div className="filter-sub">
                    <input
                      className="filter-input"
                      value={objetSearch}
                      onChange={e => setObjetSearch(e.target.value)}
                      placeholder="Rechercher un objet..."
                      aria-label="Rechercher un objet"
                      autoFocus
                    />
                  </div>
                )}

                {(filtersActive || sortOrder) && (
                  <>
                    <div className="dropdown-divider"></div>
                    <button type="button" className="filter-reset" onClick={resetFilters}>
                      Réinitialiser les filtres
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {(roleFilter !== 'all' || sortOrder || dayFilter || objetTerms.length > 0) && (
          <div className="filter-tags">
            {roleSel && <button type="button" className="filter-tag" onClick={() => setRoleFilter('all')}>Auteur : {roleSel.label} ×</button>}
            {sortSel && <button type="button" className="filter-tag" onClick={() => setSortOrder('')}>Date : {sortSel.label} ×</button>}
            {dayFilter && <button type="button" className="filter-tag" onClick={() => { setDayFilter(''); setDayPickerOpen(false) }}>Le {formatDay(dayFilter)} ×</button>}
            {objetTerms.length > 0 && <button type="button" className="filter-tag" onClick={() => setObjetSearch('')}>Objet : {objetSearch.trim()} ×</button>}
          </div>
        )}

        <form className="question-box" onSubmit={requestPublish}>
          <h3>Poser une question</h3>
          <input
            className="subject-input"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Objet (facultatif)"
            maxLength={200}
            aria-label="Objet"
          />
          <textarea 
            value={question} 
            onChange={e => setQuestion(e.target.value)} 
            placeholder="Écrivez votre question ou commentaire..." 
            rows="3"
          />
          <div className="question-actions">
            <button type="button" className="attach-btn" title="Joindre un fichier">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <button type="submit" className="publish-button">Publier</button>
          </div>
        </form>

        {filtersActive && displayList.length === 0 && (
          <p className="mod-empty">Aucun résultat pour ces filtres.</p>
        )}
        {filtersActive && displayList.length > 0 && (
          <p className="mod-count">
            {displayList.length} discussion{displayList.length > 1 ? 's' : ''} correspondante{displayList.length > 1 ? 's' : ''}
          </p>
        )}

        {!filtersActive && displayList.length === 0 && (
          <p className="mod-empty">Aucun commentaire pour le moment.</p>
        )}

        <section className="discussions-list">
          {displayList.map(item => (
            <MessageThread
              key={item.id}
              item={item}
              depth={0}
              user={user}
              replyingId={replyingId}
              replyText={replyText}
              setReplyText={setReplyText}
              onToggleReply={toggleReply}
              onSubmitReply={submitReply}
              submitting={replySubmitting || editSubmitting}
              onReport={reportMessage}
              reportedIds={reportedIds}
              editingId={editingId}
              editText={editText}
              setEditText={setEditText}
              onToggleEdit={toggleEdit}
              onSubmitEdit={submitEdit}
              onDelete={setDeleteId}
            />
          ))}
        </section>
      </main>
      <Footer/>

      {confirmOpen && (
        <ConfirmPublishModal
          busy={publishing}
          onConfirm={confirmPublish}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
      
      {deleteId !== null && (
        <ConfirmPublishModal
          busy={deleting}
          title="Suppression du commentaire"
          text={<>Voulez-vous vraiment supprimer<br />ce commentaire ?</>}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  ) 
}

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

// ================= Page Activités (admin) =================
const DAY_MS = 24 * 60 * 60 * 1000
// Fenêtres glissantes : modifiez ici pour changer les périodes
const ACTIVITY_PERIODS = [
  { key: 'day', label: '24 dernières heures', ms: DAY_MS },
  { key: 'week', label: '7 derniers jours', ms: 7 * DAY_MS },
  { key: 'month', label: '30 derniers jours', ms: 30 * DAY_MS },
  { key: 'year', label: '12 derniers mois', ms: 365 * DAY_MS }
]

const repliesOf = m => m.replies || m.messagesReponses || []

// Aplatit l'arbre (racines + réponses à tous les niveaux), sans les messages supprimés
function collectMessages(list, isReply = false) {
  return list.flatMap(m => [
    ...(m.statut === 'SUPPRIME' ? [] : [{ ...m, isReply, authorRole: commentAuthor(m).role }]),
    ...collectMessages(repliesOf(m), true)
  ])
}

function countByPeriod(items, getDate, now) {
  const counts = {}
  for (const period of ACTIVITY_PERIODS) {
    counts[period.key] = items.filter(item => {
      const time = Date.parse(getDate(item))
      return !Number.isNaN(time) && now - time <= period.ms
    }).length
  }
  return counts
}

// Top 3 des auteurs (égalité : ordre alphabétique du nom)
function topContributors(messages) {
  const byUser = new Map()
  for (const m of messages) {
    const author = commentAuthor(m)
    if (!author.matricule) continue
    const entry = byUser.get(author.matricule) || { author, count: 0 }
    entry.count += 1
    byUser.set(author.matricule, entry)
  }
  return [...byUser.values()]
    .sort((a, b) => b.count - a.count || norm(a.author.nom).localeCompare(norm(b.author.nom)))
    .slice(0, 3)
}

function computeActivity(users, comments) {
  const now = Date.now()
  const all = collectMessages(comments)
  const reported = all.filter(m => reportCount(m) > 0)
  const replyCount = m => repliesOf(m).filter(hasVisible).length
  const withReplies = all
    .filter(m => replyCount(m) > 0)
    .sort((a, b) => replyCount(b) - replyCount(a) || byDateDesc(a, b))

  // Répartition exclusive : bloqué > connecté > non connecté
  const blocked = users.filter(u => u.status === false).length
  const connected = users.filter(u => u.status !== false && u.connecte).length
  const roles = { etudiant: 0, prof: 0, admin: 0 }
  users.forEach(u => { roles[roleKey(u.role)] += 1 })

  return {
    messages: {
      total: all.length,
      roots: all.filter(m => !m.isReply).length,
      replies: all.filter(m => m.isReply).length,
      created: countByPeriod(all, m => m.dateDePublication, now),
      reportedTotal: reported.length,
      reported: countByPeriod(reported, m => m.dateDePublication, now),
      withReplies
    },
    users: {
      total: users.length,
      connected,
      blocked,
      offline: users.length - connected - blocked,
      created: countByPeriod(users, u => u.dateInscription, now),
      roles
    },
    top: {
      publishers: topContributors(all),
      responders: topContributors(all.filter(m => m.isReply))
    }
  }
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