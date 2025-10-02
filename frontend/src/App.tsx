import { Routes, Route } from 'react-router';
import { ToastProvider } from './hooks/useToast';

import GuestRoute from './components/GuestRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import NewsCategoriesPage from './pages/NewsCategory';
import NewsPage from './pages/NewsByCategory';
import NewsDetailPage from './pages/NewsDetail';
import ResearchPage from './pages/Research';
import ResearchDetailPage from './pages/ResearchDetail';
import ForumsPage from './pages/Forum';
import ForumDetailPage from './pages/ForumDetail';
import CreateForumPage from './pages/CreateForum';
import ProfilePage from './pages/Profile';
import CourseCategoriesPage from './pages/CourseCategory';
import CoursesByCategoryPage from './pages/CoursesByCategory';
import CourseLanding from './pages/CourseLanding';

import AdminRoute from './components/AdminRoute';
import CreateNewsCategory from './pages/Admin/CreateNewsCategory';
import CreateNews from './pages/Admin/CreateNews';
import CreateResearchPage from './pages/Admin/CreateResearch';
import CreateCourseCategoryPage from './pages/Admin/CreateCourseCategory';
import CreateCoursePage from './pages/Admin/CreateCourse';
import CreateCourseLessonPage from './pages/Admin/CreateCourseLesson';

import './App.css';
import CourseDetailPage from './pages/CourseDetail';

function App() {
  return (
    <ToastProvider>
      <Routes>
        // Guest Routes
        <Route element={<GuestRoute />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        // Authenticated Routes
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />

          // News Routes
          <Route path='/news-category' element={<NewsCategoriesPage />} />
          <Route path="/news-category/:categoryId" element={<NewsPage />} />
          <Route path="/news/:newsId" element={<NewsDetailPage />} />

          // Research Route
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/research/:researchId" element={<ResearchDetailPage />} />

          // Forum Routes
          <Route path="/forum" element={<ForumsPage />} />
          <Route path="/forum/create" element={<CreateForumPage />} />
          <Route path="/forum/:forumId" element={<ForumDetailPage />} />

          // Profile Route
          <Route path="/profile" element={<ProfilePage />} />

          // Course Routes
          <Route path="/course-category" element={<CourseCategoriesPage />} />
          <Route path="/course-category/:categoryId" element={<CoursesByCategoryPage />} />
          <Route path="/course/:courseId" element={<CourseLanding />} />
          <Route path="/course/:courseId/learn" element={<CourseDetailPage />} />
        </Route>

        // Admin Routes
        <Route path="/admin" element={<AdminRoute />}>
          <Route path="news-categories/create" element={<CreateNewsCategory />} />
          <Route path="news/create" element={<CreateNews />} />
          <Route path="research/create" element={<CreateResearchPage />} />
          <Route path="course-category/create" element={<CreateCourseCategoryPage />} />
          <Route path="course/create" element={<CreateCoursePage />} />
          <Route path="course/:courseId/lesson/create" element={<CreateCourseLessonPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}

export default App;