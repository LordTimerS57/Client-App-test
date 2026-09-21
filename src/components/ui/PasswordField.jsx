import { useState } from 'react'
import EyeIcon from './EyeIcon'

export default function PasswordField({ id, name, value, onChange, autoComplete, autoFocus }) {
  const [visible, setVisible] = useState(false)
  const label = visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
  return (
    <div className="password-field">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        placeholder="**********"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required
      />
      <button
        type="button"
        className="eye-toggle"
        onClick={() => setVisible(v => !v)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
      >
        <EyeIcon visible={visible} />
      </button>
    </div>
  )
}
