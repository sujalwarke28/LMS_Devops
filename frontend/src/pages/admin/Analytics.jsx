import { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then(({ data }) => setStats(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!stats) return <div className="empty-state"><h3>Analytics unavailable</h3></div>;

  const userRoleData = stats.usersByRole?.map(r => ({ name: r._id, value: r.count })) || [];
  const categoryData = stats.coursesByCategory?.map(c => ({ name: c._id, courses: c.count })) || [];

  return (
    <div className="container section">
      <div className="section-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <h1 className="section-title">Platform Analytics</h1>
        <p className="section-subtitle">Real-time overview of platform activity</p>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Total Users', value: stats.totalUsers },
          { label: 'Total Courses', value: stats.totalCourses },
          { label: 'Total Enrollments', value: stats.totalEnrollments },
          { label: 'Avg Enrollments/Course', value: stats.totalCourses ? Math.round(stats.totalEnrollments / stats.totalCourses) : 0 },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card">
            <div className="stat-card-value">{value?.toLocaleString()}</div>
            <div className="stat-card-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="card-title mb-3">User Distribution by Role</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={userRoleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {userRoleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: 8, color: 'var(--clr-text)' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="card-title mb-3">Courses per Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryData} layout="vertical">
              <XAxis type="number" tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }} width={100} />
              <Tooltip contentStyle={{ background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', borderRadius: 8, color: 'var(--clr-text)' }} />
              <Bar dataKey="courses" fill="var(--clr-primary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
