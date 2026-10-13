/**
 * 노벨 세무 회계 - 환급처리상태 단일 표준 상수 및 헬퍼 모듈
 * 고객등록 관리 화면 및 대시보드 화면이 100% 동일한 상태값과 기호를 공유하도록 정의합니다.
 */

export const REFUND_STATUSES = [
  '대기',
  '◎경정상담중',
  '◎자격안됨',
  '◎자격안됨(확인완료)',
  '◎고객취소',
  '▶홈택스가입불가',
  '간편인증서류가입요청',
  '◆간편인증서류완료',
  '◆녹취계약요청',
  '◆녹취계약완료',
  '※감면명세서요청중',
  '◇경청청구요청',
  '노벨경정청구중',
  '세로경정청구중',
  '♥경정청구완료',
  '▲경정청구반려',
  '▲경정청구기각',
  '♡수수료요청',
  '♡국세수수료수납완료',
  '◆지방세수수료수납완료',
  '◆수수료 연체'
] as const;

export type RefundStatus = typeof REFUND_STATUSES[number];

/**
 * 대시보드 진행중(inProgress) 탭 및 미환급 알림 계산 시 제외되는 상태 목록
 * 완료건, 자격미달, 취소, 가입불가, 반려/기각 건을 안전하게 제외합니다.
 */
export const EXCLUDED_REFUND_STATUSES: readonly string[] = [
  '♥경정청구완료',
  '♡국세수수료수납완료',
  '◆지방세수수료수납완료',
  '♠지방세수수료수납완료', // 기존 레거시 DB 호환
  '◎자격안됨',
  '자격안됨', // 기존 레거시 DB 호환
  '◎자격안됨(확인완료)',
  '◎고객취소',
  '고객취소', // 기존 레거시 DB 호환
  '▶홈택스가입불가',
  '◆홈택스가입불가', // 기존 레거시 DB 호환
  '홈택스가입불가', // 기존 레거시 DB 호환
  '▲경정청구반려',
  '경정청구반려', // 기존 레거시 DB 호환
  '▲경정청구기각'
];

/**
 * 수수료 완료 건 판별 헬퍼
 */
export const isFeeCompletedStatus = (status?: string | null): boolean => {
  if (!status) return false;
  return (
    status === '♡국세수수료수납완료' ||
    status === '◆지방세수수료수납완료' ||
    status === '♠지방세수수료수납완료'
  );
};

/**
 * DB의 구버전 상태값 및 기호 누락 텍스트를 21개 표준 상태값으로 정규화
 */
export const normalizeRefundStatus = (status?: string | null): string => {
  if (!status) return '대기';
  const trimmed = status.trim();

  switch (trimmed) {
    case '대기':
    case '◎대기':
      return '대기';
    case '경정상담중':
    case '◎경정상담중':
      return '◎경정상담중';
    case '자격안됨':
    case '◎자격안됨':
      return '◎자격안됨';
    case '◎자격안됨(확인완료)':
    case '자격안됨(확인완료)':
      return '◎자격안됨(확인완료)';
    case '고객취소':
    case '◎고객취소':
      return '◎고객취소';
    case '홈택스가입불가':
    case '◆홈택스가입불가':
    case '▶홈택스가입불가':
      return '▶홈택스가입불가';
    case '간편인증서류가입요청':
    case '◆간편인증서류가입요청':
      return '간편인증서류가입요청';
    case '간편인증서류완료':
    case '◆간편인증서류완료':
      return '◆간편인증서류완료';
    case '녹취계약요청':
    case '◆녹취계약요청':
      return '◆녹취계약요청';
    case '녹취계약완료':
    case '◆녹취계약완료':
      return '◆녹취계약완료';
    case '감면명세서요청중':
    case '※감면명세서요청중':
      return '※감면명세서요청중';
    case '경청청구요청':
    case '◇경청청구요청':
    case '경정청구요청':
    case '◇경정청구요청':
      return '◇경청청구요청';
    case '노벨경정청구중':
    case '◐노벨경정청구중':
      return '노벨경정청구중';
    case '세로경정청구중':
    case '◑세로경정청구중':
      return '세로경정청구중';
    case '경정청구완료':
    case '♥경정청구완료':
      return '♥경정청구완료';
    case '경정청구반려':
    case '▲경정청구반려':
      return '▲경정청구반려';
    case '경정청구기각':
    case '▲경정청구기각':
      return '▲경정청구기각';
    case '수수료요청':
    case '♡수수료요청':
      return '♡수수료요청';
    case '국세수수료수납완료':
    case '♡국세수수료수납완료':
      return '♡국세수수료수납완료';
    case '지방세수수료수납완료':
    case '◆지방세수수료수납완료':
    case '♠지방세수수료수납완료':
      return '◆지방세수수료수납완료';
    case '수수료연체':
    case '수수료 연체':
    case '◆수수료연체':
    case '◆수수료 연체':
      return '◆수수료 연체';
    default:
      return trimmed;
  }
};
