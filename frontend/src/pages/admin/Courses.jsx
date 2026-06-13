import { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { BookOpen } from 'lucide-react';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminService.getCourses({ page, limit: 20 })
      .then(({ data }) => { setCourses(data.data || []); setPagination(data.pagination || {}); })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">All Courses</h1>
          <p className="section-subtitle">{pagination.total || 0} total courses</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Instructor</th>
              <th>Category</th>
              <th>Students</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : courses.map(c => (
              <tr key={c._id}>
                <td style={{ fontWeight: 500, color: 'var(--clr-text)' }}>{c.title}</td>
                <td>{c.instructor?.name || '—'}</td>
                <td>{c.category}</td>
                <td>{c.enrollmentCount || 0}</td>
                <td><span className={`badge ${c.isPublished ? 'badge-success' : 'badge-warning'}`}>{c.isPublished ? 'Published' : 'Draft'}</span></td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
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
