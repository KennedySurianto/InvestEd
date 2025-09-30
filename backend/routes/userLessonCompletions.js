import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkMembership from '../middleware/checkMembership.js';

const router = express.Router();

// --- All routes in this file require an authenticated user with an active membership ---
router.use(authenticateToken, checkMembership);

// POST /api/lessons/:lessonId/complete
// Marks a lesson as complete for the current user and updates course progress.
router.post('/lessons/:lessonId/complete', async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user.userId;
    const client = await pool.connect(); // Use a client for transaction

    try {
        await client.query('BEGIN'); // Start transaction

        // 1. Get the course_id for the given lessonId
        const lessonResult = await client.query('SELECT course_id FROM course_lessons WHERE lesson_id = $1', [lessonId]);
        if (lessonResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Lesson not found.' });
        }
        const { course_id: courseId } = lessonResult.rows[0];

        // 2. Verify the user is enrolled in this course
        const enrollmentCheck = await client.query('SELECT enrollment_id FROM user_course_enrollment WHERE user_id = $1 AND course_id = $2', [userId, courseId]);
        if (enrollmentCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'You are not enrolled in the course this lesson belongs to.' });
        }

        // 3. Insert into user_lesson_completion. The UNIQUE constraint will handle duplicates.
        await client.query('INSERT INTO user_lesson_completion (user_id, lesson_id) VALUES ($1, $2)', [userId, lessonId]);

        // 4. Recalculate progress
        const totalLessonsResult = await client.query('SELECT COUNT(*) FROM course_lessons WHERE course_id = $1', [courseId]);
        const totalLessons = parseInt(totalLessonsResult.rows[0].count, 10);

        const completedLessonsResult = await client.query(
            'SELECT COUNT(*) FROM user_lesson_completion ulc JOIN course_lessons cl ON ulc.lesson_id = cl.lesson_id WHERE ulc.user_id = $1 AND cl.course_id = $2',
            [userId, courseId]
        );
        const completedLessons = parseInt(completedLessonsResult.rows[0].count, 10);

        const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        const isCompleted = progressPercentage === 100;

        // 5. Update the user_course_enrollment table
        const updatedEnrollment = await client.query(
            'UPDATE user_course_enrollment SET progress_percentage = $1, completion_status = $2 WHERE user_id = $3 AND course_id = $4 RETURNING progress_percentage, completion_status',
            [progressPercentage, isCompleted, userId, courseId]
        );

        await client.query('COMMIT'); // Commit transaction

        res.status(200).json({
            message: 'Lesson marked as complete!',
            progress: updatedEnrollment.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK'); // Rollback on any error
        if (err.code === '23505') { // Handles trying to complete the same lesson twice
            return res.status(409).json({ message: 'You have already completed this lesson.' });
        }
        console.error('Complete Lesson Error:', err.message);
        res.status(500).json({ message: 'Server error while marking lesson as complete.' });
    } finally {
        client.release(); // Release the client back to the pool
    }
});


export default router;
