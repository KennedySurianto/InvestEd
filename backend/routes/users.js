import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import pool from '../database/db.js';

// Initialize a new Express router
const router = express.Router();

// --- AUTHENTICATION MIDDLEWARE ---
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

// --- MEMBERSHIP MIDDLEWARE ---
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


// --- API ROUTES ---

// POST /api/users/register
router.post('/register', async (req, res) => {
    try {
        const { full_name, email, password, membership_plan } = req.body;

        if (!full_name || !email || !password || !membership_plan) {
            return res.status(400).json({ message: 'Full name, email, password, and membership_plan are required.' });
        }
        
        const validPlans = ['6-months', '12-months', 'lifetime'];
        if (!validPlans.includes(membership_plan)) {
            return res.status(400).json({ message: 'Invalid membership plan. Choose from: 6-months, 12-months, lifetime.' });
        }

        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Calculate membership expiration date based on the plan
        let expiresAt = null;
        if (membership_plan === '6-months') {
            expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 6);
        } else if (membership_plan === '12-months') {
            expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }
        // For 'lifetime', expiresAt remains null

        const newUser = await pool.query(
            'INSERT INTO users (full_name, email, password_hash, membership_expires_at) VALUES ($1, $2, $3, $4) RETURNING user_id, email, full_name, role, membership_expires_at',
            [full_name, email, password_hash, expiresAt]
        );

        res.status(201).json({
            message: 'User registered successfully!',
            user: newUser.rows[0],
        });

    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const payload = { userId: user.user_id, email: user.email, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        // A user is a member if their expiration is NULL (lifetime) or in the future.
        const is_member = user.membership_expires_at === null || (user.membership_expires_at && new Date(user.membership_expires_at) > new Date());

        res.status(200).json({
            message: 'Logged in successfully!',
            token: token,
            user: {
                userId: user.user_id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                is_member: is_member,
                membership_expires_at: user.membership_expires_at
            }
        });

    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// PUT /api/users/profile (Protected Route)
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { full_name, email } = req.body;
        const userId = req.user.userId;

        if (!full_name && !email) {
            return res.status(400).json({ message: 'At least one field (full_name or email) must be provided for update.' });
        }

        if (email) {
            const emailCheck = await pool.query('SELECT user_id FROM users WHERE email = $1 AND user_id != $2', [email, userId]);
            if (emailCheck.rows.length > 0) {
                return res.status(409).json({ message: 'This email is already registered to another account.' });
            }
        }

        const fieldsToUpdate = [];
        const values = [];
        let queryIndex = 1;

        if (full_name) {
            fieldsToUpdate.push(`full_name = $${queryIndex++}`);
            values.push(full_name);
        }
        if (email) {
            fieldsToUpdate.push(`email = $${queryIndex++}`);
            values.push(email);
        }

        values.push(userId);

        const updateQuery = `UPDATE users SET ${fieldsToUpdate.join(', ')}, updated_at = NOW() WHERE user_id = $${queryIndex} RETURNING user_id, full_name, email, role, membership_expires_at`;

        const updatedUserResult = await pool.query(updateQuery, values);

        if (updatedUserResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        const updatedUser = updatedUserResult.rows[0];
        // A user is a member if their expiration is NULL (lifetime) or in the future.
        const is_member = updatedUser.membership_expires_at === null || (updatedUser.membership_expires_at && new Date(updatedUser.membership_expires_at) > new Date());

        res.status(200).json({
            message: 'Profile updated successfully!',
            user: {
                userId: updatedUser.user_id,
                fullName: updatedUser.full_name,
                email: updatedUser.email,
                role: updatedUser.role,
                is_member: is_member,
                membership_expires_at: updatedUser.membership_expires_at
            }
        });

    } catch (err) {
        console.error('Profile Update Error:', err.message);
        res.status(500).json({ message: 'Server error during profile update.' });
    }
});

// GET /api/users/profile (Protected Route)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const userResult = await pool.query(
            'SELECT user_id, full_name, email, role, created_at, membership_expires_at FROM users WHERE user_id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = userResult.rows[0];
        // A user is a member if their expiration is NULL (lifetime) or in the future.
        const is_member = user.membership_expires_at === null || (user.membership_expires_at && new Date(user.membership_expires_at) > new Date());

        res.status(200).json({
            userId: user.user_id,
            fullName: user.full_name,
            email: user.email,
            role: user.role,
            createdAt: user.created_at,
            is_member: is_member,
            membership_expires_at: user.membership_expires_at
        });

    } catch (err) {
        console.error('Get Profile Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving profile.' });
    }
});

// Use 'export default' to make the router available for import in index.js
export default router;

