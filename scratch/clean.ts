import { createClient } from '@supabase/supabase-js';

const url = 'https://rdwneiglefsoutpjwxsy.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd25laWdsZWZzb3V0cGp3eHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2ODYxMzUsImV4cCI6MjEwMTI2MjEzNX0.u3I3suk6AetzLTyw4560u7y-3IsIX4ukom_I_9-TQlM';
const supabase = createClient(url, key);

async function run() {
  await supabase.from('bookings').delete().eq('client_name', 'Teste Client');
  console.log('Cleaned up test record.');
}

run();
