import api from './api';

export const courseService = {
  getAll: (params) => api.get('/courses', { params }),
  getBySlug: (slug) => api.get(`/courses/slug/${slug}`),
  getMyCourses: () => api.get('/courses/instructor/my-courses'),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  remove: (id) => api.delete(`/courses/${id}`),
  addLecture: (id, data) => api.post(`/courses/${id}/lectures`, data),
  updateLecture: (id, lectureId, data) => api.put(`/courses/${id}/lectures/${lectureId}`, data),
  deleteLecture: (id, lectureId) => api.delete(`/courses/${id}/lectures/${lectureId}`),
  getStreamUrl: (id, lectureId) => api.get(`/courses/${id}/lectures/${lectureId}/stream`),
  getEnrolledStudents: (id) => api.get(`/courses/${id}/students`),
};

export const enrollmentService = {
  enroll: (courseId) => api.post(`/enrollments/${courseId}`),
  getMy: () => api.get('/enrollments/my'),
  drop: (courseId) => api.delete(`/enrollments/${courseId}`),
};

export const progressService = {
  get: (courseId) => api.get(`/progress/${courseId}`),
  markComplete: (courseId, lectureId, data) =>
    api.post(`/progress/${courseId}/lecture/${lectureId}`, data),
  getStudentProgress: (courseId) => api.get(`/progress/instructor/${courseId}`),
};

export const quizService = {
  getByCourse: (courseId) => api.get(`/quizzes/course/${courseId}`),
  getById: (id) => api.get(`/quizzes/${id}`),
  create: (data) => api.post('/quizzes', data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  remove: (id) => api.delete(`/quizzes/${id}`),
  submit: (id, data) => api.post(`/quizzes/${id}/submit`, data),
  getAttempts: (id) => api.get(`/quizzes/${id}/attempts`),
};

export const certificateService = {
  getMy: () => api.get('/certificates/my'),
  generate: (courseId) => api.post(`/certificates/generate/${courseId}`),
  verify: (certId) => api.get(`/certificates/verify/${certId}`),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  toggleStatus: (id) => api.patch(`/admin/users/${id}/status`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getCourses: (params) => api.get('/admin/courses', { params }),
};

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
};

export const uploadService = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
