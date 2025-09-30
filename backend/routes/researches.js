import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkAdmin from '../middleware/checkAdmin.js';
import checkMembership from '../middleware/checkMembership.js';

const router = express.Router();

// --- Admin Only Routes ---

// POST /api/researches (Admin Only)
// Creates a new research article.
router.post('/', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { stock_symbol, title, content } = req.body;
        const author_id = req.user.userId;

        if (!stock_symbol || !title || !content) {
            return res.status(400).json({ message: 'Stock symbol, title, and content are required.' });
        }

        const newResearch = await pool.query(
            'INSERT INTO researches (stock_symbol, title, content, author_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [stock_symbol, title, content, author_id]
        );

        res.status(201).json({
            message: 'Research article created successfully!',
            research: newResearch.rows[0],
        });
    } catch (err) {
        console.error('Create Research Error:', err.message);
        res.status(500).json({ message: 'Server error while creating research article.' });
    }
});

// PUT /api/researches/:id (Admin Only)
// Updates an existing research article.
router.put('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { stock_symbol, title, content } = req.body;

        if (!stock_symbol && !title && !content) {
            return res.status(400).json({ message: 'At least one field (stock_symbol, title, content) must be provided for update.' });
        }

        const fields = [];
        const values = [];
        let queryIndex = 1;

        if (stock_symbol) {
            fields.push(`stock_symbol = $${queryIndex++}`);
            values.push(stock_symbol);
        }
        if (title) {
            fields.push(`title = $${queryIndex++}`);
            values.push(title);
        }
        if (content) {
            fields.push(`content = $${queryIndex++}`);
            values.push(content);
        }
        values.push(id);

        const updateQuery = `UPDATE researches SET ${fields.join(', ')}, updated_at = NOW() WHERE research_id = $${queryIndex} RETURNING *`;
        const updatedResearch = await pool.query(updateQuery, values);

        if (updatedResearch.rows.length === 0) {
            return res.status(404).json({ message: 'Research article not found.' });
        }

        res.status(200).json({
            message: 'Research article updated successfully!',
            research: updatedResearch.rows[0],
        });
    } catch (err) {
        console.error('Update Research Error:', err.message);
        res.status(500).json({ message: 'Server error while updating research article.' });
    }
});

// DELETE /api/researches/:id (Admin Only)
// Deletes a research article.
router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query('DELETE FROM researches WHERE research_id = $1', [id]);

        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ message: 'Research article not found.' });
        }

        res.status(200).json({ message: 'Research article deleted successfully.' });
    } catch (err) {
        console.error('Delete Research Error:', err.message);
        res.status(500).json({ message: 'Server error while deleting research article.' });
    }
});


// --- Member Only Routes ---

// GET /api/researches
// Retrieves a paginated list of all research articles. Requires active membership.
router.get('/', authenticateToken, checkMembership, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const query = `
            SELECT 
                r.research_id, r.stock_symbol, r.title, r.content, r.published_at,
                u.full_name AS author_name
            FROM researches r
            JOIN users u ON r.author_id = u.user_id
            ORDER BY r.published_at DESC
            LIMIT $1 OFFSET $2;
        `;

        const articles = await pool.query(query, [limit, offset]);
        res.status(200).json(articles.rows);
    } catch (err) {
        console.error('Get Researches List Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving research articles.' });
    }
});

// GET /api/researches/:id
// Retrieves a single research article by ID. Requires active membership.
router.get('/:id', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                r.research_id, r.stock_symbol, r.title, r.content, r.published_at, r.updated_at,
                u.full_name AS author_name
            FROM researches r
            JOIN users u ON r.author_id = u.user_id
            WHERE r.research_id = $1;
        `;
        const article = await pool.query(query, [id]);

        if (article.rows.length === 0) {
            return res.status(404).json({ message: 'Research article not found.' });
        }

        res.status(200).json(article.rows[0]);
    } catch (err) {
        console.error('Get Single Research Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving research article.' });
    }
});

export default router;
