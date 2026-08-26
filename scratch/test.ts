import { createClient } from '@supabase/supabase-js';

const url = 'https://rdwneiglefsoutpjwxsy.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd25laWdsZWZzb3V0cGp3eHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2ODYxMzUsImV4cCI6MjEwMTI2MjEzNX0.u3I3suk6AetzLTyw4560u7y-3IsIX4ukom_I_9-TQlM';
const supabase = createClient(url, key);

async function run() {
  console.log('Testing SELECT...');
  const { data: selData, error: selErr } = await supabase.from('bookings').select('*').limit(5);
  console.log('SELECT:', { selData, selErr });

  console.log('Testing INSERT...');
  const { data: insData, error: insErr } = await supabase.from('bookings').insert([{
    service_title: 'Teste',
    client_name: 'Teste Client',
    client_phone: '81987563348',
    booking_date: '2026-08-10',
    booking_time: '10:00',
    status: 'confirmed'
  }]).select();
  console.log('INSERT:', { insData, insErr });
}

run();
