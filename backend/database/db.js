import { Pool } from 'pg';
import 'dotenv/config';

// Create a single instance of the connection pool.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // max: 20,
    // idleTimeoutMillis: 30000,
    // connectionTimeoutMillis: 2000,
});

// You can also export the pool itself if you need access to it directly
export default pool;
