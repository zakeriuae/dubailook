
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const connectionString = process.env.POSTGRES_URL_NON_POOLING;

async function check() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- Profiles ---');
    const profiles = await client.query('SELECT telegram_id, telegram_username, is_admin FROM profiles WHERE is_admin = true');
    console.table(profiles.rows);

    console.log('\n--- Telegram Channels ---');
    const channels = await client.query('SELECT * FROM telegram_channels');
    console.table(channels.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
