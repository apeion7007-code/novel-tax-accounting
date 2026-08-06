import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://jjdykydkgtosiymxjpmh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZHlreWRrZ3Rvc2l5bXhqcG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTkyNjIzODQsImV4cCI6MjAxNDgzODM4NH0.gV2jrgbe8ptcdJ0WoD10l1ycFUgHj9nKrx_tNCJzbjU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCounts() {
  console.log('=== Supabase 우즈베키스탄 관련 데이터 조회 ===');

  // 1. 전체 Client 수
  const { count: totalClients, error: totalErr } = await supabase
    .from('Client')
    .select('*', { count: 'exact', head: true });
  console.log('1. DB 전체 Client 수:', totalClients);

  // 2. country가 '우즈베키스탄' 또는 '우즈베키스탄팀'인 레코드 수
  const { count: countryCount, error: countryErr } = await supabase
    .from('Client')
    .select('*', { count: 'exact', head: true })
    .ilike('country', '%우즈베키스탄%');
  console.log('2. Client.country가 "우즈베키스탄"을 포함하는 수:', countryCount);

  // 3. Team 테이블 조회
  const { data: teams, error: teamErr } = await supabase
    .from('Team')
    .select('*');
  console.log('\n--- Team 목록 ---');
  console.log(teams);

  // 4. Manager 테이블 조회 (우즈베키스탄 관련)
  const { data: managers, error: managerErr } = await supabase
    .from('Manager')
    .select('*');
  console.log('\n--- Manager 목록 ---');
  console.log(managers?.map(m => ({ id: m.id, name: m.name, teamId: m.teamId })));

  // 5. 팀 ID 별 Client 수 측정
  const uzbekTeam = teams?.find(t => t.name && t.name.includes('우즈베키스탄'));
  if (uzbekTeam) {
    const { count: teamIdCount } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true })
      .eq('teamId', uzbekTeam.id);
    console.log(`\n3. Client.teamId가 ${uzbekTeam.id} (${uzbekTeam.name}) 인 수:`, teamIdCount);
  }

  // 6. 우즈베키스탄 매니저 ID별 Client 수 측정
  const uzbekManagers = managers?.filter(m => {
    if (!uzbekTeam) return false;
    return m.teamId === uzbekTeam.id;
  });

  if (uzbekManagers && uzbekManagers.length > 0) {
    const uzbekManagerIds = uzbekManagers.map(m => m.id);
    const { count: managerIdCount } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true })
      .in('managerId', uzbekManagerIds);
    console.log(`4. Client.managerId가 우즈베키스탄 매니저들인 수:`, managerIdCount);
  }

  // 7. Client에서 country와 teamId/managerId의 조합 분석 (전체 긁어서 카운트)
  let allUzbekClients = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('Client')
      .select('id, name, country, teamId, managerId')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error || !data || data.length === 0) break;
    
    const filtered = data.filter(c => {
      const isCountryUzbek = c.country && c.country.includes('우즈베키스탄');
      const isTeamUzbek = uzbekTeam && c.teamId === uzbekTeam.id;
      const isManagerUzbek = uzbekManagers && uzbekManagers.some(m => m.id === c.managerId);
      return isCountryUzbek || isTeamUzbek || isManagerUzbek;
    });

    allUzbekClients.push(...filtered);
    if (data.length < pageSize) break;
    page++;
  }

  console.log('\n--- 종합 매칭 통계 ---');
  console.log('country 또는 teamId 또는 managerId가 우즈베키스탄에 해당되는 총 고객 수:', allUzbekClients.length);

  const countryOnly = allUzbekClients.filter(c => c.country && c.country.includes('우즈베키스탄'));
  const teamOnly = allUzbekClients.filter(c => uzbekTeam && c.teamId === uzbekTeam.id);
  const managerOnly = allUzbekClients.filter(c => uzbekManagers && uzbekManagers.some(m => m.id === c.managerId));

  console.log('- country가 우즈베키스탄인 수:', countryOnly.length);
  console.log('- teamId가 우즈베키스탄 팀인 수:', teamOnly.length);
  console.log('- managerId가 우즈베키스탄 매니저인 수:', managerOnly.length);
}

checkCounts();
