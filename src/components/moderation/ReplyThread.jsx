import { isStaffRole, roleLabel } from '../../utils/roles';

export function ReplyThread({ replies }) {
  if (!replies || replies.length === 0) return null;
  return (
    <div className="replies-container">
      {replies.map((reply, index) => {
        const replyAuthor = reply.author || reply.envoyeur || {};
        const children = reply.replies || reply.messagesReponses || [];
        return (
          <div className="reply-card" key={reply.id ?? index}>
            <div className="author-title">
              <strong>{replyAuthor.prenom || 'Utilisateur'}</strong>
              <span className={`role-badge ${isStaffRole(replyAuthor.role) ? 'prof-badge' : ''}`}>
                {roleLabel(replyAuthor.role)}
              </span>
            </div>
            <p className="reply-content">{reply.content || reply.contenu}</p>
            <ReplyThread replies={children} />
          </div>
        );
      })}
    </div>
  );
}
