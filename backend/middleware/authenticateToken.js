import jwt from 'jsonwebtoken';

// This function verifies the JWT token from the Authorization header.
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Token is expected in the format: "Bearer TOKEN"
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // 401 Unauthorized: No token was provided
        return res.status(401).json({ message: 'Authentication token is required.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // 403 Forbidden: The token is invalid or expired
            return res.status(403).json({ message: 'Token is invalid or has expired.' });
        }
        // Attach the decoded user payload to the request object for use in protected routes
        req.user = user;
        next(); // Proceed to the next middleware or route handler
    });
};

export default authenticateToken;