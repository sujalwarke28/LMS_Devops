import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { enrollmentService, progressService, certificateService, courseService } from '../../services';
import { BookOpen, Award, Clock, TrendingUp, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      enrollmentService.getMy(),
      certificateService.getMy(),
      courseService.getAll()
    ]).then(([e, c, coursesRes]) => {
      setEnrollments(e.data.data || []);
      setCertificates(c.data.data || []);
      setAllCourses(coursesRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const completed = enrollments.filter(e => e.status === 'completed').length;

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      {/* Dashboard header */}
      <div className="dashboard-header">
        <div className="container">
          <p className="dashboard-greeting">Welcome back,</p>
          <h1 className="dashboard-name">{user?.name} 👋</h1>
        </div>
      </div>

      <div className="container section-sm">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--clr-primary-light)', color: 'var(--clr-primary)' }}>
              <BookOpen size={20} />
            </div>
            <div className="stat-card-value">{enrollments.length}</div>
            <div className="stat-card-label">Enrolled Courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--clr-success-light)', color: 'var(--clr-success)' }}>
              <TrendingUp size={20} />
            </div>
            <div className="stat-card-value">{completed}</div>
            <div className="stat-card-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--clr-warning-light)', color: 'var(--clr-warning)' }}>
              <Award size={20} />
            </div>
            <div className="stat-card-value">{certificates.length}</div>
            <div className="stat-card-label">Certificates</div>
          </div>
        </div>

        {/* Recent enrollments */}
        <div className="section-header">
          <div>
            <h2 className="section-title">Continue Learning</h2>
            <p className="section-subtitle">Pick up where you left off</p>
          </div>
          <Link to="/student/courses" className="btn btn-secondary btn-sm">View all</Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} className="empty-state-icon" />
            <h3>No courses yet</h3>
            <p>Browse our library and enroll in your first course.</p>
            <Link to="/courses" className="btn btn-primary">Browse Courses</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="course-grid">
              {enrollments.slice(0, 6).map((e) => {
                const course = e.course;
                if (!course) return null;
                return (
                  <div key={e._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {course.thumbnailUrl && (
                      <img src={course.thumbnailUrl} alt={course.title}
                        style={{ borderRadius: 'var(--radius)', aspectRatio: '16/9', objectFit: 'cover' }} />
                    )}
                    <span className="course-category">{course.category}</span>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4 }}>{course.title}</h3>
                    <div className="flex items-center justify-between mt-auto">
                      <span className={`badge ${e.status === 'completed' ? 'badge-success' : 'badge-primary'}`}>
                        {e.status}
                      </span>
                      <Link to={`/student/courses/${course._id}/learn`} className="btn btn-primary btn-sm">
                        <Play size={13} /> Continue
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Courses Section */}
        <div className="section-header" style={{ marginTop: '3rem' }}>
          <div>
            <h2 className="section-title">Browse More Courses</h2>
            <p className="section-subtitle">Discover new skills and elevate your career</p>
          </div>
        </div>

        {allCourses.length === 0 ? (
          <p style={{ color: 'var(--clr-text-muted)' }}>No courses available right now.</p>
        ) : (
          <div className="course-grid">
            {allCourses.map((c) => (
              <div key={c._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {c.thumbnailUrl ? (
                  <img src={c.thumbnailUrl} alt={c.title} style={{ borderRadius: 'var(--radius)', aspectRatio: '16/9', objectFit: 'cover' }} />
                ) : (
                  <div style={{ borderRadius: 'var(--radius)', aspectRatio: '16/9', background: 'var(--clr-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={32} style={{ color: 'var(--clr-text-muted)' }} />
                  </div>
                )}
                <span className="course-category">{c.category}</span>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4 }}>{c.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto' }}>
                  {c.instructor?.photoURL ? (
                    <img src={c.instructor.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--clr-primary-light)' }} />
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{c.instructor?.name || 'Instructor'}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span style={{ fontWeight: 600, color: 'var(--clr-primary)' }}>
                    {c.isFree ? 'Free' : `$${c.price}`}
                  </span>
                  <Link to={`/courses/${c.slug}`} className="btn btn-secondary btn-sm">
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
