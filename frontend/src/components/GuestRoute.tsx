import { Navigate, Outlet } from "react-router-dom";

const GuestRoute = () => {
    const token = localStorage.getItem('token');
    if (token) {
        return <Navigate to="/home" replace />;
    }
    // If not authenticated, render the guest page.
    return <Outlet />;
};

export default GuestRoute;