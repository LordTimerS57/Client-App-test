import Avatar from '../ui/Avatar';
import Logo from '../ui/Logo';

export function Header({ user, navigate, onMenu, onAccount, screen }) {
  const isHome = screen === 'home';
  return (
    <header className={`topbar ${!isHome ? 'topbar-light' : ''}`}>
      <div className="topbar-left">
        {!isHome && (
          <button className="menu-button" onClick={onMenu} title="Menu">
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1H17M1 7H17M1 13H17" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <button className="brand-button" onClick={() => navigate('home')}>
          <Logo className="header-logo" />
        </button>
      </div>
      <nav className="header-nav">
        <button className="contact-link">Contact</button>
        {user ? (
          <button className="profile-trigger" onClick={onAccount}>
            <Avatar user={user} />
            <span className="chevron-down">⌄</span>
          </button>
        ) : (
          <button className="register-link" onClick={() => navigate('register')}>S'inscrire</button>
        )}
      </nav>
    </header>
  );
}
