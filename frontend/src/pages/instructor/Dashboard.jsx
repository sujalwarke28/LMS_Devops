import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services';
import { BookOpen, Users, PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService.getMyCourses()
      .then(({ data }) => setCourses(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const totalStudents = courses.reduce((s, c) => s + (c.enrollmentCount || 0), 0);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the course "${title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await courseService.remove(id);
      setCourses(courses.filter(c => c._id !== id));
      toast.success('Course deleted successfully');
    } catch (err) {
      toast.error('Failed to delete course');
      console.error(err);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="dashboard-header">
        <div className="container">
          <p className="dashboard-greeting">Instructor Dashboard</p>
          <h1 className="dashboard-name">Hello, {user?.name?.split(' ')[0]} 🚀</h1>
        </div>
      </div>

      <div className="container section-sm">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--clr-primary-light)', color: 'var(--clr-primary)' }}>
              <BookOpen size={20} />
            </div>
            <div className="stat-card-value">{courses.length}</div>
            <div className="stat-card-label">Total Courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--clr-success-light)', color: 'var(--clr-success)' }}>
              <Users size={20} />
            </div>
            <div className="stat-card-value">{totalStudents}</div>
            <div className="stat-card-label">Total Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--clr-warning-light)', color: 'var(--clr-warning)' }}>
              <Eye size={20} />
            </div>
            <div className="stat-card-value">{courses.filter(c => c.isPublished).length}</div>
            <div className="stat-card-label">Published</div>
          </div>
        </div>

        <div className="section-header">
          <h2 className="section-title">My Courses</h2>
          <Link to="/instructor/courses/create" className="btn btn-primary btn-sm">
            <PlusCircle size={15} /> New Course
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} className="empty-state-icon" />
            <h3>No courses yet</h3>
            <p>Create your first course to start teaching.</p>
            <Link to="/instructor/courses/create" className="btn btn-primary">Create Course</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 500, color: 'var(--clr-text)' }}>{c.title}</td>
                    <td>{c.category}</td>
                    <td>{c.enrollmentCount || 0}</td>
                    <td>
                      <span className={`badge ${c.isPublished ? 'badge-success' : 'badge-warning'}`}>
                        {c.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <Link to={`/instructor/courses/${c._id}/edit`} className="btn btn-ghost btn-sm" title="Edit Course">
                          <Edit size={13} />
                        </Link>
                        <Link to={`/instructor/courses/${c._id}/students`} className="btn btn-ghost btn-sm" title="View Students">
                          <Users size={13} />
                        </Link>
                        <button onClick={() => handleDelete(c._id, c.title)} className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-danger)' }} title="Delete Course">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
