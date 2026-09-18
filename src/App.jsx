import { useEffect, useState } from 'react'
import { api } from './api'
import './styles.css'

const emptyMessage = { objet: '', contenu: '', envoyeur: '', receveur: '' }

function App() {
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [messageForm, setMessageForm] = useState(emptyMessage)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [loadedUsers, loadedMessages] = await Promise.all([api.users.list(), api.messages.list()])
      setUsers(loadedUsers)
      setMessages(loadedMessages)
      if (!messageForm.envoyeur && loadedUsers[0]) {
        setMessageForm((current) => ({ ...current, envoyeur: loadedUsers[0].matricule }))
      }
    } catch (err) {
      setError(`Impossible de joindre le service Java : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  function updateForm(event) {
    setMessageForm({ ...messageForm, [event.target.name]: event.target.value })
  }

  async function createMessage(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    const sender = users.find((user) => user.matricule === messageForm.envoyeur)
    const receiver = users.find((user) => user.matricule === messageForm.receveur)
    if (!sender) return setError('Sélectionnez un envoyeur.')
    try {
      await api.messages.create({
        objet: messageForm.objet,
        contenu: messageForm.contenu,
        envoyeur: { matricule: sender.matricule },
        ...(receiver ? { receveur: { matricule: receiver.matricule } } : {}),
      })
      setMessageForm({ ...emptyMessage, envoyeur: sender.matricule })
      setNotice('Message créé avec succès.')
      await loadData()
    } catch (err) {
      setError(`Création impossible : ${err.message}`)
    }
  }

  async function reportMessage(id) {
    try { await api.messages.report(id); await loadData() } catch (err) { setError(err.message) }
  }

  return (
    <main className="container">
      <header className="hero">
        <div><span className="eyebrow">CLIENT APP TEST</span><h1>Portail de services</h1><p>Une interface React connectée à Java-Services-Test.</p></div>
        <button className="secondary" onClick={loadData}>Actualiser</button>
      </header>
      {error && <div className="alert error">{error}</div>}
      {notice && <div className="alert success">{notice}</div>}
      <section className="stats"><div><strong>{users.length}</strong><span>utilisateurs</span></div><div><strong>{messages.length}</strong><span>messages publics</span></div></section>
      <section className="grid">
        <div className="panel"><div className="panel-heading"><h2>Utilisateurs</h2><span>{loading ? 'Chargement…' : 'Connecté'}</span></div>{users.length === 0 && !loading ? <p className="muted">Aucun utilisateur trouvé.</p> : <ul className="user-list">{users.map((user) => <li key={user.matricule}><div className="avatar">{user.prenom?.[0]}{user.nom?.[0]}</div><div><strong>{user.prenom} {user.nom}</strong><small>{user.matricule} · {user.role}</small></div></li>)}</ul>}</div>
        <div className="panel"><h2>Publier un message</h2><form onSubmit={createMessage}><label>Envoyeur<select name="envoyeur" value={messageForm.envoyeur} onChange={updateForm} required><option value="">Choisir…</option>{users.map((user) => <option key={user.matricule} value={user.matricule}>{user.prenom} {user.nom}</option>)}</select></label><label>Destinataire <span>(facultatif)</span><select name="receveur" value={messageForm.receveur} onChange={updateForm}><option value="">Message public</option>{users.map((user) => <option key={user.matricule} value={user.matricule}>{user.prenom} {user.nom}</option>)}</select></label><label>Objet<input name="objet" value={messageForm.objet} onChange={updateForm} maxLength="50" required /></label><label>Contenu<textarea name="contenu" value={messageForm.contenu} onChange={updateForm} rows="4" required /></label><button type="submit">Publier</button></form></div>
      </section>
      <section className="panel messages"><div className="panel-heading"><h2>Messages publics</h2><span>GET /api/messages</span></div>{messages.length === 0 ? <p className="muted">Aucun message public.</p> : messages.map((message) => <article className="message" key={message.id}><div><h3>{message.objet}</h3><p>{message.contenu}</p><small>Par {message.envoyeur?.prenom} {message.envoyeur?.nom} · {message.dateDePublication ? new Date(message.dateDePublication).toLocaleString('fr-FR') : ''}</small></div><button className="link" onClick={() => reportMessage(message.id)}>Signaler</button></article>)}</section>
    </main>
  )
}

export default App
