import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { courseService, progressService, quizService } from '../../services';
import { CheckCircle, Circle, PlayCircle, FileText, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function LearnCourse() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      courseService.getAll({ limit: 1 }),  // fallback — fetch course by id differently
      progressService.get(courseId),
      quizService.getByCourse(courseId),
    ]).catch(() => {}).finally(() => setLoading(false));

    // Fetch course details for learning view (using id)
    fetch(`/api/v1/courses/${courseId}`)
      .catch(() => {});
  }, [courseId]);

  useEffect(() => {
    // Re-fetch course by courseId directly
    import('../../services').then(({ courseService, progressService, quizService }) => {
      Promise.all([
        progressService.get(courseId),
        quizService.getByCourse(courseId),
      ]).then(([p, q]) => {
        setProgress(p.data.data);
        setQuizzes(q.data.data || []);
      }).catch(() => {});
    });
    // Use the courseId to get course details via our api
    import('../../services/api').then(({ default: api }) => {
      api.get(`/courses/${courseId}`).then(({ data }) => {
        setCourse(data.data);
        if (data.data?.lectures?.length > 0) {
          setCurrentLecture(data.data.lectures[0]);
        }
      }).catch(() => {}).finally(() => setLoading(false));
    });
  }, [courseId]);

  const selectLecture = async (lecture) => {
    setCurrentLecture(lecture);
    setStreamUrl(null);
    try {
      const { data } = await courseService.getStreamUrl(courseId, lecture._id);
      setStreamUrl(data.data.signedUrl);
    } catch (err) {
      toast.error('Could not load video. Please try again.');
    }
  };

  const markComplete = async () => {
    if (!currentLecture) return;
    try {
      const { data } = await progressService.markComplete(courseId, currentLecture._id, { watchedSeconds: 0 });
      setProgress(data.data);
      toast.success('Lecture marked as complete!');
      if (data.data.isCompleted) {
        toast.success('🎉 Course completed! Generate your certificate.', { duration: 5000 });
      }
    } catch (err) {
      toast.error('Failed to mark complete');
    }
  };

  const isCompleted = (lectureId) =>
    progress?.completedLectures?.some(l => l.lectureId === lectureId || l.lectureId?.toString() === lectureId?.toString());

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!course) return <div className="empty-state"><h3>Course not found or not enrolled</h3></div>;

  return (
    <div className="learn-layout">
      {/* Main content */}
      <div>
        {currentLecture ? (
          <>
            <div className="video-player-wrapper" style={{ marginBottom: '1.5rem' }}>
              {streamUrl ? (
                <ReactPlayer url={streamUrl} controls width="100%" height="100%" />
              ) : (
                <div style={{
                  width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', background: '#000',
                  borderRadius: 'var(--radius-lg)', minHeight: 320, color: 'var(--clr-text-muted)', gap: '1rem'
                }}>
                  <PlayCircle size={60} style={{ opacity: 0.3 }} />
                  <button className="btn btn-primary" onClick={() => selectLecture(currentLecture)}>
                    Load Video
                  </button>
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{currentLecture.title}</h2>
                <button
                  className={`btn ${isCompleted(currentLecture._id) ? 'btn-success' : 'btn-secondary'} btn-sm`}
                  onClick={markComplete}
                  disabled={isCompleted(currentLecture._id)}
                >
                  <CheckCircle size={15} />
                  {isCompleted(currentLecture._id) ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
              {currentLecture.description && (
                <p style={{ color: 'var(--clr-text-muted)', marginTop: '0.75rem', fontSize: '0.9rem', lineHeight: 1.7 }}>
                  {currentLecture.description}
                </p>
              )}
              {currentLecture.resources?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Resources</p>
                  {currentLecture.resources.map((r) => (
                    <a key={r._id} href={r.url} target="_blank" rel="noreferrer"
                      className="btn btn-ghost btn-sm" style={{ marginRight: '0.5rem' }}>
                      <FileText size={13} /> {r.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Quizzes */}
            {quizzes.length > 0 && (
              <div className="card" style={{ marginTop: '1rem' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Course Quizzes</h3>
                {quizzes.map((q) => (
                  <div key={q._id} className="flex items-center justify-between" style={{
                    padding: '0.75rem', background: 'var(--clr-surface-2)',
                    borderRadius: 'var(--radius)', marginBottom: '0.5rem'
                  }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{q.title}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>
                        {q.questions?.length} questions · Pass: {q.passingScore}%
                      </p>
                    </div>
                    <Link to={`/student/courses/${courseId}/quiz/${q._id}`} className="btn btn-primary btn-sm">
                      Take Quiz
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state"><h3>Select a lecture to start learning</h3></div>
        )}
      </div>

      {/* Sidebar */}
      <div className="learn-sidebar">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--clr-border)' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{course.title}</h3>
          {progress && (
            <div style={{ marginTop: '0.75rem' }}>
              <div className="flex items-center justify-between" style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', marginBottom: '0.35rem' }}>
                <span>Progress</span>
                <span>{progress.percentageComplete}%</span>
              </div>
              <div className="progress-bar-outer">
                <div className="progress-bar-fill" style={{ width: `${progress.percentageComplete}%` }} />
              </div>
            </div>
          )}
        </div>
        {course.lectures?.map((lecture, i) => {
          const done = isCompleted(lecture._id);
          const active = currentLecture?._id === lecture._id;
          return (
            <div
              key={lecture._id}
              className={`lecture-item ${active ? 'active' : ''} ${done ? 'completed' : ''}`}
              onClick={() => selectLecture(lecture)}
            >
              {done ? <CheckCircle size={15} /> : <Circle size={15} />}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: active ? 600 : 400 }}>{lecture.title}</p>
                {lecture.duration > 0 && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--clr-text-dim)' }}>
                    {Math.floor(lecture.duration / 60)}m
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
