import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://jjdykydkgtosiymxjpmh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZHlreWRrZ3Rvc2l5bXhqcG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTkyNjIzODQsImV4cCI6MjAxNDgzODM4NH0.gV2jrgbe8ptcdJ0WoD10l1ycFUgHj9nKrx_tNCJzbjU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findVietnamUser() {
  console.log('=== FINDING ALL MANAGER ROWS IN SUPABASE ===');

  const { data: managers } = await supabase.from('Manager').select('*');
  console.log('Total Manager rows:', managers.length);

  managers.forEach(m => {
    if (m.name && (m.name.includes('베트남') || m.name.includes('테스트') || m.name.includes('관리자'))) {
      console.log(`ID: ${m.id} | Name: "${m.name}" | teamId: ${m.teamId} | isAdmin: ${m.isAdmin} | email: "${m.email}"`);
    }
  });
}

findVietnamUser();
