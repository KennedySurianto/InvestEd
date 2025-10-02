import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkAdmin from '../middleware/checkAdmin.js';
import jaroWinkler from 'jaro-winkler';

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

// GET /api/course-categories (Public & Paginated) - UPDATED
// Retrieves a paginated list of all course categories.
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const categoriesQuery = 'SELECT * FROM course_categories ORDER BY category_name ASC LIMIT $1 OFFSET $2';
        const countQuery = 'SELECT COUNT(*) FROM course_categories';

        const [categoriesResult, countResult] = await Promise.all([
            pool.query(categoriesQuery, [limit, offset]),
            pool.query(countQuery)
        ]);
        
        const totalItems = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            data: categoriesResult.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                limit: limit
            }
        });

    } catch (err) {
        console.error('Get Categories Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving course categories.' });
    }
});


// GET /api/course-categories/search (Public) - NEW
// Searches categories using Jaro-Winkler distance.
router.get('/search', async (req, res) => {
    try {
        const { q: searchTerm } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
            return res.status(400).json({ message: 'A non-empty search term "q" is required.' });
        }

        const allCategories = await pool.query('SELECT * FROM course_categories');

        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        const scoredCategories = allCategories.rows.map(category => {
            const nameScore = jaroWinkler(lowerCaseSearchTerm, category.category_name.toLowerCase());
            const descScore = category.description ? jaroWinkler(lowerCaseSearchTerm, category.description.toLowerCase()) : 0;
            
            // Weighted score: a match in the name is more important.
            const totalScore = (nameScore * 0.7) + (descScore * 0.3);

            return { ...category, similarity: totalScore };
        });

        const similarityThreshold = 0.7;
        const relevantCategories = scoredCategories
            .filter(category => category.similarity >= similarityThreshold)
            .sort((a, b) => b.similarity - a.similarity);

        const totalItems = relevantCategories.length;
        const totalPages = Math.ceil(totalItems / limit);
        const offset = (page - 1) * limit;
        const paginatedData = relevantCategories.slice(offset, offset + limit);
        
        res.status(200).json({
            data: paginatedData,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                limit
            }
        });

    } catch (err) {
        console.error('Search Categories Error:', err.message);
        res.status(500).json({ message: 'Server error while searching categories.' });
    }
});

// GET /api/course-categories/:id (Public)
// Retrieves a single course category by its ID.
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Query the database for a single category
        const query = 'SELECT * FROM course_categories WHERE category_id = $1';
        const categoryResult = await pool.query(query, [id]);

        // Check if a category was found
        if (categoryResult.rows.length === 0) {
            return res.status(404).json({ message: 'Course category not found.' });
        }

        // Send the found category as the response
        res.status(200).json(categoryResult.rows[0]);

    } catch (err) {
        console.error('Get Single Category Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving the course category.' });
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