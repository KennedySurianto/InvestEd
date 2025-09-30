import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkAdmin from '../middleware/checkAdmin.js';

const router = express.Router();

// --- Admin Only Routes ---

// POST /api/news-categories (Admin Only)
// Creates a new news category.
router.post('/', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { category_name } = req.body;
        if (!category_name) {
            return res.status(400).json({ message: 'Category name is required.' });
        }

        const newCategory = await pool.query(
            'INSERT INTO news_categories (category_name) VALUES ($1) RETURNING *',
            [category_name]
        );

        res.status(201).json({
            message: 'News category created successfully!',
            category: newCategory.rows[0],
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'A news category with this name already exists.' });
        }
        console.error('Create News Category Error:', err.message);
        res.status(500).json({ message: 'Server error while creating news category.' });
    }
});

// PUT /api/news-categories/:id (Admin Only)
// Updates an existing news category.
router.put('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name } = req.body;
        if (!category_name) {
            return res.status(400).json({ message: 'Category name is required.' });
        }

        const updatedCategory = await pool.query(
            'UPDATE news_categories SET category_name = $1 WHERE category_id = $2 RETURNING *',
            [category_name, id]
        );

        if (updatedCategory.rows.length === 0) {
            return res.status(404).json({ message: 'News category not found.' });
        }

        res.status(200).json({
            message: 'News category updated successfully!',
            category: updatedCategory.rows[0],
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'A news category with this name already exists.' });
        }
        console.error('Update News Category Error:', err.message);
        res.status(500).json({ message: 'Server error while updating news category.' });
    }
});

// DELETE /api/news-categories/:id (Admin Only)
// Deletes a news category.
router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query('DELETE FROM news_categories WHERE category_id = $1 RETURNING *', [id]);

        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ message: 'News category not found.' });
        }

        res.status(200).json({ message: 'News category deleted successfully.' });
    } catch (err) {
        console.error('Delete News Category Error:', err.message);
        res.status(500).json({ message: 'Server error while deleting news category.' });
    }
});

// --- Public Route ---

// GET /api/news-categories
// Retrieves a list of all news categories.
router.get('/', async (req, res) => {
    try {
        const allCategories = await pool.query('SELECT * FROM news_categories ORDER BY category_name ASC');
        res.status(200).json(allCategories.rows);
    } catch (err) {
        console.error('Get News Categories Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving news categories.' });
    }
});

export default router;
