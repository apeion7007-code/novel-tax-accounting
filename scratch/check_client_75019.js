import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://jjdykydkgtosiymxjpmh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZHlreWRrZ3Rvc2l5bXhqcG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTkyNjIzODQsImV4cCI6MjAxNDgzODM4NH0.gV2jrgbe8ptcdJ0WoD10l1ycFUgHj9nKrx_tNCJzbjU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkClient() {
  console.log('=== CHECKING CLIENT SERIAL 75019 ===');
  const { data, error } = await supabase.from('Client').select('*').eq('serial', 75019);
  console.log('Client 75019 data:', data);
  if (error) console.error('Error:', error);

  const { data: mgrs } = await supabase.from('Manager').select('*');
  if (data && data.length > 0) {
    const c = data[0];
    const m = mgrs.find(mgr => mgr.id === c.managerId);
    console.log('Resolved Manager for Client 75019:', m);
  }
}

checkClient();
