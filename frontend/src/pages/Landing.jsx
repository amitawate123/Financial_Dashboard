import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ArrowLeftRight,
  LayoutDashboard,
  FileSpreadsheet,
  Moon,
  Zap,
  Shield,
} from 'lucide-react';
import LandingNav from '../components/landing/LandingNav';

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Smart dashboards',
    description: 'Track income, expenses, and trends with charts that update in real time.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Transaction management',
    description: 'Filter, search, and organize every transaction with table and calendar views.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Import & export',
    description: 'Upload Excel sheets or export filtered data as CSV, Excel, or PDF.',
  },
  {
    icon: Zap,
    title: 'Live updates',
    description: 'See changes instantly across tabs when transactions are added or edited.',
  },
  {
    icon: Moon,
    title: 'Dark mode',
    description: 'Comfortable viewing day or night with a theme that follows your preference.',
  },
  {
    icon: Shield,
    title: 'Secure access',
    description: 'Role-based accounts, JWT auth, and email verification for your team.',
  },
];

export default function Landing() {
  return (
    <div className="landing">
      <LandingNav />

      <section className="landing-hero">
        <div className="landing-hero__badge">
          <TrendingUp size={14} />
          Personal finance, simplified
        </div>
        <h1 className="landing-hero__title">
          Your money,
          <br />
          <span className="landing-hero__accent">one clear view.</span>
        </h1>
        <p className="landing-hero__subtitle">
          Fintrack helps you monitor spending, manage transactions, and understand your finances
          with a modern dashboard built for clarity.
        </p>
        <div className="landing-hero__cta">
          <Link to="/login" className="landing-btn landing-btn--lg">
            Live Demo
          </Link>
          <Link to="/register" className="landing-btn landing-btn--secondary landing-btn--lg">
            Create account
          </Link>
        </div>
        <p className="landing-hero__hint">
          Live Demo opens the sign-in page — try demo accounts with no setup required.
        </p>
      </section>

      <section className="landing-features">
        <h2 className="landing-section__title">Everything you need</h2>
        <p className="landing-section__subtitle">
          From daily tracking to exports and admin tools, Fintrack keeps finance workflows in one place.
        </p>
        <div className="landing-features__grid">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <article key={title} className="landing-feature-card">
              <div className="landing-feature-card__icon">
                <Icon size={20} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta-band">
        <h2>Ready to explore?</h2>
        <p>Jump into the dashboard with demo credentials in one click.</p>
        <Link to="/login" className="landing-btn landing-btn--lg">
          Live Demo
        </Link>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Fintrack</span>
        <div className="landing-footer__links">
          <Link to="/login">Sign in</Link>
          <Link to="/register">Register</Link>
        </div>
      </footer>
    </div>
  );
}
