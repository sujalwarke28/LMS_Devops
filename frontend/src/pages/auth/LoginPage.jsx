import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap } from 'lucide-react';

const ROLE_HOME = { student: '/student/dashboard', instructor: '/instructor/dashboard', admin: '/admin/dashboard' };

export default function LoginPage() {
  const { user, loading, loginWithGoogle } = useAuth();

  if (!loading && user) {
    return <Navigate to={ROLE_HOME[user.role] || '/courses'} replace />;
  }

  return (
    <div className="login-page">
      {/* Left visual */}
      <div className="login-visual">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🎓</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
            DevOPS LMS
          </h2>
          <p style={{ color: 'var(--clr-text-muted)', maxWidth: 320, lineHeight: 1.7 }}>
            An enterprise-grade Learning Management System built with modern DevOps practices —
            containerized, auto-scaled, and continuously deployed.
          </p>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '2.5rem' }}>
            {['Docker', 'Kubernetes', 'Terraform', 'Jenkins'].map((tech) => (
              <div key={tech} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '0.5rem 0.85rem',
                fontSize: '0.75rem',
                color: 'var(--clr-text-muted)',
                fontWeight: 500,
              }}>{tech}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="login-form-side">
        <div className="login-box">
          <div className="login-logo">
            <GraduationCap size={32} />
            DevOPS LMS
          </div>
          <div>
            <h1 className="login-heading">Welcome back</h1>
            <p className="login-sub">Sign in to access your learning dashboard</p>
          </div>

          <button
            className="google-btn"
            onClick={loginWithGoogle}
            disabled={loading}
            id="google-signin-btn"
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
            New accounts default to the <strong style={{ color: 'var(--clr-text-muted)' }}>Student</strong> role.
          </p>
        </div>
      </div>
    </div>
  );
}
