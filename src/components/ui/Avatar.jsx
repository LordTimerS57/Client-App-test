export default function Avatar({ user, name = 'F' }) {
  const letter = user?.prenom?.[0] || name[0] || 'F'
  return <span className="avatar">{letter}</span>
}
