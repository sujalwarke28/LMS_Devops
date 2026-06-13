import { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { Search, UserCheck, UserX, Shield, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (role) params.role = role;
      const { data } = await adminService.getUsers(params);
      setUsers(data.data || []);
      setPagination(data.pagination || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [page, role]);
  useEffect(() => { const t = setTimeout(fetch, 400); return () => clearTimeout(t); }, [search]);

  const changeRole = async (userId, newRole) => {
    try {
      await adminService.updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success(`Role changed to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change role');
    }
  };

  const toggleStatus = async (userId) => {
    try {
      const { data } = await adminService.toggleStatus(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: data.data.isActive } : u));
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Permanently delete this user?')) return;
    try {
      await adminService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">User Management</h1>
          <p className="section-subtitle">{pagination.total || 0} total users</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input className="search-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : users.map(u => (
              <tr key={u._id}>
                <td>
                  <div className="flex items-center gap-2">
                    <img src={u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=32&background=6366f1&color=fff`}
                      style={{ width: 32, height: 32, borderRadius: '50%' }} alt="" />
                    <span style={{ fontWeight: 500, color: 'var(--clr-text)' }}>{u.name}</span>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <select
                    className="form-select"
                    style={{ width: 'auto', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                    value={u.role}
                    onChange={e => changeRole(u._id, e.target.value)}
                  >
                    <option value="student">student</option>
                    <option value="instructor">instructor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(u._id)} title={u.isActive ? 'Deactivate' : 'Activate'}>
                      {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u._id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}
    </div>
  );
}
