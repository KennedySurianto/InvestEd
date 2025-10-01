import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkAdmin from '../middleware/checkAdmin.js';
import checkMembership from '../middleware/checkMembership.js';
import jaroWinkler from 'jaro-winkler';

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

// GET /api/researches/search
// Searches research articles using Jaro-Winkler distance.
// Query Params: ?q=<searchTerm>&page=<number>&limit=<number>
router.get('/search', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { q: searchTerm } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
            return res.status(400).json({ message: 'A non-empty search term "q" is required.' });
        }

        // See the performance warning below regarding this query.
        const allResearches = await pool.query(`
            SELECT 
                r.research_id, r.stock_symbol, r.title, r.content, r.published_at,
                u.full_name AS author_name
            FROM researches r
            JOIN users u ON r.author_id = u.user_id;
        `);

        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        const scoredResearches = allResearches.rows.map(article => {
            // Calculate individual similarity scores for each relevant field.
            const symbolScore = jaroWinkler(lowerCaseSearchTerm, article.stock_symbol.toLowerCase());
            const titleScore = jaroWinkler(lowerCaseSearchTerm, article.title.toLowerCase());
            const contentSnippet = article.content.substring(0, 300).toLowerCase();
            const contentScore = jaroWinkler(lowerCaseSearchTerm, contentSnippet);
            
            // Calculate a weighted total score. A match in the symbol or title is more important.
            const totalScore = (symbolScore * 0.5) + (titleScore * 0.4) + (contentScore * 0.1);

            return { ...article, similarity: totalScore };
        });

        // Filter out low-scoring results and sort by the best match.
        const similarityThreshold = 0.6; // Adjust this threshold as needed (0 to 1).
        const relevantResearches = scoredResearches
            .filter(article => article.similarity >= similarityThreshold)
            .sort((a, b) => b.similarity - a.similarity);

        // Manually paginate the filtered and sorted array.
        const totalItems = relevantResearches.length;
        const totalPages = Math.ceil(totalItems / limit);
        const offset = (page - 1) * limit;
        const paginatedData = relevantResearches.slice(offset, offset + limit);
        
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
        console.error('Search Researches Error:', err.message);
        res.status(500).json({ message: 'Server error while searching for research articles.' });
    }
});

// GET /api/researches
// Retrieves a paginated list of all research articles. Requires active membership.
router.get('/', authenticateToken, checkMembership, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        // Query to get the articles for the current page
        const articlesQuery = `
            SELECT 
                r.research_id, r.stock_symbol, r.title, r.content, r.published_at,
                u.full_name AS author_name
            FROM researches r
            JOIN users u ON r.author_id = u.user_id
            ORDER BY r.published_at DESC
            LIMIT $1 OFFSET $2;
        `;
        
        // Query to get the total count of all articles
        const countQuery = 'SELECT COUNT(*) FROM researches;';

        // Execute both queries in parallel
        const [articlesResult, countResult] = await Promise.all([
            pool.query(articlesQuery, [limit, offset]),
            pool.query(countQuery)
        ]);
        
        const totalItems = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        // Send a structured response with data and pagination info
        res.status(200).json({
            data: articlesResult.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                limit: limit
            }
        });

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
