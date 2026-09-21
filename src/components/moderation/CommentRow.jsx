import { AccordionItem } from './AccordionItem';
import { ReplyThread } from './ReplyThread';
import { relativeDate } from '../../utils/dates';
import { commentAuthor, reportCount } from '../../utils/messages';
import { isStaffRole, roleLabel } from '../../utils/roles';

export function CommentRow({ id, item, open, onToggle }) {
  const author = commentAuthor(item);
  const name = author.prenom || 'Utilisateur';
  const content = item.contenu || item.content || '';
  const reports = reportCount(item);
  const allReplies = item.replies || item.messagesReponses || [];
  const replies = allReplies.filter(reply => reply && typeof reply === 'object');
  const countReplies = list => list.reduce((n, r) => n + 1 + countReplies(r.replies || r.messagesReponses || []), 0);
  const repliesCount = item.repliesCount ?? countReplies(replies);
  const published = new Date(item.dateDePublication);
  const fullDate = Number.isNaN(published.getTime())
    ? ''
    : published.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <AccordionItem
      id={id}
      open={open}
      onToggle={onToggle}
      avatar={name[0].toUpperCase()}
      staff={isStaffRole(item.authorRole)}
      title={name}
      roleText={roleLabel(item.authorRole)}
      meta={relativeDate(item.dateDePublication)}
      preview={content}
      aside={<span className="accordion-aside">
        {reports > 0 && <span className="report-badge">{reports} signalement{reports > 1 ? 's' : ''}</span>}
        <span className="replies-count">{repliesCount} réponse{repliesCount > 1 ? 's' : ''}</span>
      </span>}
    >
      {item.parentContent && (
        <p className="accordion-meta">
          ↳ Réponse au commentaire : {item.parentContent.slice(0, 140)}{item.parentContent.length > 140 ? '…' : ''}
        </p>
      )}
      <p className="discussion-content">{content}</p>
      <p className="accordion-meta">
        {[author.matricule && `Matricule ${author.matricule}`, fullDate].filter(Boolean).join(' · ')}
      </p>
      <ReplyThread replies={replies} />
    </AccordionItem>
  );
}
