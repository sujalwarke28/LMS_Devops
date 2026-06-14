import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, uploadService, quizService } from '../../services';
import { PlusCircle, Trash2, Upload, Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('info');
  const [lectureForm, setLectureForm] = useState({ title: '', description: '', isPreview: false });
  const [videoFile, setVideoFile] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Quiz States
  const [quizzes, setQuizzes] = useState([]);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    passingScore: 70,
    questions: [
      {
        questionText: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ]
      }
    ]
  });

  useEffect(() => {
    import('../../services/api').then(({ default: api }) => {
      api.get(`/courses/${id}`).then(({ data }) => setCourse(data.data));
    });
    quizService.getByCourse(id).then(({ data }) => setQuizzes(data.data || []));
  }, [id]);

  const handleInfoSave = async () => {
    setSaving(true);
    try {
      await courseService.update(id, {
        title: course.title, description: course.description, shortDescription: course.shortDescription,
        category: course.category, level: course.level, isFree: course.isFree, price: course.price,
        isPublished: course.isPublished, requirements: course.requirements, outcomes: course.outcomes, tags: course.tags,
      });
      toast.success('Course updated');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLecture = async (e) => {
    e.preventDefault();
    try {
      let videoUrl, videoKey;
      if (videoFile) {
        setUploadingVideo(true);
        const { data } = await uploadService.uploadFile(videoFile);
        videoUrl = data.data.url;
        videoKey = data.data.key;
        setUploadingVideo(false);
      }
      await courseService.addLecture(id, { ...lectureForm, videoUrl, videoKey });
      toast.success('Lecture added');
      setLectureForm({ title: '', description: '', isPreview: false });
      setVideoFile(null);
      // Refresh
      const { default: api } = await import('../../services/api');
      const { data } = await api.get(`/courses/${id}`);
      setCourse(data.data);
    } catch (err) {
      toast.error('Failed to add lecture');
      setUploadingVideo(false);
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!confirm('Delete this lecture?')) return;
    try {
      await courseService.deleteLecture(id, lectureId);
      setCourse(prev => ({
        ...prev,
        lectures: prev.lectures.filter(l => l._id !== lectureId),
      }));
      toast.success('Lecture deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const togglePublish = async () => {
    const updated = { ...course, isPublished: !course.isPublished };
    setCourse(updated);
    await courseService.update(id, { isPublished: updated.isPublished });
    toast.success(updated.isPublished ? 'Course published!' : 'Course unpublished');
  };

  // Quiz Handlers
  const handleAddQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ]
        }
      ]
    }));
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    // Validation: Check if every question has exactly 1 correct answer
    for (let i = 0; i < quizForm.questions.length; i++) {
      const q = quizForm.questions[i];
      const hasCorrect = q.options.some(o => o.isCorrect);
      if (!hasCorrect) {
        return toast.error(`Please select a correct answer for question ${i + 1}`);
      }
    }

    try {
      const { data } = await quizService.create({ ...quizForm, course: id, isPublished: true });
      setQuizzes(prev => [...prev, data.data]);
      setShowQuizForm(false);
      setQuizForm({
        title: '', description: '', passingScore: 70,
        questions: [{ questionText: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }] }]
      });
      toast.success('Quiz created successfully');
    } catch (err) {
      toast.error('Failed to create quiz');
      console.error(err);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Delete this quiz?')) return;
    try {
      await quizService.remove(quizId);
      setQuizzes(prev => prev.filter(q => q._id !== quizId));
      toast.success('Quiz deleted');
    } catch (err) {
      toast.error('Failed to delete quiz');
    }
  };

  if (!course) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="container section" style={{ maxWidth: 900 }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">Edit Course</h1>
          <p className="section-subtitle">{course.title}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={togglePublish}>
          {course.isPublished ? <><EyeOff size={14} /> Unpublish</> : <><Eye size={14} /> Publish</>}
        </button>
      </div>

      <div className="tabs">
        {['info', 'lectures', 'quizzes'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={course.title} onChange={e => setCourse(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Short Description</label>
            <input className="form-input" value={course.shortDescription || ''} onChange={e => setCourse(p => ({ ...p, shortDescription: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={5} value={course.description} onChange={e => setCourse(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={course.category} onChange={e => setCourse(p => ({ ...p, category: e.target.value }))}>
                {['DevOps', 'Cloud', 'Programming', 'Data Science', 'Cybersecurity', 'Design', 'Business', 'Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Level</label>
              <select className="form-select" value={course.level} onChange={e => setCourse(p => ({ ...p, level: e.target.value }))}>
                {['Beginner', 'Intermediate', 'Advanced'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleInfoSave} disabled={saving} id="save-course-btn">
            <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'lectures' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Existing lectures */}
          {course.lectures?.map((l, i) => (
            <div key={l._id} className="card flex items-center justify-between">
              <div>
                <p style={{ fontWeight: 500 }}>{i + 1}. {l.title}</p>
                {l.description && <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{l.description}</p>}
                {l.isPreview && <span className="badge badge-primary" style={{ marginTop: '0.25rem' }}>Preview</span>}
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLecture(l._id)}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {/* Add lecture form */}
          <div className="card">
            <h3 className="card-title mb-3">Add Lecture</h3>
            <form onSubmit={handleAddLecture} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" required value={lectureForm.title} onChange={e => setLectureForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={2} value={lectureForm.description} onChange={e => setLectureForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Video File (MP4)</label>
                <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} className="form-input" />
                {uploadingVideo && <p className="form-hint">⏳ Uploading to S3...</p>}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPreview" checked={lectureForm.isPreview} onChange={e => setLectureForm(p => ({ ...p, isPreview: e.target.checked }))} />
                <label htmlFor="isPreview" className="form-label" style={{ margin: 0 }}>Free preview lecture</label>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={uploadingVideo}>
                <PlusCircle size={14} /> Add Lecture
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'quizzes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!showQuizForm ? (
            <>
              {quizzes.map((q, i) => (
                <div key={q._id} className="card flex items-center justify-between">
                  <div>
                    <p style={{ fontWeight: 500 }}>{i + 1}. {q.title}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{q.questions.length} Questions • Passing: {q.passingScore}%</p>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuiz(q._id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <button className="btn btn-primary" onClick={() => setShowQuizForm(true)}>
                  <PlusCircle size={15} /> Create New MCQ Quiz
                </button>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title">Create MCQ Quiz</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowQuizForm(false)}>Cancel</button>
              </div>
              <form onSubmit={handleSaveQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Quiz Title *</label>
                  <input className="form-input" required value={quizForm.title} onChange={e => setQuizForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. End of Section 1 Quiz" />
                </div>
                <div className="form-group">
                  <label className="form-label">Passing Score (%)</label>
                  <input type="number" min="0" max="100" className="form-input" required value={quizForm.passingScore} onChange={e => setQuizForm(p => ({ ...p, passingScore: e.target.value }))} />
                </div>

                <hr style={{ borderColor: 'var(--clr-border)', margin: '0.5rem 0' }} />

                {quizForm.questions.map((q, qIndex) => (
                  <div key={qIndex} style={{ padding: '1rem', background: 'var(--clr-bg-alt)', borderRadius: 'var(--radius)', border: '1px solid var(--clr-border)' }}>
                    <div className="form-group mb-3">
                      <label className="form-label">Question {qIndex + 1}</label>
                      <textarea className="form-textarea" required rows={2} value={q.questionText} onChange={e => {
                        const newQ = [...quizForm.questions];
                        newQ[qIndex].questionText = e.target.value;
                        setQuizForm(p => ({ ...p, questions: newQ }));
                      }} placeholder="What is the capital of..." />
                    </div>
                    <label className="form-label mb-2">Options (Select the correct one)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {['A', 'B', 'C', 'D'].map((label, oIndex) => (
                        <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input 
                            type="radio" 
                            name={`correct-${qIndex}`} 
                            required 
                            checked={q.options[oIndex].isCorrect}
                            onChange={() => {
                              const newQ = [...quizForm.questions];
                              newQ[qIndex].options.forEach((o, i) => o.isCorrect = i === oIndex);
                              setQuizForm(p => ({ ...p, questions: newQ }));
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: 600, width: '20px' }}>{label}.</span>
                          <input 
                            className="form-input" 
                            required 
                            value={q.options[oIndex].text}
                            onChange={e => {
                              const newQ = [...quizForm.questions];
                              newQ[qIndex].options[oIndex].text = e.target.value;
                              setQuizForm(p => ({ ...p, questions: newQ }));
                            }}
                            style={{ flex: 1, padding: '0.4rem 0.8rem' }}
                            placeholder={`Option ${label}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddQuestion} style={{ alignSelf: 'flex-start' }}>
                  <PlusCircle size={14} /> Add Another Question
                </button>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary">
                    <Save size={15} /> Save Quiz
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
