import logo from '../../assets/logo.jpg'

export default function Logo({ className = "logo-svg" }) {
  return (
    <img
      className={className}
      src={logo}
      alt="Logo"
    />
  )
}
