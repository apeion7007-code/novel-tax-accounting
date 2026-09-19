import { supabase } from '../utils/supabaseClient';

export interface SuccessionParams {
  managerId: string;
  newName: string;
  newEmail: string;
  newPassword?: string;
  newPhone?: string;
  newTeamId?: number;
}

export interface ManagerStats {
  clientCount: number;
  memoCount: number;
}

/**
 * 특정 매니저에게 배정된 고객 수 및 작성 메모 수 조회
 */
export async function fetchManagerStats(managerId: string): Promise<ManagerStats> {
  try {
    const { count: clientCount } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true })
      .eq('managerId', managerId);

    const { count: memoCount } = await supabase
      .from('ConsultMemo')
      .select('*', { count: 'exact', head: true })
      .eq('managerId', managerId);

    return {
      clientCount: clientCount || 0,
      memoCount: memoCount || 0
    };
  } catch (err) {
    console.error('fetchManagerStats error:', err);
    return { clientCount: 0, memoCount: 0 };
  }
}

/**
 * 매니저 접속 차단(비활성화) 또는 승인(활성화) 토글
 * @param managerId 매니저 고유 ID (UUID)
 * @param block true이면 차단(isConfirmed=false), false이면 승인(isConfirmed=true)
 */
export async function toggleManagerBlockStatus(managerId: string, block: boolean) {
  try {
    const { error } = await supabase
      .from('Manager')
      .update({ isConfirmed: !block })
      .eq('id', managerId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('toggleManagerBlockStatus error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 매니저 계정 승계 (후임자 정보/비밀번호 변경 및 데이터 100% 인계)
 */
export async function updateManagerSuccession(params: SuccessionParams) {
  try {
    // 1. Supabase RPC 함수를 호출하여 auth.users 및 Manager 테이블 동시 갱신
    const { data, error } = await supabase.rpc('admin_update_manager_account', {
      target_manager_id: params.managerId,
      new_name: params.newName.trim(),
      new_email: params.newEmail.trim(),
      new_password: params.newPassword ? params.newPassword.trim() : null,
      new_phone: params.newPhone ? params.newPhone.trim() : null,
      new_team_id: params.newTeamId || null
    });

    if (error) {
      // RPC 미설치 시 기본 Manager 테이블 정보 갱신 fallback
      console.warn('RPC update failed, falling back to direct table update:', error.message);
      const updateData: any = {
        name: params.newName.trim(),
        email: params.newEmail.trim(),
        isConfirmed: true
      };
      if (params.newPhone !== undefined) updateData.phone = params.newPhone.trim();
      if (params.newTeamId !== undefined) updateData.teamId = params.newTeamId;

      const { error: dbErr } = await supabase
        .from('Manager')
        .update(updateData)
        .eq('id', params.managerId);

      if (dbErr) throw dbErr;
      return { 
        success: true, 
        warning: '매니저 정보는 업데이트되었으나, 비밀번호 변경을 위해서는 신규 슈퍼베이스 SQL Editor에서 RPC 함수 등록이 필요합니다.' 
      };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('updateManagerSuccession error:', err);
    return { success: false, error: err.message };
  }
}
