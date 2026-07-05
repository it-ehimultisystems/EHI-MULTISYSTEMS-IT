import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('user_profiles').select('id, email, name, role, hub_id, hub_type, active, phone, can_edit_ledger, can_print_receipts, can_print_tags, hubs(name, code)').limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
