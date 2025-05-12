#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection string
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/team_polls';

// Get migration files
const migrationsDir = path.join(__dirname, '../migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort(); // Sort to ensure correct order

// Create a client
const client = new Client({
  connectionString: databaseUrl,
});

async function runMigrations() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Get applied migrations
    const { rows: appliedMigrations } = await client.query('SELECT name FROM migrations');
    const appliedMigrationNames = appliedMigrations.map(row => row.name);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!appliedMigrationNames.includes(file)) {
        console.log(`Applying migration: ${file}`);
        
        const migrationContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        // Begin transaction
        await client.query('BEGIN');
        
        try {
          // Execute migration
          await client.query(migrationContent);
          
          // Record migration
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          
          // Commit transaction
          await client.query('COMMIT');
          
          console.log(`Migration applied successfully: ${file}`);
        } catch (error) {
          // Rollback transaction on error
          await client.query('ROLLBACK');
          console.error(`Error applying migration ${file}:`, error);
          process.exit(1);
        }
      } else {
        console.log(`Migration already applied: ${file}`);
      }
    }

    console.log('All migrations have been applied successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await client.end();
  }
}

runMigrations();