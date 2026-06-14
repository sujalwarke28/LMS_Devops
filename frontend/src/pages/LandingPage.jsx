import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Zap, Shield, BarChart3, Play, Award, ArrowRight, Star } from 'lucide-react';

const features = [
  { icon: Play, title: 'Video Learning', desc: 'HD video lectures with progress tracking and signed secure streaming.' },
  { icon: Award, title: 'Certificates', desc: 'Earn verifiable certificates upon completing any course.' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Student, Instructor, and Admin roles with granular permissions.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Real-time dashboards for instructors and platform admins.' },
  { icon: Zap, title: 'Quizzes', desc: 'Auto-graded quizzes with instant feedback and attempt limits.' },
  { icon: GraduationCap, title: 'DevOps Native', desc: 'Containerized, deployed on Kubernetes with CI/CD automation.' },
];

export default function LandingPage() {
  const { user } = useAuth();

  const dashboardLink = user
    ? `/${user.role}/dashboard`
    : '/courses';

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <span className="hero-eyebrow">
              <Zap size={14} />
              Enterprise Learning Management System
            </span>
            <h1 className="hero-title">
              Learn. Build. <span className="gradient-text">Deploy.</span>
            </h1>
            <p className="hero-subtitle">
              A production-grade learning management system with Google Authentication, role-based dashboards,
              live video lectures, auto-graded quizzes, and verifiable certificates — all running
              on Kubernetes.
            </p>
            <div className="hero-actions">
              <Link to={dashboardLink} className="btn btn-primary btn-lg">
                {user ? 'Go to Dashboard' : 'Browse Courses'} <ArrowRight size={18} />
              </Link>
              {!user && (
                <Link to="/login" className="btn btn-secondary btn-lg">
                  Sign In with Google
                </Link>
              )}
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-value">3</div>
                <div className="hero-stat-label">User Roles</div>
              </div>
              <div>
                <div className="hero-stat-value">K8s</div>
                <div className="hero-stat-label">Deployed</div>
              </div>
              <div>
                <div className="hero-stat-value">CI/CD</div>
                <div className="hero-stat-label">Automated</div>
              </div>
              <div>
                <div className="hero-stat-value">HPA</div>
                <div className="hero-stat-label">Auto-scale</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <h2 className="section-title">Everything you need</h2>
            <p className="section-subtitle">Built with industry-grade DevOps practices from the ground up</p>
          </div>
          <div className="course-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card" style={{ gap: '0.75rem', display: 'flex', flexDirection: 'column' }}>
                  <div className="stat-card-icon" style={{ background: 'var(--clr-primary-light)', color: 'var(--clr-primary)' }}>
                    <Icon size={22} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{f.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-sm">
        <div className="container">
          <div className="certificate-card">
            <h2 className="section-title mb-2">Ready to get started?</h2>
            <p className="text-muted mb-3">Join the platform. Sign in with Google and start learning today.</p>
            <Link to="/login" className="btn btn-primary btn-lg">
              Start Learning <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>© 2024 Engrail — Enterprise Learning Management Ecosystem</p>
        </div>
      </footer>
    </>
  );
}
