import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkAdmin from '../middleware/checkAdmin.js';
import checkMembership from '../middleware/checkMembership.js';

const router = express.Router();

// --- Admin Only Routes ---

// POST /api/news (Admin Only)
// Creates a new news article.
router.post('/', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { title, content, category_id } = req.body;
        const author_id = req.user.userId;

        if (!title || !content || !category_id) {
            return res.status(400).json({ message: 'Title, content, and category_id are required.' });
        }

        const newArticle = await pool.query(
            'INSERT INTO news (title, content, category_id, author_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, content, category_id, author_id]
        );

        res.status(201).json({
            message: 'News article created successfully!',
            article: newArticle.rows[0],
        });
    } catch (err) {
        console.error('Create News Error:', err.message);
        res.status(500).json({ message: 'Server error while creating news article.' });
    }
});

// PUT /api/news/:id (Admin Only)
// Updates an existing news article.
router.put('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category_id } = req.body;

        if (!title && !content && !category_id) {
            return res.status(400).json({ message: 'At least one field (title, content, category_id) must be provided for update.' });
        }
        
        // Dynamically build the update query
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
        if (category_id) {
            fields.push(`category_id = $${queryIndex++}`);
            values.push(category_id);
        }
        values.push(id);

        const updateQuery = `UPDATE news SET ${fields.join(', ')}, updated_at = NOW() WHERE news_id = $${queryIndex} RETURNING *`;
        const updatedArticle = await pool.query(updateQuery, values);

        if (updatedArticle.rows.length === 0) {
            return res.status(404).json({ message: 'News article not found.' });
        }

        res.status(200).json({
            message: 'News article updated successfully!',
            article: updatedArticle.rows[0],
        });
    } catch (err) {
        console.error('Update News Error:', err.message);
        res.status(500).json({ message: 'Server error while updating news article.' });
    }
});

// DELETE /api/news/:id (Admin Only)
// Deletes a news article.
router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query('DELETE FROM news WHERE news_id = $1', [id]);

        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ message: 'News article not found.' });
        }

        res.status(200).json({ message: 'News article deleted successfully.' });
    } catch (err) {
        console.error('Delete News Error:', err.message);
        res.status(500).json({ message: 'Server error while deleting news article.' });
    }
});


// --- Member Only Routes ---

// GET /api/news
// Retrieves a paginated list of all news articles. Requires active membership.
router.get('/', authenticateToken, checkMembership, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const query = `
            SELECT 
                n.news_id, n.title, n.content, n.published_at,
                nc.category_name,
                u.full_name AS author_name
            FROM news n
            JOIN news_categories nc ON n.category_id = nc.category_id
            JOIN users u ON n.author_id = u.user_id
            ORDER BY n.published_at DESC
            LIMIT $1 OFFSET $2;
        `;

        const articles = await pool.query(query, [limit, offset]);
        res.status(200).json(articles.rows);
    } catch (err) {
        console.error('Get News List Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving news articles.' });
    }
});

// GET /api/news/:id
// Retrieves a single news article by ID. Requires active membership.
router.get('/:id', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                n.news_id, n.title, n.content, n.published_at, n.updated_at,
                nc.category_name,
                u.full_name AS author_name
            FROM news n
            JOIN news_categories nc ON n.category_id = nc.category_id
            JOIN users u ON n.author_id = u.user_id
            WHERE n.news_id = $1;
        `;
        const article = await pool.query(query, [id]);

        if (article.rows.length === 0) {
            return res.status(404).json({ message: 'News article not found.' });
        }

        res.status(200).json(article.rows[0]);
    } catch (err) {
        console.error('Get Single News Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving news article.' });
    }
});

export default router;
