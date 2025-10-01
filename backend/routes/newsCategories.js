import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkAdmin from '../middleware/checkAdmin.js';
import jaroWinkler from 'jaro-winkler';

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
// Retrieves a paginated list of all news categories.
// Query Params: ?page=<number>&limit=<number>
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1) {
        return res.status(400).json({ message: 'Page and limit must be positive integers.' });
    }

    const offset = (page - 1) * limit;

    try {
        // Query for the paginated data
        const categoriesPromise = pool.query(
            'SELECT * FROM news_categories ORDER BY category_name ASC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        // Query for the total count
        const countPromise = pool.query('SELECT COUNT(*) FROM news_categories');

        // Execute both queries in parallel for efficiency
        const [categoriesResult, countResult] = await Promise.all([categoriesPromise, countPromise]);

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
        console.error('Get News Categories Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving news categories.' });
    }
});

// GET /api/news-categories/search
// Searches for news categories using Jaro-Winkler distance.
// Query Params: ?q=<searchTerm>
router.get('/search', async (req, res) => {
    const { q: searchTerm } = req.query;

    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
        return res.status(400).json({ message: 'A non-empty search term "q" is required.' });
    }

    try {
        // Note: For a very large number of categories (> few thousands), fetching all
        // and processing in Node.js can be inefficient. Consider using a database
        // extension like pg_trgm for larger-scale applications.
        const allCategoriesResult = await pool.query('SELECT category_id, category_name FROM news_categories');
        
        if (allCategoriesResult.rows.length === 0) {
            return res.status(200).json([]);
        }

        const scoredCategories = allCategoriesResult.rows.map(category => ({
            ...category,
            // Calculate similarity score between the search term and the category name
            similarity: jaroWinkler(searchTerm.toLowerCase(), category.category_name.toLowerCase())
        }));

        // Filter results above a certain threshold and sort by the best match
        const similarityThreshold = 0.7; // Adjust this value between 0 and 1
        const results = scoredCategories
            .filter(category => category.similarity >= similarityThreshold)
            .sort((a, b) => b.similarity - a.similarity);

        res.status(200).json(results);

    } catch (err) {
        console.error('Search News Categories Error:', err.message);
        res.status(500).json({ message: 'Server error while searching for news categories.' });
    }
});

// GET /api/news-categories/:id
// Retrieves a single news category by its ID.
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM news_categories WHERE category_id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'News category not found.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Get News Category by ID Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving news category.' });
    }
});

export default router;
