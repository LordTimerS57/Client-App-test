import { useState, useRef, useEffect } from 'react';
import { api } from '../api/service';
import { MessageThread } from '../components/comments/MessageThread';
import { Footer } from '../components/layout/Footer';
import { ConfirmPublishModal } from '../components/modals/ConfirmPublishModal';
import { useMessagesSocket } from '../hooks/useMessagesSocket';
import { formatDay, toDayKey } from '../utils/dates';
import { hasVisible, COMMENT_ROLE_FILTERS, COMMENT_SORTS, messageTime, filterThread } from '../utils/messages';
import { splitTerms } from '../utils/text';

export function Comments({ user, onError, onPublished }) {
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'prof' | 'etudiant'
  const [sortOrder, setSortOrder] = useState(''); // '' (récent par défaut) | 'oldest' | 'recent'
  const [objetSearch, setObjetSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null); // 'auteur' | 'date' | 'objet' | null
  const [dayFilter, setDayFilter] = useState(''); // '' ou 'AAAA-MM-JJ'
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const filterRef = useRef(null);
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('');
  const [tick, setTick] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [reportedIds, setReportedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  useMessagesSocket(event => { if (!event.type?.startsWith('USER_')) setTick(v => v + 1); });

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 300000);
    return () => clearInterval(t);
  }, []);

  // On charge tout : le filtrage (nom, contenu, objet, rôle, réponses incluses) se fait côté client
  const loadFailed = useRef(false);

  useEffect(() => {
    api.messages.list({})
      .then(list => { loadFailed.current = false; setMessages(list); })
      .catch(e => {
        if (!loadFailed.current) onError(e.message); // une seule alerte tant que le serveur ne répond pas
        loadFailed.current = true;
      });
  }, [tick]);

  // Ferme le menu de filtres au clic à l'extérieur
  useEffect(() => {
    if (!filtersOpen) return;
    const close = e => { if (!filterRef.current?.contains(e.target)) setFiltersOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [filtersOpen]);

  const toggleSection = key => setOpenSection(s => (s === key ? null : key));
  const pickRole = key => setRoleFilter(r => (r === key ? 'all' : key));
  const pickSort = key => setSortOrder(s => (s === key ? '' : key));

  const togglePrecise = () => {
    if (dayPickerOpen || dayFilter) { setDayPickerOpen(false); setDayFilter(''); }
    else setDayPickerOpen(true);
  };

  function toggleReply(id) {
    setReplyingId(id);
    setReplyText('');
    setEditingId(null);
  }

  function toggleEdit(id, content = '') {
    setEditingId(id);
    setEditText(content);
    setReplyingId(null);
  }

  async function submitEdit(id) {
    if (!editText.trim()) return;
    setEditSubmitting(true);
    try {
      await api.messages.update(id, { contenu: editText.trim(), envoyeur: { matricule: user.matricule } });
      setEditingId(null);
      setEditText('');
      setTick(v => v + 1);
      onPublished('edit');
    } catch (e) {
      onError(e.message);
    } finally {
      setEditSubmitting(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.messages.remove(deleteId, user.matricule);
      setDeleteId(null);
      setTick(v => v + 1);
      onPublished('delete');
    } catch (e) {
      setDeleteId(null);
      onError(e.message);
    } finally {
      setDeleting(false);
    }
  }

  async function submitReply(parentId) {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    try {
      await api.messages.create({
        objet: 'Réponse',
        contenu: replyText.trim(),
        envoyeur: { prenom: user.prenom || 'Vous', matricule: user.matricule },
        messageParent: { id: parentId }
      });
      setReplyingId(null);
      setReplyText('');
      setTick(v => v + 1);
      onPublished('reply');
    } catch (e) {
      onError(e.message);
    } finally {
      setReplySubmitting(false);
    }
  }

  async function reportMessage(id) {
    try {
      await api.messages.report(id, user.matricule);
      setReportedIds(ids => [...ids, id]);
      setTick(v => v + 1);
      onPublished('report');
    } catch (e) {
      onError(e.message);
    }
  }

  function requestPublish(e) {
    e.preventDefault();
    if (!user) return onError('Connectez-vous pour publier.');
    if (!question.trim()) return;
    setConfirmOpen(true);
  }

  async function confirmPublish() {
    setPublishing(true);
    try {
      await api.messages.create({
        objet: subject.trim() || 'Question',
        contenu: question.trim(),
        envoyeur: { prenom: user.prenom || 'Vous', matricule: user.matricule }
      });
      setQuestion('');
      setSubject('');
      setTick(v => v + 1);
      setConfirmOpen(false);
      onPublished();
    } catch (e) {
      setConfirmOpen(false);
      onError(e.message);
    } finally {
      setPublishing(false);
    }
  }

  function resetFilters() {
    setSearch('');
    setRoleFilter('all');
    setSortOrder('');
    setObjetSearch('');
    setDayFilter('');
    setDayPickerOpen(false);
  }

  const baseList = messages.filter(hasVisible);

  // ---- Filtres ----
  const terms = splitTerms(search);
  const objetTerms = splitTerms(objetSearch);
  const filtersActive = terms.length > 0 || objetTerms.length > 0 || roleFilter !== 'all' || !!dayFilter;
  const panelActiveCount = (roleFilter !== 'all' ? 1 : 0) + (objetTerms.length > 0 ? 1 : 0) + (sortOrder ? 1 : 0) + (dayFilter ? 1 : 0);
  const roleSel = COMMENT_ROLE_FILTERS.find(f => f.key === roleFilter);
  const sortSel = COMMENT_SORTS.find(s => s.key === sortOrder);

  // Tri des fils racines (récent par défaut). Les réponses restent en ordre chronologique.
  const sortedList = [...baseList].sort((a, b) => sortOrder === 'oldest' ? messageTime(a) - messageTime(b) : messageTime(b) - messageTime(a)
  );
  const criteria = { role: roleFilter, terms, objetTerms, day: dayFilter };
  const displayList = filtersActive
    ? sortedList.map(item => filterThread(item, criteria)).filter(Boolean)
    : sortedList;

  const chevron = (
    <svg className="filter-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

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
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou par contenu..."
              aria-label="Rechercher par nom ou par contenu" />
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
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <line x1="8" y1="18" x2="16" y2="18" />
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
                        aria-label="Choisir une date" />
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
                      autoFocus />
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
            {dayFilter && <button type="button" className="filter-tag" onClick={() => { setDayFilter(''); setDayPickerOpen(false); }}>Le {formatDay(dayFilter)} ×</button>}
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
            aria-label="Objet" />
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Écrivez votre question ou commentaire..."
            rows="3" />
          <div className="question-actions">
            <button type="button" className="attach-btn" title="Joindre un fichier">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
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
              onDelete={setDeleteId} />
          ))}
        </section>
      </main>
      <Footer />

      {confirmOpen && (
        <ConfirmPublishModal
          busy={publishing}
          onConfirm={confirmPublish}
          onCancel={() => setConfirmOpen(false)} />
      )}

      {deleteId !== null && (
        <ConfirmPublishModal
          busy={deleting}
          title="Suppression du commentaire"
          text={<>Voulez-vous vraiment supprimer<br />ce commentaire ?</>}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)} />
      )}
    </>
  );
}
