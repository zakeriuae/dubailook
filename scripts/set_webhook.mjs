import fs from 'fs';
import readline from 'readline';

// Manual .env.local parsing to avoid 'dotenv' dependency
let token = '';
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/TELEGRAM_BOT_TOKEN=["']?([^"'\s]+)["']?/);
  if (match) token = match[1];
} catch (e) {
  console.error('Could not read .env.local');
}

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN missing in .env.local');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Please enter your public localtunnel URL (e.g., https://your-subdomain.loca.lt): ', async (url) => {
  if (!url) {
    console.error('URL is required');
    process.exit(1);
  }

  const cleanUrl = url.replace(/\/$/, '');
  const webhookUrl = `${cleanUrl}/api/telegram/webhook`;

  console.log(`Setting webhook to: ${webhookUrl}`);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'my_chat_member'],
      }),
    });

    const data = await res.json();
    if (data.ok) {
      console.log('✅ Webhook set successfully!');
    } else {
      console.error('❌ Failed to set webhook:', data);
    }
  } catch (error) {
    console.error('Error setting webhook:', error);
  } finally {
    rl.close();
  }
});
