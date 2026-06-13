import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../../services';
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuizPage() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    quizService.getById(quizId)
      .then(({ data }) => setQuiz(data.data))
      .catch(() => toast.error('Quiz not found'))
      .finally(() => setLoading(false));
  }, [quizId]);

  const selectAnswer = (qIdx, optIdx) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const answersArr = quiz.questions.map((_, i) => ({ selectedOption: answers[i] ?? -1 }));
    setSubmitting(true);
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const { data } = await quizService.submit(quizId, { answers: answersArr, timeTaken });
      setResult(data.data);
      if (data.data.attempt.passed) {
        toast.success('🎉 You passed!');
      } else {
        toast.error('Not quite — keep practicing!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!quiz) return <div className="empty-state"><h3>Quiz not found</h3></div>;

  return (
    <div className="container section" style={{ maxWidth: 800 }}>
      <div className="card mb-3">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {quiz.title}
        </h1>
        <div className="flex gap-2" style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
          <span>{quiz.questions.length} questions</span>
          <span>•</span>
          <span>Pass: {quiz.passingScore}%</span>
          {quiz.timeLimit > 0 && <><span>•</span><span><Clock size={13} /> {quiz.timeLimit} min</span></>}
          {quiz.maxAttempts && <><span>•</span><span>Max {quiz.maxAttempts} attempts</span></>}
        </div>
      </div>

      {result ? (
        /* Results screen */
        <div className="card" style={{ textAlign: 'center' }}>
          {result.attempt.passed
            ? <CheckCircle size={64} style={{ color: 'var(--clr-success)', margin: '0 auto 1rem' }} />
            : <XCircle size={64} style={{ color: 'var(--clr-danger)', margin: '0 auto 1rem' }} />
          }
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {result.attempt.passed ? 'Passed! 🎉' : 'Not passed'}
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--clr-text-muted)', marginBottom: '1.5rem' }}>
            Your score: <strong style={{ color: 'var(--clr-text)', fontSize: '1.5rem' }}>{result.attempt.percentage}%</strong>
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {result.attempt.passed && (
              <button className="btn btn-success" onClick={() => navigate(`/student/courses/${courseId}/learn`)}>
                Back to Course <ArrowRight size={16} />
              </button>
            )}
            {!result.attempt.passed && (
              <button className="btn btn-primary" onClick={() => { setResult(null); setAnswers({}); }}>
                Try Again
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Questions */
        <>
          {quiz.questions.map((q, qIdx) => (
            <div key={q._id} className="card mb-2">
              <p style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>
                <span style={{ color: 'var(--clr-primary)' }}>Q{qIdx + 1}.</span> {q.questionText}
              </p>
              {q.options.map((opt, optIdx) => (
                <div
                  key={opt._id}
                  className={`quiz-option ${answers[qIdx] === optIdx ? 'selected' : ''}`}
                  onClick={() => selectAnswer(qIdx, optIdx)}
                  id={`q${qIdx}-opt${optIdx}`}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `2px solid ${answers[qIdx] === optIdx ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {answers[qIdx] === optIdx && (
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--clr-primary)' }} />
                    )}
                  </div>
                  {opt.text}
                </div>
              ))}
            </div>
          ))}

          <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '0.75rem' }}>
              {Object.keys(answers).length} / {quiz.questions.length} answered
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < quiz.questions.length}
              id="submit-quiz-btn"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
