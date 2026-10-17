import { supabase } from '../utils/supabaseClient';

/**
 * Option 1 권한 검사 함수:
 * - 최고 관리자(isSuperAdmin): 모든 메모 편집/삭제 가능
 * - 일반 매니저(currentManager): 본인이 직접 작성한 메모만 편집/삭제 가능
 * 
 * 작성자 일치 검증 기준:
 * 1. memo.managerId === currentManager.id (UUID 매칭)
 * 2. memo.managerId === currentManager.name (이름 직접 저장된 레코드 호환)
 * 3. dbManagers 목록에서 memo.managerId로 찾은 매니저의 id 또는 name 일치
 */
export const canManageConsultMemo = (
  memo: any,
  currentManager: any,
  isSuperAdmin: boolean = false,
  dbManagers: any[] = []
): boolean => {
  if (isSuperAdmin) return true;
  if (!currentManager || !memo) return false;

  const memoManagerId = String(memo.managerId || '').trim();
  const currentId = String(currentManager.id || '').trim();
  const currentName = String(currentManager.name || '').trim();

  // 1. 매니저 UUID 직접 일치
  if (currentId && memoManagerId === currentId) return true;

  // 2. 매니저 이름 직접 일치
  if (currentName && memoManagerId.toLowerCase() === currentName.toLowerCase()) return true;

  // 3. dbManagers 목록 조회를 통한 식별
  if (dbManagers && dbManagers.length > 0 && (currentId || currentName)) {
    const foundManager = dbManagers.find(m => String(m.id).trim() === memoManagerId);
    if (foundManager) {
      if (currentId && String(foundManager.id).trim() === currentId) return true;
      if (currentName && String(foundManager.name).trim().toLowerCase() === currentName.toLowerCase()) return true;
    }
  }

  return false;
};

/**
 * 상담 메모 내용 수정 (Supabase ConsultMemo 테이블)
 */
export const updateConsultMemo = async (memoId: number, newContent: string) => {
  const { data, error } = await supabase
    .from('ConsultMemo')
    .update({ content: newContent })
    .eq('id', memoId)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

/**
 * 상담 메모 삭제 (Supabase ConsultMemo 테이블)
 */
export const deleteConsultMemo = async (memoId: number) => {
  const { error } = await supabase
    .from('ConsultMemo')
    .delete()
    .eq('id', memoId);

  if (error) {
    throw error;
  }
};
