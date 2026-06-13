import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService, uploadService } from '../../services';
import { Upload, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['DevOps', 'Cloud', 'Programming', 'Data Science', 'Cybersecurity', 'Design', 'Business', 'Other'];

export default function CreateCourse() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', shortDescription: '',
    category: 'DevOps', level: 'Beginner', isFree: true, price: 0,
    requirements: '', outcomes: '', tags: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      let thumbnailUrl, thumbnailKey;
      if (thumbnailFile) {
        setUploading(true);
        const { data } = await uploadService.uploadFile(thumbnailFile);
        thumbnailUrl = data.data.url;
        thumbnailKey = data.data.key;
        setUploading(false);
      }

      const payload = {
        ...form,
        requirements: form.requirements.split('\n').filter(Boolean),
        outcomes: form.outcomes.split('\n').filter(Boolean),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        price: form.isFree ? 0 : parseFloat(form.price),
        ...(thumbnailUrl && { thumbnailUrl, thumbnailKey }),
      };

      const { data } = await courseService.create(payload);
      toast.success('Course created!');
      navigate(`/instructor/courses/${data.data._id}/edit`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container section" style={{ maxWidth: 800 }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">Create New Course</h1>
          <p className="section-subtitle">Fill in the details to publish your course</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="card">
          <h3 className="card-title mb-3">Basic Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Course Title *</label>
              <input className="form-input" name="title" required value={form.title} onChange={handleChange} placeholder="e.g. Docker & Kubernetes Masterclass" />
            </div>
            <div className="form-group">
              <label className="form-label">Short Description</label>
              <input className="form-input" name="shortDescription" value={form.shortDescription} onChange={handleChange} placeholder="One-liner shown on course cards" />
            </div>
            <div className="form-group">
              <label className="form-label">Full Description *</label>
              <textarea className="form-textarea" name="description" required value={form.description} onChange={handleChange} rows={5} placeholder="Detailed course description..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Level</label>
                <select className="form-select" name="level" value={form.level} onChange={handleChange}>
                  {['Beginner', 'Intermediate', 'Advanced'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Thumbnail Image</label>
              <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files[0])} className="form-input" />
              {uploading && <p className="form-hint">Uploading thumbnail...</p>}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title mb-3">Pricing</h3>
          <div className="flex items-center gap-2 mb-2">
            <input type="checkbox" id="isFree" name="isFree" checked={form.isFree} onChange={handleChange} />
            <label htmlFor="isFree" className="form-label" style={{ margin: 0 }}>Free Course</label>
          </div>
          {!form.isFree && (
            <div className="form-group">
              <label className="form-label">Price (USD)</label>
              <input type="number" className="form-input" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" />
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title mb-3">Content Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Requirements (one per line)</label>
              <textarea className="form-textarea" name="requirements" value={form.requirements} onChange={handleChange} placeholder="Basic Linux knowledge&#10;Docker installed" rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Learning Outcomes (one per line)</label>
              <textarea className="form-textarea" name="outcomes" value={form.outcomes} onChange={handleChange} placeholder="Deploy apps to Kubernetes&#10;Set up CI/CD pipelines" rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input className="form-input" name="tags" value={form.tags} onChange={handleChange} placeholder="docker, kubernetes, devops" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={creating} id="create-course-btn">
            <PlusCircle size={16} />
            {creating ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
}
