import { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { Users, BookOpen, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then(({ data }) => setStats(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!stats) return <div className="empty-state"><h3>Failed to load stats</h3></div>;

  return (
    <div>
      <div className="dashboard-header">
        <div className="container">
          <p className="dashboard-greeting">Admin Panel</p>
          <h1 className="dashboard-name">Platform Overview 📊</h1>
        </div>
      </div>

      <div className="container section-sm">
        {/* KPI cards */}
        <div className="stats-grid">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'primary' },
            { label: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'accent' },
            { label: 'Total Enrollments', value: stats.totalEnrollments, icon: TrendingUp, color: 'success' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <div className="stat-card-icon" style={{ background: `var(--clr-${color}-light, var(--clr-primary-light))`, color: `var(--clr-${color}, var(--clr-primary))` }}>
                <Icon size={20} />
              </div>
              <div className="stat-card-value">{value?.toLocaleString()}</div>
              <div className="stat-card-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Users by role */}
          <div className="card">
            <h3 className="card-title mb-3">Users by Role</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.usersByRole?.map(r => ({ name: r._id, value: r.count }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats.usersByRole?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: 8, color: 'var(--clr-text)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Courses by category */}
          <div className="card">
            <h3 className="card-title mb-3">Courses by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.coursesByCategory?.map(c => ({ name: c._id, count: c.count }))}>
                <XAxis dataKey="name" tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: 8, color: 'var(--clr-text)' }} />
                <Bar dataKey="count" fill="var(--clr-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent users */}
        <div className="card">
          <h3 className="card-title mb-3">Recent Users</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers?.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <img src={u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=32&background=6366f1&color=fff`}
                          style={{ width: 32, height: 32, borderRadius: '50%' }} alt="" />
                        <span style={{ fontWeight: 500, color: 'var(--clr-text)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
