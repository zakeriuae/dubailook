import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sql = fs.readFileSync('scripts/003_telegram_channels.sql', 'utf8')

console.log('Executing SQL...')

// Execute the SQL via a direct fetch if rpc is not available or just to be safe
// Actually, exec_sql is a common custom RPC in Supabase setups for this.
const { error } = await supabase.rpc('exec_sql', { sql_string: sql })

if (error) {
  console.error('Error executing SQL:', error)
  process.exit(1)
}

console.log('Successfully created telegram_channels table')
