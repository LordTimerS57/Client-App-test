import { relativeDate } from '../../utils/dates';
import { hasVisible } from '../../utils/messages';
import { roleLabel, isStaffRole } from '../../utils/roles';

export function MessageThread({ item, depth, user, replyingId, replyText, setReplyText, onToggleReply, onSubmitReply, submitting, onReport, reportedIds, editingId, editText, setEditText, onToggleEdit, onSubmitEdit, onDelete }) {
  const author = item.envoyeur || {};
  // Mon propre message : je peux le modifier / supprimer, mais ni y répondre ni le signaler
  const isMine = !!user && !!author.matricule && author.matricule === user.matricule;
  const authorName = isMine ? 'Vous' : (author.prenom || 'Utilisateur');
  const authorRole = roleLabel(author.role);
  const initials = (author.prenom?.[0] || author.nom?.[0] || '?').toUpperCase();
  const isProf = isStaffRole(author.role);
  const timeText = relativeDate(item.dateDePublication);
  const children = (item.replies || item.messagesReponses || []).filter(hasVisible);
  const deleted = item.statut === 'SUPPRIME';
  const canReply = !!user && !isMine && !deleted;
  const canReport = canReply;
  const isReplying = replyingId === item.id;
  const isEditing = editingId === item.id;
  const reported = item.statut === 'SIGNALE' || reportedIds.includes(item.id);
  const repliesCount = item.repliesCount ?? children.length;

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
        <form className="reply-form" onSubmit={e => { e.preventDefault(); onSubmitEdit(item.id); }}>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows="3"
            autoFocus />
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
        <form className="reply-form" onSubmit={e => { e.preventDefault(); onSubmitReply(item.id); }}>
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Écrivez votre réponse..."
            rows="2"
            autoFocus />
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
              onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
