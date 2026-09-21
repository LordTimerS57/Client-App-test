export default function Avatar({ user }) {
  const letter = (user?.prenom?.[0] || user?.nom?.[0] || '?').toUpperCase()
  return <span className="avatar">{letter}</span>
}