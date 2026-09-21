// Mode démo (sans backend) : stockage local et règles de compte

export const mockStore = {
  getUsers: () => JSON.parse(localStorage.getItem('nl_users') || '[]'),
  saveUsers: (u) => localStorage.setItem('nl_users', JSON.stringify(u)),
  getMessages: () => JSON.parse(localStorage.getItem('nl_messages') || '[]'),
  saveMessages: (m) => localStorage.setItem('nl_messages', JSON.stringify(m))
}

export function withoutPassword(user) {
  const { motDePasse, ...safe } = user
  return safe
}

// Mêmes règles et mêmes messages que UserAccountResource.
// `check` (règles métier) s'exécute APRÈS la vérification du mot de passe, comme sur le serveur.
export function mockUpdateUser(user, changes, { currentPassword, check, verify = true } = {}) {
  const users = mockStore.getUsers()
  const index = users.findIndex(u =>
    (user?.matricule && u.matricule === user.matricule) || (user?.email && u.email === user.email)
  )

  if (verify) {
    if (index >= 0) {
      if (users[index].motDePasse !== currentPassword) throw new Error('Mot de passe incorrect')
    } else if (!currentPassword) {
      // Session de démonstration (aucun compte enregistré) : toute confirmation non vide est acceptée
      throw new Error('Mot de passe incorrect')
    }
  }

  check?.(users)

  if (index >= 0) {
    users[index] = { ...users[index], ...changes }
    mockStore.saveUsers(users)
    return withoutPassword(users[index])
  }
  return withoutPassword({ ...user, ...changes })
}

// Une variable importée ne peut pas être réassignée depuis un autre module :
// on passe par un objet mutable (mockState.passwordChange = ...)
export const mockState = { passwordChange: null } // { code, newPassword }

// Aplatit l'arbre : commentaires racines + réponses à tous les niveaux.
// Chaque réponse garde le texte de son parent, pour donner le contexte à l'admin.
export const flattenMessages = (list, parent = null) =>
  list.flatMap(m => [
    parent ? { ...m, parentContent: parent.contenu || parent.content } : m,
    ...flattenMessages(m.replies || m.messagesReponses || [], m)
  ])
