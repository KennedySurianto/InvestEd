import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkAdmin from '../middleware/checkAdmin.js';

const router = express.Router();

// --- Course Category Routes ---

// POST /api/course-categories (Admin Only)
// Creates a new course category.
router.post('/', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { category_name, description } = req.body;
        if (!category_name) {
            return res.status(400).json({ message: 'Category name is required.' });
        }

        const newCategory = await pool.query(
            'INSERT INTO course_categories (category_name, description) VALUES ($1, $2) RETURNING *',
            [category_name, description]
        );

        res.status(201).json({
            message: 'Course category created successfully!',
            category: newCategory.rows[0]
        });

    } catch (err) {
        // Catches potential unique constraint violation if category_name already exists
        if (err.code === '23505') {
            return res.status(409).json({ message: 'A category with this name already exists.' });
        }
        console.error('Create Category Error:', err.message);
        res.status(500).json({ message: 'Server error while creating course category.' });
    }
});

// GET /api/course-categories (Public)
// Retrieves a list of all course categories. No auth required.
router.get('/', async (req, res) => {
    try {
        const allCategories = await pool.query('SELECT * FROM course_categories ORDER BY category_name ASC');
        res.status(200).json(allCategories.rows);
    } catch (err) {
        console.error('Get Categories Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving course categories.' });
    }
});


// PUT /api/course-categories/:id (Admin Only)
// Updates an existing course category.
router.put('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name, description } = req.body;

        if (!category_name) {
            return res.status(400).json({ message: 'Category name is required.' });
        }

        const updatedCategory = await pool.query(
            'UPDATE course_categories SET category_name = $1, description = $2 WHERE category_id = $3 RETURNING *',
            [category_name, description, id]
        );

        if (updatedCategory.rows.length === 0) {
            return res.status(404).json({ message: 'Course category not found.' });
        }

        res.status(200).json({
            message: 'Course category updated successfully!',
            category: updatedCategory.rows[0]
        });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'A category with this name already exists.' });
        }
        console.error('Update Category Error:', err.message);
        res.status(500).json({ message: 'Server error while updating course category.' });
    }
});

// DELETE /api/course-categories/:id (Admin Only)
// Deletes a course category.
router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query('DELETE FROM course_categories WHERE category_id = $1 RETURNING *', [id]);

        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ message: 'Course category not found.' });
        }

        res.status(200).json({ message: 'Course category deleted successfully.' });

    } catch (err) {
        console.error('Delete Category Error:', err.message);
        res.status(500).json({ message: 'Server error while deleting course category.' });
    }
});

export default router;