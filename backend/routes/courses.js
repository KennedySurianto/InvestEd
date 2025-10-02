import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkAdmin from '../middleware/checkAdmin.js';
import checkMembership from '../middleware/checkMembership.js';
import jaroWinkler from 'jaro-winkler';

const router = express.Router();

// --- Admin Routes for Course Management ---

// POST /api/courses (Admin Only)
// Creates a new course.
router.post('/', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { title, description, category_id } = req.body;
        const author_id = req.user.userId; // Get author from the logged-in admin's token

        if (!title || !category_id) {
            return res.status(400).json({ message: 'Title and category_id are required.' });
        }

        const newCourse = await pool.query(
            'INSERT INTO courses (title, description, category_id, author_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, description, category_id, author_id]
        );

        res.status(201).json({
            message: 'Course created successfully!',
            course: newCourse.rows[0]
        });

    } catch (err) {
        // Handle foreign key violation if category_id does not exist
        if (err.code === '23503') {
            return res.status(400).json({ message: 'Invalid category_id. The specified category does not exist.' });
        }
        console.error('Create Course Error:', err.message);
        res.status(500).json({ message: 'Server error while creating the course.' });
    }
});

// PUT /api/courses/:id (Admin Only)
// Updates an existing course.
router.put('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category_id } = req.body;

        if (!title || !category_id) {
            return res.status(400).json({ message: 'Title and category_id are required.' });
        }

        const updatedCourse = await pool.query(
            'UPDATE courses SET title = $1, description = $2, category_id = $3, updated_at = NOW() WHERE course_id = $4 RETURNING *',
            [title, description, category_id, id]
        );

        if (updatedCourse.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        res.status(200).json({
            message: 'Course updated successfully!',
            course: updatedCourse.rows[0]
        });
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ message: 'Invalid category_id. The specified category does not exist.' });
        }
        console.error('Update Course Error:', err.message);
        res.status(500).json({ message: 'Server error while updating the course.' });
    }
});

// DELETE /api/courses/:id (Admin Only)
// Deletes a course.
router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query('DELETE FROM courses WHERE course_id = $1 RETURNING *', [id]);

        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        res.status(200).json({ message: 'Course deleted successfully.' });
    } catch (err) {
        console.error('Delete Course Error:', err.message);
        res.status(500).json({ message: 'Server error while deleting the course.' });
    }
});

// --- Member-Facing Routes for Viewing Courses ---

// GET /api/courses/category/:categoryId (For Members) - NEW
// Retrieves paginated courses for a specific category.
router.get('/category/:categoryId', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { categoryId } = req.params;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const coursesQuery = `
            SELECT 
                c.course_id, c.title, c.description, 
                cc.category_name, u.full_name AS author_name
            FROM courses c
            JOIN course_categories cc ON c.category_id = cc.category_id
            JOIN users u ON c.author_id = u.user_id
            WHERE c.category_id = $1
            ORDER BY c.created_at DESC
            LIMIT $2 OFFSET $3;
        `;
        
        const countQuery = 'SELECT COUNT(*) FROM courses WHERE category_id = $1;';

        const [coursesResult, countResult] = await Promise.all([
            pool.query(coursesQuery, [categoryId, limit, offset]),
            pool.query(countQuery, [categoryId])
        ]);

        const totalItems = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            data: coursesResult.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                limit
            }
        });

    } catch (err) {
        console.error('Get Courses by Category Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving courses for this category.' });
    }
});

// GET /api/courses/search (For Members) - NEW
// Searches courses using Jaro-Winkler distance.
router.get('/search', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { q: searchTerm } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
            return res.status(400).json({ message: 'A non-empty search term "q" is required.' });
        }

        // This query fetches all courses and can be slow on large datasets.
        const allCoursesQuery = `
            SELECT 
                c.course_id, c.title, c.description, 
                cc.category_name, u.full_name AS author_name
            FROM courses c
            JOIN course_categories cc ON c.category_id = cc.category_id
            JOIN users u ON c.author_id = u.user_id;
        `;
        const allCoursesResult = await pool.query(allCoursesQuery);
        
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        const scoredCourses = allCoursesResult.rows.map(course => {
            const titleScore = jaroWinkler(lowerCaseSearchTerm, course.title.toLowerCase());
            const descScore = course.description ? jaroWinkler(lowerCaseSearchTerm, course.description.toLowerCase()) : 0;
            
            // Weighted score gives more importance to the title.
            const totalScore = (titleScore * 0.7) + (descScore * 0.3);
            return { ...course, similarity: totalScore };
        });

        const similarityThreshold = 0.7;
        const relevantCourses = scoredCourses
            .filter(course => course.similarity >= similarityThreshold)
            .sort((a, b) => b.similarity - a.similarity);

        // Manually paginate the in-memory results
        const totalItems = relevantCourses.length;
        const totalPages = Math.ceil(totalItems / limit);
        const offset = (page - 1) * limit;
        const paginatedData = relevantCourses.slice(offset, offset + limit);

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
        console.error('Search Courses Error:', err.message);
        res.status(500).json({ message: 'Server error while searching for courses.' });
    }
});

// GET /api/courses (For Members) - UPDATED with Pagination
// Retrieves a paginated list of all courses.
router.get('/', authenticateToken, checkMembership, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const coursesQuery = `
            SELECT 
                c.course_id, 
                c.title, 
                c.description, 
                cc.category_name, 
                u.full_name AS author_name
            FROM courses c
            JOIN course_categories cc ON c.category_id = cc.category_id
            JOIN users u ON c.author_id = u.user_id
            ORDER BY c.created_at DESC
            LIMIT $1 OFFSET $2;
        `;
        
        const countQuery = 'SELECT COUNT(*) FROM courses;';

        const [coursesResult, countResult] = await Promise.all([
            pool.query(coursesQuery, [limit, offset]),
            pool.query(countQuery)
        ]);

        const totalItems = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            data: coursesResult.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                limit: limit
            }
        });

    } catch (err) {
        console.error('Get Courses Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving courses.' });
    }
});

// GET /api/courses/:id (For Members)
// Retrieves a single course with all its lessons.
router.get('/:id', authenticateToken, checkMembership, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Query for the course details
        const courseQuery = `
            SELECT 
                c.course_id, 
                c.title, 
                c.description, 
                c.category_id,
                cc.category_name, 
                u.full_name AS author_name
            FROM courses c
            JOIN course_categories cc ON c.category_id = cc.category_id
            JOIN users u ON c.author_id = u.user_id
            WHERE c.course_id = $1;
        `;
        const courseResult = await pool.query(courseQuery, [id]);

        if (courseResult.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Query for the lessons of that course
        const lessonsQuery = `
            SELECT lesson_id, title, content, video_url, lesson_order 
            FROM course_lessons 
            WHERE course_id = $1 
            ORDER BY lesson_order ASC;
        `;
        const lessonsResult = await pool.query(lessonsQuery, [id]);

        const course = courseResult.rows[0];
        course.lessons = lessonsResult.rows;

        res.status(200).json(course);

    } catch (err) {
        console.error('Get Single Course Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving the course.' });
    }
});

export default router;
