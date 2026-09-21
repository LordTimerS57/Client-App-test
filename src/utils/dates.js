export function relativeDate(value) {
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

export const toDayKey = value => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const formatDay = key =>
  (key ? new Date(`${key}T00:00:00`).toLocaleDateString('fr-FR') : '')

export const byDateDesc = (a, b) =>
  (Date.parse(b?.dateDePublication) || 0) - (Date.parse(a?.dateDePublication) || 0)