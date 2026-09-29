import fs from 'fs';
import path from 'path';
import pool from './db.js';
import bcrypt from 'bcryptjs';

export const initializeDatabase = async () => {
  try {
    console.log('Initializing database schema...');
    // Use path.resolve with process.cwd() to handle Windows paths safely
    const schemaPath = path.resolve(process.cwd(), '../database/migrations/schema.sql');
    const seedPath = path.resolve(process.cwd(), '../database/seed.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('Database schema initialized.');

    console.log('Seeding default users and books...');
    // Dynamically hash passwords to ensure they are valid for login
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    const userPasswordHash = bcrypt.hashSync('user123', 10);

    // Insert or update seed users with correct passwords
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role) 
      VALUES 
        ('System Admin', 'admin@library.com', $1, 'ADMIN'),
        ('John Doe', 'user@library.com', $2, 'USER')
      ON CONFLICT (email) 
      DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `, [adminPasswordHash, userPasswordHash]);

    // Read and run seed.sql to insert books (ON CONFLICT DO NOTHING)
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await pool.query(seedSql);
    } else {
      console.warn(`Seed file not found at: ${seedPath}`);
    }

    console.log('Database initialized and seeded successfully.');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};

// Check if this script is executed directly
const currentFilePath = path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const executedFilePath = path.resolve(process.argv[1]);

if (currentFilePath === executedFilePath || executedFilePath.endsWith('initDb.js')) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization script finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database initialization script failed:', err);
      process.exit(1);
    });
}
