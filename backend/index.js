import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Import routes - note the required .js extension for local modules in ESM
import userRoutes from './routes/users.js';

// --- INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
// Enable Cross-Origin Resource Sharing for all routes
app.use(cors()); 
// Enable the express.json middleware to parse JSON request bodies
app.use(express.json()); 

// --- USE ROUTES ---
// Mount the user router. Any request starting with /api/users will be handled by this router.
app.use('/api/users', userRoutes);

// --- A simple root route for testing if the server is running ---
app.get('/', (req, res) => {
    res.send('InvestEd API (ESM) is running!');
});

// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

