import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    // If authenticated, render the child route content.
    return <Outlet />;
};

export default ProtectedRoute;
