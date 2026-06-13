import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { enrollmentService } from '../../services';
import { Play, Trash2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentService.getMy()
      .then(({ data }) => setEnrollments(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const handleDrop = async (courseId) => {
    if (!confirm('Are you sure you want to unenroll from this course?')) return;
    try {
      await enrollmentService.drop(courseId);
      setEnrollments((prev) => prev.filter((e) => e.course?._id !== courseId));
      toast.success('Unenrolled successfully');
    } catch (err) {
      toast.error('Failed to unenroll');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">My Courses</h1>
          <p className="section-subtitle">{enrollments.length} enrolled course{enrollments.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/courses" className="btn btn-primary btn-sm">Browse More</Link>
      </div>

      {enrollments.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} className="empty-state-icon" />
          <h3>No enrollments yet</h3>
          <Link to="/courses" className="btn btn-primary">Browse Courses</Link>
        </div>
      ) : (
        <div className="course-grid">
          {enrollments.map((e) => {
            const course = e.course;
            if (!course) return null;
            return (
              <div key={e._id} className="course-card">
                <div className="course-card-thumb">
                  {course.thumbnailUrl
                    ? <img src={course.thumbnailUrl} alt={course.title} />
                    : <div className="course-card-thumb-placeholder"><BookOpen size={36} /></div>
                  }
                  <span className={`badge ${e.status === 'completed' ? 'badge-success' : 'badge-primary'}`}
                    style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                    {e.status}
                  </span>
                </div>
                <div className="course-card-body">
                  <span className="course-category">{course.category}</span>
                  <h3 className="course-title">{course.title}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-dim)' }}>
                    Enrolled {new Date(e.enrolledAt).toLocaleDateString()}
                  </p>
                  <div className="course-card-footer">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDrop(course._id)}
                      title="Unenroll"
                    >
                      <Trash2 size={14} />
                    </button>
                    <Link to={`/student/courses/${course._id}/learn`} className="btn btn-primary btn-sm">
                      <Play size={13} /> {e.status === 'completed' ? 'Review' : 'Continue'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
