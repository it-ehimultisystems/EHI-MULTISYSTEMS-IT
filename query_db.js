import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: cargoData, error: cargoErr } = await supabase.from('cargo_entries').select('entry_ref,user_profiles(name)').limit(5);
  console.log("Cargo Error:", cargoErr);
  console.log("Cargo Data sample:", cargoData);

  const { data: baggageData, error: baggageErr } = await supabase.from('manifests').select('transaction_id,user_profiles(name)').limit(5);
  console.log("Baggage Error:", baggageErr);
}
run();
