import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/authenticateToken.js';
import checkAdmin from '../middleware/checkAdmin.js';

// Using { mergeParams: true } allows us to access parameters from the parent router (e.g., :courseId)
const router = express.Router({ mergeParams: true });

// --- All routes in this file are protected and for admins only ---
router.use(authenticateToken, checkAdmin);

// POST /api/courses/:courseId/lessons
// Creates a new lesson for a specific course.
router.post('/', async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, content, video_url, lesson_order } = req.body;

        if (!title || lesson_order === undefined) {
            return res.status(400).json({ message: 'Lesson title and lesson_order are required.' });
        }

        const newLesson = await pool.query(
            'INSERT INTO course_lessons (course_id, title, content, video_url, lesson_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [courseId, title, content, video_url, lesson_order]
        );

        res.status(201).json({
            message: 'Lesson created successfully!',
            lesson: newLesson.rows[0]
        });

    } catch (err) {
        // Handle unique constraint violation for (course_id, lesson_order)
        if (err.code === '23505') {
            return res.status(409).json({ message: 'A lesson with this order number already exists for this course.' });
        }
        // Handle foreign key violation if courseId is invalid
        if (err.code === '23503') {
            return res.status(404).json({ message: 'Course not found.' });
        }
        console.error('Create Lesson Error:', err.message);
        res.status(500).json({ message: 'Server error while creating the lesson.' });
    }
});

// PUT /api/courses/:courseId/lessons/:lessonId
// Updates an existing lesson.
router.put('/:lessonId', async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const { title, content, video_url, lesson_order } = req.body;

        if (!title || lesson_order === undefined) {
            return res.status(400).json({ message: 'Lesson title and lesson_order are required.' });
        }

        const updatedLesson = await pool.query(
            'UPDATE course_lessons SET title = $1, content = $2, video_url = $3, lesson_order = $4, updated_at = NOW() WHERE lesson_id = $5 AND course_id = $6 RETURNING *',
            [title, content, video_url, lesson_order, lessonId, courseId]
        );

        if (updatedLesson.rows.length === 0) {
            return res.status(404).json({ message: 'Lesson not found in this course.' });
        }

        res.status(200).json({
            message: 'Lesson updated successfully!',
            lesson: updatedLesson.rows[0]
        });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'A lesson with this order number already exists for this course.' });
        }
        console.error('Update Lesson Error:', err.message);
        res.status(500).json({ message: 'Server error while updating the lesson.' });
    }
});

// DELETE /api/courses/:courseId/lessons/:lessonId
// Deletes a lesson.
router.delete('/:lessonId', async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const deleteOp = await pool.query(
            'DELETE FROM course_lessons WHERE lesson_id = $1 AND course_id = $2 RETURNING *', 
            [lessonId, courseId]
        );

        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ message: 'Lesson not found in this course.' });
        }

        res.status(200).json({ message: 'Lesson deleted successfully.' });
        
    } catch (err) {
        console.error('Delete Lesson Error:', err.message);
        res.status(500).json({ message: 'Server error while deleting the lesson.' });
    }
});


export default router;
