import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Adjust path if needed

const AdminRoute = () => {
    const { user, loading } = useAuth();

    // 1. While the context is checking for a user, show nothing to prevent flicker
    if (loading) {
        return null; // Or a global loading spinner
    }

    // 2. After loading, check if a user exists AND if their role is 'admin'
    if (user && user.role === 'admin') {
        // If they are an admin, render the child route content (the admin page)
        return <Outlet />;
    }
    
    // 3. If the user is not an admin (or not logged in), redirect them.
    // Redirecting to a safe, authenticated page like '/home' is a good default.
    // You could also redirect to a specific '/unauthorized' page.
    return <Navigate to="/home" replace />;
};

export default AdminRoute;