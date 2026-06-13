import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { CourseCard } from '../components/common/CourseCard';
import { courseService } from '../services';

const CATEGORIES = ['All', 'DevOps', 'Cloud', 'Programming', 'Data Science', 'Cybersecurity', 'Design', 'Business', 'Other'];
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function CoursesBrowse() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      if (level !== 'All') params.level = level;
      const { data } = await courseService.getAll(params);
      setCourses(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, [page, category, level]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchCourses(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="container section">
      <div className="section-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <h1 className="section-title">Browse Courses</h1>
        <p className="section-subtitle">Explore our growing library of DevOps and tech courses</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={level}
          onChange={(e) => { setLevel(e.target.value); setPage(1); }}
        >
          {LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <h3>No courses found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="course-grid">
            {courses.map((course) => <CourseCard key={course._id} course={course} />)}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page === pagination.pages} onClick={() => setPage(page + 1)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
