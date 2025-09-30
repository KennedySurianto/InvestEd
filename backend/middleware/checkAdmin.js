// In a new file, perhaps middleware/auth.js

const checkAdmin = (req, res, next) => {
    // req.user is attached by the authenticateToken middleware
    if (req.user && req.user.role === 'admin') {
        next(); // User is an admin, proceed to the route handler
    } else {
        // User is not an admin, send a 403 Forbidden error
        res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }
};

export default checkAdmin;