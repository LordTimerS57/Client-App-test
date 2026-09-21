// Recherche insensible à la casse et aux accents
export const norm = text =>
  String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const splitTerms = text => norm(text).split(/\s+/).filter(Boolean)