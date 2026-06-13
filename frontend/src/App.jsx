import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Navbar } from './components/common/Navbar';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';
import CoursesBrowse from './pages/CoursesBrowse';
import CourseDetail from './pages/CourseDetail';
import CertificateVerify from './pages/CertificateVerify';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentCourses from './pages/student/MyCourses';
import LearnCourse from './pages/student/LearnCourse';
import StudentCertificates from './pages/student/Certificates';
import QuizPage from './pages/student/QuizPage';

// Instructor pages
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorCourses from './pages/instructor/MyCourses';
import CreateCourse from './pages/instructor/CreateCourse';
import EditCourse from './pages/instructor/EditCourse';
import CourseStudents from './pages/instructor/CourseStudents';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCourses from './pages/admin/Courses';
import AdminAnalytics from './pages/admin/Analytics';

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--clr-surface-2)',
              color: 'var(--clr-text)',
              border: '1px solid var(--clr-border)',
              borderRadius: '12px',
            },
          }}
        />
        <div className="page-wrapper">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/courses" element={<CoursesBrowse />} />
              <Route path="/courses/:slug" element={<CourseDetail />} />
              <Route path="/verify/:certId" element={<CertificateVerify />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Student */}
              <Route path="/student/dashboard" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/student/courses" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentCourses />
                </ProtectedRoute>
              } />
              <Route path="/student/courses/:courseId/learn" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <LearnCourse />
                </ProtectedRoute>
              } />
              <Route path="/student/courses/:courseId/quiz/:quizId" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <QuizPage />
                </ProtectedRoute>
              } />
              <Route path="/student/certificates" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentCertificates />
                </ProtectedRoute>
              } />

              {/* Instructor */}
              <Route path="/instructor/dashboard" element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/instructor/courses" element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <InstructorCourses />
                </ProtectedRoute>
              } />
              <Route path="/instructor/courses/create" element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <CreateCourse />
                </ProtectedRoute>
              } />
              <Route path="/instructor/courses/:id/edit" element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <EditCourse />
                </ProtectedRoute>
              } />
              <Route path="/instructor/courses/:id/students" element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <CourseStudents />
                </ProtectedRoute>
              } />

              {/* Admin */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/courses" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCourses />
                </ProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              } />

              {/* Default redirects */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
