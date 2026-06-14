import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { courseService, progressService, quizService } from '../../services';
import { CheckCircle, Circle, PlayCircle, FileText, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import QuizPage from './QuizPage';
import { certificateService } from '../../services';

export default function LearnCourse() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      courseService.getAll({ limit: 1 }),  // fallback — fetch course by id differently
      progressService.get(courseId),
      quizService.getByCourse(courseId),
    ]).catch(() => {}).finally(() => setLoading(false));
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

  const navigate = useNavigate();

  const selectLecture = async (lecture) => {
    setCurrentLecture(lecture);
    setCurrentQuiz(null);
    setStreamUrl(null);
    try {
      const { data } = await courseService.getStreamUrl(courseId, lecture._id);
      setStreamUrl(data.data.signedUrl);
    } catch (err) {
      toast.error('Could not load video. Please try again.');
    }
  };

  const selectQuiz = (quiz) => {
    setCurrentQuiz(quiz);
    setCurrentLecture(null);
    setStreamUrl(null);
  };

  const claimCertificate = async () => {
    try {
      const { data } = await certificateService.generate(courseId);
      toast.success('Certificate generated! 🎉');
      navigate('/student/certificates');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate certificate');
    }
  };

  const markComplete = async () => {
    if (!currentLecture) return;
    try {
      const { data } = await progressService.markComplete(courseId, currentLecture._id, { watchedSeconds: 0 });
      setProgress(data.data);
      toast.success('Lecture marked as complete!');
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
                <video 
                  key={streamUrl}
                  src={streamUrl} 
                  controls 
                  width="100%" 
                  height="100%" 
                  autoPlay
                  onError={(e) => {
                    console.error('Video error:', e.nativeEvent);
                    toast.error('Video format unsupported or stream unreachable.');
                  }}
                  style={{ objectFit: 'contain', backgroundColor: '#000' }}
                />
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

          </>
        ) : currentQuiz ? (
          <div style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-lg)', minHeight: '600px', paddingBottom: '2rem' }}>
            <QuizPage courseId={courseId} quizId={currentQuiz._id} onQuizComplete={(attempt) => {
               if (attempt.passed) {
                 // optionally refresh anything
               }
            }} />
            <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1rem', borderTop: '1px solid var(--clr-border)' }}>
              <p style={{ marginBottom: '1rem', color: 'var(--clr-text-muted)' }}>Did you pass the quiz?</p>
              <button className="btn btn-success" onClick={claimCertificate}>
                <CheckCircle size={16} /> Claim Certificate
              </button>
            </div>
          </div>
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

        {quizzes.map((q) => {
          const active = currentQuiz?._id === q._id;
          return (
            <div
              key={q._id}
              className={`lecture-item ${active ? 'active' : ''}`}
              onClick={() => selectQuiz(q)}
            >
              <FileText size={15} style={{ color: 'var(--clr-primary)' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: active ? 600 : 400 }}>{q.title}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--clr-text-dim)' }}>
                  Pass: {q.passingScore}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
