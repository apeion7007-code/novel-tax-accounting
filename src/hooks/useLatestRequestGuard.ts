import { useCallback, useRef } from 'react';

/**
 * 비동기 요청 경합(race condition) 방지용 가드 훅
 *
 * 사용 예:
 *   const { beginRequest, isLatestRequest } = useLatestRequestGuard();
 *   const reqId = beginRequest();
 *   await fetchSomething();
 *   if (!isLatestRequest(reqId)) return; // 그 사이 새 요청이 시작됐으면 결과 폐기
 *
 * 고객 A를 연 뒤 응답이 오기 전에 고객 B를 열었을 때,
 * 늦게 도착한 A의 응답이 B 화면을 덮어쓰는 것을 원천 차단합니다.
 */
export function useLatestRequestGuard() {
  const latestRequestIdRef = useRef(0);

  const beginRequest = useCallback((): number => {
    latestRequestIdRef.current += 1;
    return latestRequestIdRef.current;
  }, []);

  const isLatestRequest = useCallback((requestId: number): boolean => {
    return latestRequestIdRef.current === requestId;
  }, []);

  return { beginRequest, isLatestRequest };
}
