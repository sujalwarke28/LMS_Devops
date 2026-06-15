import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../../services';
import { PlusCircle, Edit, BookOpen, Users } from 'lucide-react';

export default function InstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService.getMyCourses()
      .then(({ data }) => setCourses(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="container section">
      <div className="section-header">
        <h1 className="section-title">My Courses</h1>
        <Link to="/instructor/courses/create" className="btn btn-primary btn-sm">
          <PlusCircle size={15} /> New Course
        </Link>
      </div>
      {courses.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} className="empty-state-icon" />
          <h3>No courses yet</h3>
          <Link to="/instructor/courses/create" className="btn btn-primary">Create Course</Link>
        </div>
      ) : (
        <div className="course-grid">
          {courses.map(c => (
            <div key={c._id} className="course-card">
              <div className="course-card-thumb">
                {c.thumbnailUrl ? <img src={c.thumbnailUrl} alt={c.title} /> : <div className="course-card-thumb-placeholder"><BookOpen size={36} /></div>}
                <span className={`badge ${c.isPublished ? 'badge-success' : 'badge-warning'}`} style={{ position: 'absolute', top: 10, left: 10 }}>
                  {c.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="course-card-body">
                <span className="course-category">{c.category}</span>
                <h3 className="course-title">{c.title}</h3>
                <p className="text-muted text-sm">{c.enrollmentCount || 0} students · {c.lectures?.length || 0} lectures</p>
                <div className="course-card-footer">
                  <Link to={`/courses/${c.slug}`} className="btn btn-ghost btn-sm">Preview</Link>
                  <Link to={`/instructor/courses/${c._id}/students`} className="btn btn-ghost btn-sm">
                    <Users size={13} /> Students
                  </Link>
                  <Link to={`/instructor/courses/${c._id}/edit`} className="btn btn-primary btn-sm">
                    <Edit size={13} /> Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
