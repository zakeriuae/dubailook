import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error('Missing POSTGRES_URL_NON_POOLING in environment');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const sql = fs.readFileSync('scripts/003_telegram_channels.sql', 'utf8');

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');
    await client.query(sql);
    console.log('Successfully created telegram_channels table');
  } catch (err) {
    console.error('Error executing SQL:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
