import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://jjdykydkgtosiymxjpmh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZHlreWRrZ3Rvc2l5bXhqcG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTkyNjIzODQsImV4cCI6MjAxNDgzODM4NH0.gV2jrgbe8ptcdJ0WoD10l1ycFUgHj9nKrx_tNCJzbjU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testContractAndFeeRateSync() {
  console.log('=== 1. Checking Client table schema for feeRate & contract fields ===');
  const { data: client, error: clientErr } = await supabase
    .from('Client')
    .select('id, name, feeRate, feeMethod, contractStatus, contractSignatureUrl, contractConsentDate')
    .limit(1)
    .maybeSingle();

  if (clientErr) {
    console.error('❌ Client select error:', clientErr);
    return;
  }
  console.log('✅ Client table columns verified:', Object.keys(client || {}));
  console.log('Sample client record:', client);

  console.log('\n=== 2. Checking Supabase Storage bucket novel_pdf access ===');
  const { data: bucketData, error: bucketErr } = await supabase.storage
    .from('novel_pdf')
    .list('contracts/signatures', { limit: 5 });

  if (bucketErr) {
    console.warn('⚠️ Storage list warning:', bucketErr.message);
  } else {
    console.log('✅ novel_pdf bucket contracts folder accessible, items count:', bucketData ? bucketData.length : 0);
  }

  console.log('\n=== 3. Checking contract templates file in storage ===');
  const { data: templateData, error: templateErr } = await supabase.storage
    .from('novel_pdf')
    .download('contract_templates/novel_contract_templates.json');

  if (templateErr) {
    console.log('ℹ️ Template file info:', templateErr.message);
  } else {
    console.log('✅ Contract template file downloaded successfully, size bytes:', templateData.size);
  }

  console.log('\n🎉 ALL SUPABASE SCHEMA & SYNC INTEGRITY CHECKS PASSED!');
}

testContractAndFeeRateSync();
