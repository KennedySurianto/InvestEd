import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkMembership from '../middleware/checkMembership.js';

const router = express.Router();

// --- Member & Admin Routes ---

// POST /api/forums
// Creates a new forum thread. Requires active membership.
router.post('/', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { title, content } = req.body;
        const user_id = req.user.userId;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }

        const newForum = await pool.query(
            'INSERT INTO forums (title, content, user_id) VALUES ($1, $2, $3) RETURNING *',
            [title, content, user_id]
        );

        res.status(201).json({
            message: 'Forum thread created successfully!',
            forum: newForum.rows[0],
        });
    } catch (err) {
        console.error('Create Forum Error:', err.message);
        res.status(500).json({ message: 'Server error while creating forum thread.' });
    }
});

// GET /api/forums
// Retrieves a paginated list of all forum threads. Requires active membership.
router.get('/', authenticateToken, checkMembership, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const query = `
            SELECT 
                f.forum_id, f.title, f.content, f.created_at,
                u.full_name AS author_name,
                u.user_id AS author_id
            FROM forums f
            JOIN users u ON f.user_id = u.user_id
            ORDER BY f.created_at DESC
            LIMIT $1 OFFSET $2;
        `;
        const forums = await pool.query(query, [limit, offset]);
        res.status(200).json(forums.rows);
    } catch (err) {
        console.error('Get Forums List Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving forum threads.' });
    }
});

// GET /api/forums/:id
// Retrieves a single forum thread by ID. Requires active membership.
router.get('/:id', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                f.forum_id, f.title, f.content, f.created_at, f.updated_at,
                u.full_name AS author_name,
                u.user_id AS author_id
            FROM forums f
            JOIN users u ON f.user_id = u.user_id
            WHERE f.forum_id = $1;
        `;
        const forum = await pool.query(query, [id]);

        if (forum.rows.length === 0) {
            return res.status(404).json({ message: 'Forum thread not found.' });
        }
        res.status(200).json(forum.rows[0]);
    } catch (err) {
        console.error('Get Single Forum Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving forum thread.' });
    }
});

// PUT /api/forums/:id
// Updates a forum thread. User must be the author.
router.put('/:id', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const userId = req.user.userId;

        if (!title && !content) {
            return res.status(400).json({ message: 'At least one field (title or content) is required.' });
        }

        // First, verify the user owns this post
        const ownerCheck = await pool.query('SELECT user_id FROM forums WHERE forum_id = $1', [id]);
        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Forum thread not found.' });
        }
        if (ownerCheck.rows[0].user_id !== userId) {
            return res.status(403).json({ message: 'Access denied. You can only edit your own posts.' });
        }

        // Dynamically build update query
        const fields = [];
        const values = [];
        let queryIndex = 1;

        if (title) {
            fields.push(`title = $${queryIndex++}`);
            values.push(title);
        }
        if (content) {
            fields.push(`content = $${queryIndex++}`);
            values.push(content);
        }
        values.push(id);
        
        const updateQuery = `UPDATE forums SET ${fields.join(', ')}, updated_at = NOW() WHERE forum_id = $${queryIndex} RETURNING *`;
        const updatedForum = await pool.query(updateQuery, values);
        
        res.status(200).json({
            message: 'Forum thread updated successfully!',
            forum: updatedForum.rows[0]
        });

    } catch (err) {
        console.error('Update Forum Error:', err.message);
        res.status(500).json({ message: 'Server error while updating forum thread.' });
    }
});

// DELETE /api/forums/:id
// Deletes a forum thread. User must be the author or an admin.
router.delete('/:id', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role } = req.user;

        const ownerCheck = await pool.query('SELECT user_id FROM forums WHERE forum_id = $1', [id]);
        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Forum thread not found.' });
        }

        // Allow deletion if the user is the author OR if the user is an admin
        if (ownerCheck.rows[0].user_id !== userId && role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. You can only delete your own posts.' });
        }

        await pool.query('DELETE FROM forums WHERE forum_id = $1', [id]);
        res.status(200).json({ message: 'Forum thread deleted successfully.' });

    } catch (err) {
        console.error('Delete Forum Error:', err.message);
        res.status(500).json({ message: 'Server error while deleting forum thread.' });
    }
});


export default router;
