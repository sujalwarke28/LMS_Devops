import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { courseService, progressService } from '../../services';
import { Users } from 'lucide-react';

export default function CourseStudents() {
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      courseService.getEnrolledStudents(id),
      progressService.getStudentProgress(id),
    ]).then(([e, p]) => {
      const progressMap = {};
      (p.data.data || []).forEach(pr => {
        progressMap[pr.student?._id] = pr.percentageComplete;
      });
      const merged = (e.data.data || []).map(en => ({
        ...en,
        progress: progressMap[en.student?._id] || 0,
      }));
      setStudents(merged);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">Enrolled Students</h1>
          <p className="section-subtitle">{students.length} students enrolled</p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="empty-state">
          <Users size={48} className="empty-state-icon" />
          <h3>No students yet</h3>
          <p>Publish your course to start getting enrollments.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Enrolled At</th>
                <th>Status</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {students.map((e) => (
                <tr key={e._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <img
                        src={e.student?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.student?.name || 'U')}&size=32&background=6366f1&color=fff`}
                        style={{ width: 32, height: 32, borderRadius: '50%' }}
                        alt=""
                      />
                      <span style={{ fontWeight: 500, color: 'var(--clr-text)' }}>{e.student?.name}</span>
                    </div>
                  </td>
                  <td>{e.student?.email}</td>
                  <td>{new Date(e.enrolledAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${e.status === 'completed' ? 'badge-success' : 'badge-primary'}`}>{e.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 120 }}>
                      <div className="progress-bar-outer" style={{ flex: 1, height: 6 }}>
                        <div className="progress-bar-fill" style={{ width: `${e.progress}%` }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', flexShrink: 0 }}>{e.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
