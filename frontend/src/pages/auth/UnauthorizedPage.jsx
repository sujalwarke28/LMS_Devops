import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="empty-state" style={{ minHeight: 'calc(100vh - 70px)' }}>
      <ShieldOff size={60} className="empty-state-icon" />
      <h3>Access Denied</h3>
      <p>You don't have permission to view this page. Contact your administrator if you believe this is a mistake.</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
}
