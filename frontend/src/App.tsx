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
          <Route path='/news-category' element={<NewsCategoriesPage />} />
          <Route path="/news/:categoryId" element={<NewsPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}

export default App;