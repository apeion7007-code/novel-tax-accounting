import { supabase, updateClientManagerInSupabase } from '../utils/supabaseClient';
import { EXCLUDED_REFUND_STATUSES, normalizeRefundStatus } from '../constants/refundStatus';

export type VisibilityReasonType = 
  | 'UNASSIGNED'      // 담당자 미지정 또는 관리자 배정
  | 'OTHER_MANAGER'   // 다른 매니저 담당
  | 'COMPLETED_TAB'   // 완료/제외 상태 (기본 '진행중' 탭에서 숨겨짐)
  | 'VISIBLE';        // 본인 담당 및 진행중

export interface GlobalSearchCustomerResult {
  id: string;                    // uuid
  serial: number;                // serial number
  name: string;
  regNum: string;
  phone: string;
  company: string;
  country: string;
  visa: string;
  paybackProgress: string;
  managerId: string | null;
  managerName: string;
  teamId: number | null;
  teamName: string;
  createdAt: string;
  visibilityReason: VisibilityReasonType;
  visibilityMessage: string;
}

/**
 * 슈퍼베이스 Client 테이블 전체를 대상으로 이름, 연락처, 외국인등록번호/생년월일, 일련번호 검색
 */
export async function searchCustomersGlobally(
  keyword: string,
  currentManagerId?: string,
  currentManagerName?: string,
  isSuperAdmin: boolean = false
): Promise<{ success: boolean; data: GlobalSearchCustomerResult[]; error?: string }> {
  const cleanKeyword = keyword.trim();
  if (!cleanKeyword) {
    return { success: true, data: [] };
  }

  try {
    // 1. 매니저 및 팀 매핑 데이터 로드 (최신화)
    const [{ data: dbManagers }, { data: dbTeams }] = await Promise.all([
      supabase.from('Manager').select('id, name, teamId'),
      supabase.from('Team').select('id, name')
    ]);

    const mgrMap = new Map<string, { name: string; teamId: number | null }>();
    (dbManagers || []).forEach(m => {
      mgrMap.set(m.id, { name: m.name, teamId: m.teamId });
    });

    const teamMap = new Map<number, string>();
    (dbTeams || []).forEach(t => {
      teamMap.set(t.id, t.name);
    });

    // 2. 검색 대상 필터 구성 (숫자 전용 여부 확인)
    const digitsOnly = cleanKeyword.replace(/\D/g, '');
    const isNumeric = /^\d+$/.test(cleanKeyword);

    // Supabase or 쿼리 생성
    // 이름 매칭, 전화번호 매칭, 주민/외국인번호 매칭
    const orConditions: string[] = [
      `name.ilike.%${cleanKeyword}%`,
      `phone.ilike.%${cleanKeyword}%`,
      `regNum.ilike.%${cleanKeyword}%`
    ];

    if (isNumeric) {
      orConditions.push(`serial.eq.${parseInt(cleanKeyword, 10)}`);
    }

    if (digitsOnly.length >= 4 && digitsOnly !== cleanKeyword) {
      orConditions.push(`phone.ilike.%${digitsOnly}%`);
      orConditions.push(`regNum.ilike.%${digitsOnly}%`);
    }

    const { data: clientRows, error: searchErr } = await supabase
      .from('Client')
      .select('*')
      .or(orConditions.join(','))
      .limit(50);

    if (searchErr) {
      console.error('Global search error:', searchErr);
      return { success: false, data: [], error: searchErr.message };
    }

    if (!clientRows || clientRows.length === 0) {
      return { success: true, data: [] };
    }

    // 3. 가시성 사유 판정 (Visibility Reason Analysis)
    const results: GlobalSearchCustomerResult[] = clientRows.map((row: any) => {
      const resolvedMgr = row.managerId ? mgrMap.get(row.managerId) : null;
      const assignedManagerName = resolvedMgr?.name || (row.managerId ? '매니저' : '관리자');
      const resolvedTeamId = row.teamId || resolvedMgr?.teamId || null;
      const teamName = resolvedTeamId ? (teamMap.get(resolvedTeamId) || '') : '';

      const normalizedStatus = normalizeRefundStatus(row.paybackProgress || '◎경정상담중');
      const isCompletedOrExcluded = EXCLUDED_REFUND_STATUSES.includes(normalizedStatus);

      let visibilityReason: VisibilityReasonType = 'VISIBLE';
      let visibilityMessage = '내 담당 목록에 표시되는 고객입니다.';

      if (isSuperAdmin) {
        // 최고관리자의 경우
        if (isCompletedOrExcluded) {
          visibilityReason = 'COMPLETED_TAB';
          visibilityMessage = `현재 [${normalizedStatus}] 상태로 완료/종결 탭에 보관되어 있습니다.`;
        } else {
          visibilityReason = 'VISIBLE';
          visibilityMessage = `진행중 목록에 정상 표시됩니다. (담당: ${assignedManagerName})`;
        }
      } else {
        // 일반 매니저 기준
        const isMyClient = Boolean(
          (currentManagerId && row.managerId && row.managerId === currentManagerId) ||
          (currentManagerName && assignedManagerName && assignedManagerName.trim() === currentManagerName.trim())
        );

        if (!row.managerId || assignedManagerName === '관리자') {
          visibilityReason = 'UNASSIGNED';
          visibilityMessage = '⚠️ 담당자가 [관리자(미배정)] 상태여서 매니저 목록에 나타나지 않았습니다.';
        } else if (!isMyClient) {
          visibilityReason = 'OTHER_MANAGER';
          visibilityMessage = `⚠️ 타 매니저 [${assignedManagerName}] 담당으로 배정되어 있어 보이지 않았습니다.`;
        } else if (isCompletedOrExcluded) {
          visibilityReason = 'COMPLETED_TAB';
          visibilityMessage = `ℹ️ [${normalizedStatus}] 상태로 기본 '진행중' 탭 대신 '완료' 탭에 보관 중입니다.`;
        } else {
          visibilityReason = 'VISIBLE';
          visibilityMessage = '현재 본인의 진행중 고객 목록에 정상 표시되어 있습니다.';
        }
      }

      return {
        id: row.id,
        serial: row.serial,
        name: row.name || '미상',
        regNum: row.regNum || '-',
        phone: row.phone || '-',
        company: row.company || '-',
        country: row.country || teamName.replace(/팀$/, '') || '베트남',
        visa: row.visa || 'E9',
        paybackProgress: normalizedStatus,
        managerId: row.managerId || null,
        managerName: assignedManagerName,
        teamId: resolvedTeamId,
        teamName,
        createdAt: row.createdAt ? new Date(row.createdAt).toLocaleDateString('ko-KR') : '-',
        visibilityReason,
        visibilityMessage
      };
    });

    return { success: true, data: results };
  } catch (err: any) {
    console.error('searchCustomersGlobally exception:', err);
    return { success: false, data: [], error: err.message || '검색 중 오류가 발생했습니다.' };
  }
}

/**
 * 고객을 현재 로그인한 매니저의 담당으로 안전하게 재배정
 */
export async function claimCustomerToManager(
  serial: number,
  managerName: string,
  managerCountry?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const targetCountry = managerCountry || '베트남';
    const res = await updateClientManagerInSupabase(serial, managerName, targetCountry);
    return res;
  } catch (e: any) {
    return { success: false, error: e.message || '담당자 배정 중 오류 발생' };
  }
}
