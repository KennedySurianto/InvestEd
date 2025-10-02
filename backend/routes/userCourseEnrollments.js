import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkMembership from '../middleware/checkMembership.js';

const router = express.Router();

// --- All routes in this file require an authenticated user ---
router.use(authenticateToken);

// POST /api/courses/:courseId/enroll
// Enrolls the current user in a specific course. Requires an active membership.
router.post('/courses/:courseId/enroll', checkMembership, async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.userId;

        // Check if the course exists
        const courseCheck = await pool.query('SELECT course_id FROM courses WHERE course_id = $1', [courseId]);
        if (courseCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        
        // The UNIQUE constraint on (user_id, course_id) in the DDL will prevent duplicates.
        // The database will throw an error if an enrollment already exists.
        const newEnrollment = await pool.query(
            'INSERT INTO user_course_enrollment (user_id, course_id) VALUES ($1, $2) RETURNING *',
            [userId, courseId]
        );

        res.status(201).json({
            message: 'Successfully enrolled in the course!',
            enrollment: newEnrollment.rows[0]
        });

    } catch (err) {
        // Handle unique constraint violation (user is already enrolled)
        if (err.code === '23505') {
            return res.status(409).json({ message: 'You are already enrolled in this course.' });
        }
        console.error('Enrollment Error:', err.message);
        res.status(500).json({ message: 'Server error during course enrollment.' });
    }
});

// GET /api/my-enrollments
// Retrieves all course enrollments for the current user. Does not require active membership.
router.get('/my-enrollments', async (req, res) => {
    try {
        const userId = req.user.userId;

        const query = `
            SELECT 
                uce.enrollment_id,
                uce.enrollment_date,
                uce.completion_status,
                uce.progress_percentage,
                c.course_id,
                c.title,
                c.description,
                cc.category_name
            FROM user_course_enrollment uce
            JOIN courses c ON uce.course_id = c.course_id
            JOIN course_categories cc ON c.category_id = cc.category_id
            WHERE uce.user_id = $1
            ORDER BY uce.enrollment_date DESC;
        `;
        const enrollments = await pool.query(query, [userId]);
        res.status(200).json(enrollments.rows);

    } catch (err) {
        console.error('Get Enrollments Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving your enrollments.' });
    }
});

// --- In a relevant router file like routes/enrollments.js ---

// GET /api/enrollments/course/:courseId/completed-lessons
// Retrieves a list of completed lesson IDs for the current user in a specific course.
router.get('/enrollments/course/:courseId/completed-lessons', authenticateToken, async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.userId;

        const query = `
            SELECT ulc.lesson_id 
            FROM user_lesson_completion ulc
            JOIN course_lessons cl ON ulc.lesson_id = cl.lesson_id
            WHERE ulc.user_id = $1 AND cl.course_id = $2;
        `;
        const completedResult = await pool.query(query, [userId, courseId]);

        // Return a simple array of lesson IDs for easy lookup on the frontend
        const completedLessonIds = completedResult.rows.map(row => row.lesson_id);
        
        res.status(200).json(completedLessonIds);

    } catch (err) {
        console.error('Get Completed Lessons Error:', err.message);
        res.status(500).json({ message: 'Server error while retrieving lesson progress.' });
    }
});

export default router;
