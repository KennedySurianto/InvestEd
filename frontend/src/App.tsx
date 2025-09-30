import { Routes, Route } from 'react-router';
import { ToastProvider } from './hooks/useToast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import NewsCategoriesPage from './pages/NewsCategory';
import NewsPage from './pages/News';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        // authenticated routes
        <Route path="/home" element={<Home />} />
        <Route path='/home/news' element={<NewsCategoriesPage />} />
        {/* <Route path='/home/news/:category' element={<NewsPage />} /> */}
      </Routes>
    </ToastProvider>
  )
}

export default App;