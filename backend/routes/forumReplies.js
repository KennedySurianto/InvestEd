import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkMembership from '../middleware/checkMembership.js';

// Use mergeParams to access the parent router's params (e.g., :forumId)
const router = express.Router({ mergeParams: true });

// --- Member & Admin Routes for Replies ---

// POST /api/forums/:forumId/replies
// Creates a new reply to a forum thread. Can also be a reply to another reply.
router.post('/', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { forumId } = req.params;
        const { content, parent_reply_id } = req.body; // parent_reply_id is optional
        const user_id = req.user.userId;

        if (!content) {
            return res.status(400).json({ message: 'Reply content is required.' });
        }

        const newReply = await pool.query(
            'INSERT INTO forum_replies (forum_id, user_id, content, parent_reply_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [forumId, user_id, content, parent_reply_id || null] // Ensure parent_reply_id is null if not provided
        );

        res.status(201).json({
            message: 'Reply posted successfully!',
            reply: newReply.rows[0],
        });
    } catch (err) {
        console.error('Create Reply Error:', err.message);
        // Check for foreign key violation if the forum doesn't exist
        if (err.code === '23503') {
            return res.status(404).json({ message: 'Forum thread not found.' });
        }
        res.status(500).json({ message: 'Server error while posting reply.' });
    }
});

// GET /api/forums/:forumId/replies
// Retrieves paginated replies for a specific forum thread.
router.get('/', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { forumId } = req.params;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const repliesQuery = `
            SELECT 
                fr.reply_id, fr.content, fr.parent_reply_id, fr.created_at,
                u.full_name AS author_name,
                u.user_id AS author_id
            FROM forum_replies fr
            JOIN users u ON fr.user_id = u.user_id
            WHERE fr.forum_id = $1
            ORDER BY fr.created_at ASC
            LIMIT $2 OFFSET $3;
        `;
        
        const countQuery = 'SELECT COUNT(*) FROM forum_replies WHERE forum_id = $1';

        const [repliesResult, countResult] = await Promise.all([
            pool.query(repliesQuery, [forumId, limit, offset]),
            pool.query(countQuery, [forumId])
        ]);

        const totalItems = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            data: repliesResult.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                limit: limit
            }
        });

    } catch (err) {
        console.error('Get Replies Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving replies.' });
    }
});

// PUT /api/forums/:forumId/replies/:replyId
// Updates a reply. User must be the author.
router.put('/:replyId', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { replyId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        if (!content) {
            return res.status(400).json({ message: 'Content is required for update.' });
        }

        // Verify the user owns this reply
        const ownerCheck = await pool.query('SELECT user_id FROM forum_replies WHERE reply_id = $1', [replyId]);
        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Reply not found.' });
        }
        if (ownerCheck.rows[0].user_id !== userId) {
            return res.status(403).json({ message: 'Access denied. You can only edit your own replies.' });
        }

        const updatedReply = await pool.query(
            'UPDATE forum_replies SET content = $1, updated_at = NOW() WHERE reply_id = $2 RETURNING *',
            [content, replyId]
        );
        
        res.status(200).json({
            message: 'Reply updated successfully!',
            reply: updatedReply.rows[0]
        });

    } catch (err) {
        console.error('Update Reply Error:', err.message);
        res.status(500).json({ message: 'Server error while updating reply.' });
    }
});

// DELETE /api/forums/:forumId/replies/:replyId
// Deletes a reply. User must be the author or an admin.
router.delete('/:replyId', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { replyId } = req.params;
        const { userId, role } = req.user;

        const ownerCheck = await pool.query('SELECT user_id FROM forum_replies WHERE reply_id = $1', [replyId]);
        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Reply not found.' });
        }

        // Allow deletion if the user is the author OR if the user is an admin
        if (ownerCheck.rows[0].user_id !== userId && role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. You can only delete your own replies.' });
        }

        await pool.query('DELETE FROM forum_replies WHERE reply_id = $1', [replyId]);
        res.status(200).json({ message: 'Reply deleted successfully.' });

    } catch (err) {
        console.error('Delete Reply Error:', err.message);
        res.status(500).json({ message: 'Server error while deleting reply.' });
    }
});

export default router;
