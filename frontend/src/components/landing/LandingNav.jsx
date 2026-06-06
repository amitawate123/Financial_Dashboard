import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

export default function LandingNav() {
  return (
    <header className="landing-nav">
      <Link to="/" className="landing-nav__brand">
        <span className="landing-nav__logo">
          <TrendingUp size={18} color="var(--logo-fg)" />
        </span>
        <span>
          <span className="landing-nav__name">Fintrack</span>
          <span className="landing-nav__tag">Finance Dashboard</span>
        </span>
      </Link>
      <div className="landing-nav__actions">
        <ThemeToggle compact />
        <Link to="/login" className="landing-nav__signin">
          Sign in
        </Link>
        <Link to="/login" className="landing-btn landing-btn--sm">
          Live Demo
        </Link>
      </div>
    </header>
  );
}
