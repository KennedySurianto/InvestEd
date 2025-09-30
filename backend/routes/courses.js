import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkAdmin from '../middleware/checkAdmin.js';
import checkMembership from '../middleware/checkMembership.js';

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

// GET /api/courses (For Members)
// Retrieves the public catalog of all courses.
router.get('/', authenticateToken, checkMembership, async (req, res) => {
    try {
        const query = `
            SELECT 
                c.course_id, 
                c.title, 
                c.description, 
                cc.category_name, 
                u.full_name AS author_name
            FROM courses c
            JOIN course_categories cc ON c.category_id = cc.category_id
            JOIN users u ON c.author_id = u.user_id
            ORDER BY c.created_at DESC;
        `;
        const allCourses = await pool.query(query);
        res.status(200).json(allCourses.rows);
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
