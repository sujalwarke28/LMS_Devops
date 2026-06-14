import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap, BookOpen, LayoutDashboard, Users, BarChart3,
  LogOut, Menu, X, ChevronDown, Award, Sun, Moon
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const navLinks = {
  student: [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Courses', href: '/student/courses', icon: BookOpen },
    { label: 'Certificates', href: '/student/certificates', icon: Award },
  ],
  instructor: [
    { label: 'Dashboard', href: '/instructor/dashboard', icon: LayoutDashboard },
    { label: 'My Courses', href: '/instructor/courses', icon: BookOpen },
    { label: 'Students', href: '/instructor/students', icon: Users },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Courses', href: '/admin/courses', icon: BookOpen },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ],
};

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const dropdownRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    let timer;
    if (profileOpen) {
      timer = setTimeout(() => {
        setProfileOpen(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [profileOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const links = user ? navLinks[user.role] || [] : [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <GraduationCap className="navbar-brand-icon" />
          <span>Engrail</span>
        </Link>

        {/* Desktop nav links */}
        <div className="navbar-links">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`navbar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
          {!user && (
            <Link to="/courses" className="navbar-link">
              <BookOpen size={16} /> Browse Courses
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {user ? (
            <div className="profile-menu" ref={dropdownRef}>
              <button
                className="profile-trigger"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
                  alt={user.name}
                  className="avatar"
                />
                <span className="profile-name">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} />
              </button>
              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-info">
                    <p className="profile-fullname">{user.name}</p>
                    <p className="profile-email">{user.email}</p>
                    <span className={`role-badge role-${user.role}`}>{user.role}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={handleLogout}>
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}

          {/* Mobile hamburger */}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                to={link.href}
                className="mobile-menu-link"
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
          {user && (
            <button className="mobile-menu-link mobile-logout" onClick={handleLogout}>
              <LogOut size={18} /> Sign out
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
