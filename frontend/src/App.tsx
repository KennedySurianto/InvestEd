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

import AdminRoute from './components/AdminRoute';
import CreateNewsCategory from './pages/Admin/CreateNewsCategory';
import CreateNews from './pages/Admin/CreateNews';

import './App.css';

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
        </Route>

        // Admin Routes
        <Route path="/admin" element={<AdminRoute />}>
          <Route path="news-categories/create" element={<CreateNewsCategory />} />
          <Route path="news/create" element={<CreateNews />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}

export default App;