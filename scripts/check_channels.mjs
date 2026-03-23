import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

// Ignore SSL certificate errors for this debug script
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Manual .env.local parsing to avoid 'dotenv' dependency
let connectionString = '';
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/POSTGRES_URL_NON_POOLING=["']?([^"'\s]+)["']?/);
  if (match) connectionString = match[1];
} catch (e) {
  console.error('Could not read .env.local');
}

if (!connectionString) {
  console.error('POSTGRES_URL_NON_POOLING missing in .env.local');
  process.exit(1);
}

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const res = await client.query('SELECT chat_id, title, is_active FROM telegram_channels');
    console.log(`Found ${res.rowCount} channels`);
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
