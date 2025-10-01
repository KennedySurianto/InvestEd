import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkAdmin from '../middleware/checkAdmin.js';
import checkMembership from '../middleware/checkMembership.js';
import jaroWinkler from 'jaro-winkler';

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
// Retrieves a paginated list of all news articles.
router.get('/', authenticateToken, checkMembership, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const articlesQuery = `
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
        
        const countQuery = 'SELECT COUNT(*) FROM news;';

        // Run data and count queries in parallel
        const [articlesResult, countResult] = await Promise.all([
            pool.query(articlesQuery, [limit, offset]),
            pool.query(countQuery)
        ]);
        
        const totalItems = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            data: articlesResult.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                limit
            }
        });

    } catch (err) {
        console.error('Get News List Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving news articles.' });
    }
});


// GET /api/news/search
// Searches news titles and content using Jaro-Winkler distance.
// Query Params: ?q=<searchTerm>&page=<number>&limit=<number>
router.get('/search', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { q: searchTerm } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
            return res.status(400).json({ message: 'A non-empty search term "q" is required.' });
        }

        // Fetches all articles to be processed in the application. See performance note.
        const allArticles = await pool.query(`
            SELECT 
                n.news_id, n.title, n.content, n.published_at,
                nc.category_name, u.full_name AS author_name
            FROM news n
            JOIN news_categories nc ON n.category_id = nc.category_id
            JOIN users u ON n.author_id = u.user_id;
        `);

        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        // Calculate a similarity score for each article
        const scoredArticles = allArticles.rows.map(article => {
            const titleScore = jaroWinkler(lowerCaseSearchTerm, article.title.toLowerCase());
            // To improve performance, we only score a snippet of the content
            const contentSnippet = article.content.substring(0, 300).toLowerCase();
            const contentScore = jaroWinkler(lowerCaseSearchTerm, contentSnippet);
            
            // The article's final score is the higher of its title or content score
            return { ...article, similarity: Math.max(titleScore, contentScore) };
        });

        // Filter out low-scoring results and sort by the best match
        const similarityThreshold = 0.8; // Adjust this threshold as needed
        const relevantArticles = scoredArticles
            .filter(article => article.similarity >= similarityThreshold)
            .sort((a, b) => b.similarity - a.similarity);

        // Manually paginate the filtered and sorted array
        const totalItems = relevantArticles.length;
        const totalPages = Math.ceil(totalItems / limit);
        const offset = (page - 1) * limit;
        const paginatedData = relevantArticles.slice(offset, offset + limit);
        
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
        console.error('Search News Error:', err.message);
        res.status(500).json({ message: 'Server error while searching for news articles.' });
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

// GET /api/news/category/:categoryId
// Retrieves a paginated list of news articles for a specific category.
router.get('/category/:categoryId', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { categoryId } = req.params;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const articlesQuery = `
            SELECT 
                n.news_id, n.title, n.content, n.published_at,
                nc.category_name,
                u.full_name AS author_name
            FROM news n
            JOIN news_categories nc ON n.category_id = nc.category_id
            JOIN users u ON n.author_id = u.user_id
            WHERE n.category_id = $1
            ORDER BY n.published_at DESC
            LIMIT $2 OFFSET $3;
        `;
        
        const countQuery = 'SELECT COUNT(*) FROM news WHERE category_id = $1;';

        // Run data and count queries in parallel
        const [articlesResult, countResult] = await Promise.all([
            pool.query(articlesQuery, [categoryId, limit, offset]),
            pool.query(countQuery, [categoryId])
        ]);

        const totalItems = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            data: articlesResult.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                limit
            }
        });

    } catch (err) {
        console.error('Get News By Category Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving news articles by category.' });
    }
});

export default router;
