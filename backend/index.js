import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Import routes - note the required .js extension for local modules in ESM
import userRoutes from './routes/users.js';
import courseCategoryRoutes from './routes/courseCategories.js';
import courseRoutes from './routes/courses.js';
import courseLessonRoutes from './routes/courseLessons.js';
import userEnrollmentRoutes from './routes/userCourseEnrollments.js';
import userLessonCompletionRoutes from './routes/userLessonCompletions.js';
import newsCategoriesRoutes from './routes/newsCategories.js';
import newsRoutes from './routes/news.js';
import researchRoutes from './routes/researches.js';
import forumRoutes from './routes/forums.js';
import forumRepliesRoutes from './routes/forumReplies.js';

// --- INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
// Enable Cross-Origin Resource Sharing for all routes
app.use(cors()); 
// Enable the express.json middleware to parse JSON request bodies
app.use(express.json()); 

// --- USE ROUTES ---
app.use('/api/users', userRoutes);
app.use('/api/course-categories', courseCategoryRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/courses/:courseId/lessons', courseLessonRoutes);
app.use('/api', userEnrollmentRoutes); // Note: userEnrollmentRoutes handles its own sub-paths
app.use('/api', userLessonCompletionRoutes); // Note: userLessonCompletionRoutes handles its own sub-paths
app.use('/api/news-categories', newsCategoriesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/researches', researchRoutes);
app.use('/api/forums', forumRoutes);
app.use('/api/forums/:forumId/replies', forumRepliesRoutes);

// --- A simple root route for testing if the server is running ---
app.get('/', (req, res) => {
    res.send('InvestEd API (ESM) is running!');
});

// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

