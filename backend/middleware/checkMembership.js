import pool from '../database/db.js';

// This function checks if the authenticated user has an active membership.
// To be used on routes that require a subscription (e.g., viewing courses).
const checkMembership = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const userResult = await pool.query(
            'SELECT membership_expires_at, role FROM users WHERE user_id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = userResult.rows[0];

        // Admins always have access
        if (user.role === 'admin') {
            return next();
        }
        
        // A user is a member if their expiration is NULL (lifetime) or in the future.
        const isMember = user.membership_expires_at === null || (user.membership_expires_at && new Date(user.membership_expires_at) > new Date());

        if (!isMember) {
            return res.status(403).json({ message: 'Access denied. An active membership is required.' });
        }

        next();
    } catch (err) {
        console.error('Membership Check Error:', err.message);
        res.status(500).json({ message: 'Server error during membership check.' });
    }
};

export default checkMembership;