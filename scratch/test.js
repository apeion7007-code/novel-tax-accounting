import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://jjdykydkgtosiymxjpmh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZHlreWRrZ3Rvc2l5bXhqcG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTkyNjIzODQsImV4cCI6MjAxNDgzODM4NH0.gV2jrgbe8ptcdJ0WoD10l1ycFUgHj9nKrx_tNCJzbjU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: teams, error: e1 } = await supabase.from('Team').select('*');
  console.log('Teams:', teams ? teams.length : null, e1);
  const { data: managers, error: e2 } = await supabase.from('Manager').select('*');
  console.log('Managers:', managers ? managers.length : null, e2);
  const { data: clients, error: e3 } = await supabase.from('Client').select('*').limit(5);
  console.log('Clients:', clients ? clients.length : null, e3);
}
run();
