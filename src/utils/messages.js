import { norm } from './text'
import { roleKey } from './roles'
import { toDayKey } from './dates'

export const COMMENT_ROLE_FILTERS = [
  { key: 'prof', label: 'Prof' },
  { key: 'etudiant', label: 'Étudiants' }
]
export const COMMENT_SORTS = [
  { key: 'oldest', label: 'Ancienne' },
  { key: 'recent', label: 'Récente' }
]

// Nombre de signalements (le champ exact dépend du backend : booléen, nombre ou liste)
export const reportCount = message => {
  if (message?.statut === 'SIGNALE') return 1
  const value = message?.signale ?? message?.signaled ?? message?.reported ?? message?.signalements ?? message?.nbSignalements
  if (Array.isArray(value)) return value.length
  if (typeof value === 'number') return value
  return value === true || value === 'true' ? 1 : 0
}

export const hasVisible = m =>
  m.statut !== 'SUPPRIME' || (m.replies || m.messagesReponses || []).some(hasVisible)

// Attention : l'ordre de priorité diffère entre les deux (comportement d'origine conservé)
export const commentAuthor = item => item.envoyeur || item.author || {}
export const messageAuthor = m => m.author || m.envoyeur || {}
export const messageText = m => m.contenu || m.content || ''
export const messageChildren = m => m.replies || m.messagesReponses || []
export const messageTime = m => Date.parse(m?.dateDePublication) || 0

// Garde un message s'il correspond aux critères, ou si l'une de ses réponses correspond
// (le parent reste alors affiché pour donner le contexte).
export function filterThread(node, criteria, parentObjet = '') {
  const objetPath = `${parentObjet} ${node.objet || ''}`
  const children = messageChildren(node)
    .map(child => filterThread(child, criteria, objetPath))
    .filter(Boolean)

  const author = messageAuthor(node)
  const haystack = norm(`${author.prenom || ''} ${author.nom || ''} ${messageText(node)}`)
  const objetHaystack = norm(objetPath)

  const matches =
    node.statut !== 'SUPPRIME' &&
    (criteria.role === 'all' || roleKey(author.role) === criteria.role) &&
    (!criteria.day || toDayKey(node.dateDePublication) === criteria.day) &&
    criteria.terms.every(term => haystack.includes(term)) &&
    criteria.objetTerms.every(term => objetHaystack.includes(term))

  if (!matches && children.length === 0) return null
  return { ...node, replies: children, messagesReponses: children, repliesCount: children.length }
}

export const flattenMessages = (list, parent = null) =>
  list.flatMap(m => [
    parent ? { ...m, parentContent: parent.contenu || parent.content } : m,
    ...flattenMessages(messageChildren(m), m)
  ])