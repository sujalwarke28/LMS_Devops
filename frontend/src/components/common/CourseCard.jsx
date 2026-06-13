import { Clock, Users, Star, Play, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const CourseCard = ({ course }) => {
  return (
    <div className="course-card">
      <div className="course-card-thumb">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} />
        ) : (
          <div className="course-card-thumb-placeholder">
            <BookOpen size={40} />
          </div>
        )}
        <span className={`level-badge level-${course.level?.toLowerCase()}`}>{course.level}</span>
      </div>

      <div className="course-card-body">
        <span className="course-category">{course.category}</span>
        <h3 className="course-title">{course.title}</h3>
        <p className="course-description">{course.shortDescription || course.description}</p>

        {course.instructor && (
          <p className="course-instructor">
            <img
              src={course.instructor.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor.name)}&size=24&background=6366f1&color=fff`}
              alt={course.instructor.name}
              className="instructor-avatar-sm"
            />
            {course.instructor.name}
          </p>
        )}

        <div className="course-meta">
          {course.totalDuration > 0 && (
            <span><Clock size={13} /> {formatDuration(course.totalDuration)}</span>
          )}
          <span><Play size={13} /> {course.lectures?.length || 0} lectures</span>
          <span><Users size={13} /> {course.enrollmentCount || 0}</span>
          {course.rating?.count > 0 && (
            <span><Star size={13} className="star-icon" /> {course.rating.average.toFixed(1)}</span>
          )}
        </div>

        <div className="course-card-footer">
          <span className="course-price">
            {course.isFree ? <span className="free-badge">Free</span> : `$${course.price}`}
          </span>
          <Link to={`/courses/${course.slug}`} className="btn btn-primary btn-sm">
            View Course
          </Link>
        </div>
      </div>
    </div>
  );
};
