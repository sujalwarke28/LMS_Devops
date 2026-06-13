import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, enrollmentService } from '../services';
import { useAuth } from '../context/AuthContext';
import { Clock, Play, Users, BookOpen, Star, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const formatDuration = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export default function CourseDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    courseService.getBySlug(slug)
      .then(({ data }) => setCourse(data.data))
      .catch(() => toast.error('Course not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleEnroll = async () => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'student') { toast.error('Only students can enroll'); return; }
    setEnrolling(true);
    try {
      await enrollmentService.enroll(course._id);
      toast.success('Enrolled successfully!');
      navigate(`/student/courses/${course._id}/learn`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!course) return <div className="empty-state"><h3>Course not found</h3></div>;

  return (
    <div style={{ background: 'var(--clr-bg)' }}>
      {/* Course hero */}
      <div style={{ background: 'linear-gradient(135deg, #13131a, #1a1030)', borderBottom: '1px solid var(--clr-border)', padding: '3rem 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '3rem', alignItems: 'start' }}>
          <div>
            <span className="course-category" style={{ marginBottom: '0.75rem', display: 'block' }}>{course.category}</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, lineHeight: 1.2, marginBottom: '1rem' }}>
              {course.title}
            </h1>
            <p style={{ color: 'var(--clr-text-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>{course.shortDescription || course.description}</p>
            {course.rating?.count > 0 && (
              <div className="flex items-center gap-1 mb-2" style={{ color: 'var(--clr-warning)' }}>
                <Star size={16} fill="currentColor" />
                <strong>{course.rating.average.toFixed(1)}</strong>
                <span style={{ color: 'var(--clr-text-dim)', fontSize: '0.85rem' }}>({course.rating.count} ratings)</span>
              </div>
            )}
            {course.instructor && (
              <div className="flex items-center gap-1" style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
                <img src={course.instructor.photoURL || `https://ui-avatars.com/api/?name=${course.instructor.name}`} className="instructor-avatar-sm" alt="" />
                By <strong>{course.instructor.name}</strong>
              </div>
            )}
          </div>

          {/* Enrollment card */}
          <div className="card" style={{ position: 'sticky', top: '80px' }}>
            {course.thumbnailUrl && (
              <img src={course.thumbnailUrl} alt={course.title} style={{ borderRadius: 'var(--radius)', marginBottom: '1rem', width: '100%' }} />
            )}
            <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>
              {course.isFree ? <span style={{ color: 'var(--clr-success)' }}>Free</span> : `$${course.price}`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '1.25rem' }}>
              <span className="flex items-center gap-1"><Play size={14} /> {course.lectures?.length || 0} lectures</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {formatDuration(course.totalDuration || 0)}</span>
              <span className="flex items-center gap-1"><Users size={14} /> {course.enrollmentCount || 0} students</span>
              <span className="flex items-center gap-1"><BookOpen size={14} /> {course.level}</span>
            </div>
            <button
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center' }}
              onClick={handleEnroll}
              disabled={enrolling}
              id={`enroll-${course._id}`}
            >
              {enrolling ? 'Enrolling...' : 'Enroll Now — It\'s Free'}
            </button>
          </div>
        </div>
      </div>

      <div className="container section">
        {/* Outcomes */}
        {course.outcomes?.length > 0 && (
          <div className="card mb-3">
            <h2 className="card-title mb-2">What you'll learn</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {course.outcomes.map((o, i) => (
                <p key={i} style={{ fontSize: '0.88rem', display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--clr-success)' }}>✓</span> {o}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Curriculum */}
        <div className="card">
          <h2 className="card-title mb-3">Course Curriculum</h2>
          {course.lectures?.map((lecture, i) => (
            <div
              key={lecture._id}
              style={{ borderBottom: '1px solid var(--clr-border)', padding: '0.85rem 0' }}
            >
              <div className="flex items-center justify-between" style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === i ? null : i)}>
                <div className="flex items-center gap-2">
                  {lecture.isPreview
                    ? <Play size={15} style={{ color: 'var(--clr-primary)' }} />
                    : <Lock size={15} style={{ color: 'var(--clr-text-dim)' }} />
                  }
                  <span style={{ fontSize: '0.9rem' }}>{lecture.title}</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: 'var(--clr-text-dim)', fontSize: '0.8rem' }}>
                  {lecture.duration > 0 && <span>{formatDuration(lecture.duration)}</span>}
                  {expanded === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>
              {expanded === i && lecture.description && (
                <p style={{ fontSize: '0.83rem', color: 'var(--clr-text-muted)', paddingLeft: '1.75rem', marginTop: '0.4rem' }}>
                  {lecture.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
