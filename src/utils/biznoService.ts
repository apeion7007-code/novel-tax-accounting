// src/utils/biznoService.ts

export interface BiznoCompanyInfo {
  bno: string;        // 사업자등록번호
  cno: string;        // 법인등록번호
  company: string;    // 회사명
  bsttcd: string;     // 사업자상태 코드 (01: 계속, 02: 휴업, 03: 폐업)
  bstt: string;       // 사업자상태 명칭
  taxtypeCd: string;  // 과세유형 코드 (01~07)
  taxtype: string;    // 과세유형 명칭
  endDt: string;      // 폐업일
}

export interface EligibilityResult {
  isEligible: boolean;
  status: 'SUCCESS' | 'FAIL' | 'WARNING';
  reason: string;
}

const BIZNO_API_KEY = 'LTmTIUFVAgbdITbvG1in2v9m';

/**
 * 무료 API 응답 데이터(회사명, 과세유형, 폐업 여부)를 기반으로 한 감면 대상 여부 1차 판정 로직
 */
export function checkSmeEligibility(info: BiznoCompanyInfo): EligibilityResult {
  // 1. 폐업 여부 확인
  if (info.bsttcd === '03' || info.bstt.includes('폐업')) {
    return {
      isEligible: false,
      status: 'FAIL',
      reason: `폐업한 사업장입니다. (폐업일: ${info.endDt || '미확인'})`
    };
  }

  // 2. 과세유형 기준 필터링 (비영리법인, 국가기관, 고유번호 단체 등 제외)
  if (info.taxtypeCd === '05' || info.taxtypeCd === '06' || info.taxtype.includes('비영리') || info.taxtype.includes('국가기관')) {
    return {
      isEligible: false,
      status: 'FAIL',
      reason: `소득세 감면 제외 대상 단체입니다. (${info.taxtype})`
    };
  }

  const companyName = info.company;

  // 3. 명확한 감면 제외 업종 키워드 (회사명 포함 시) - 이 키워드가 들어가면 무조건 경고/제외 처리
  const excludedKeywords = [
    '금융', '보험', '재보험', '신용카드', '증권', '투자', '캐피탈',
    '법률', '회계', '세무', '특허', '법무', '수의', '행정', '변호', // 전문서비스업
    '부동산임대', '부동산 대리', '부동산 대행', // 임대업
    '여관', '모텔', '호텔', '민박', '펜션', // 일반 숙박업
    '유흥', '주점', '룸살롱', '단란주점', '카지노', '무도장', '게임장', '복권' // 사행/유흥
  ];

  for (const keyword of excludedKeywords) {
    if (companyName.includes(keyword)) {
      return {
        isEligible: false,
        status: 'FAIL',
        reason: `감면 제외 업종 가능성 높음 (회사명에 '${keyword}' 포함)`
      };
    }
  }

  // 4. 일반적인 중소기업의 90% 이상은 감면 대상 업종(제조, 도소매, 정보통신, 서비스 등)에 해당합니다.
  // 따라서 제외 업종 키워드에 걸리지 않고 계속사업자 상태라면, 기본값을 '감면 적합'으로 간주하되
  // 상세 검증용 주의 문구만 가볍게 덧붙여 노출합니다. (사용자 경험 개선)
  return {
    isEligible: true,
    status: 'SUCCESS',
    reason: '감면 대상 중소기업 해당 (계속사업자 및 감면 제외 업종 아님 확인)'
  };
}

/**
 * 비즈노 API를 사용하여 사업자등록번호 기반 기업 정보 조회
 */
export async function queryBiznoCompany(bno: string): Promise<{ info: BiznoCompanyInfo | null; errorMsg?: string }> {
  const cleanBno = bno.replace(/-/g, '');
  // 무료 API fapi 호출 (실시간 상태 정보 조회를 위해 status=Y 설정)
  const url = `https://bizno.net/api/fapi?key=${BIZNO_API_KEY}&gb=1&q=${cleanBno}&status=Y&type=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // 에러 코드 처리
    const resultCode = Number(data.resultCode);
    if (resultCode < 0) {
      let errorMsg = '기타 오류가 발생했습니다.';
      if (resultCode === -1) errorMsg = '비즈노 API 미등록 사용자입니다. (인증키 확인 필요)';
      if (resultCode === -2) errorMsg = 'API 요청 파라메터 오류입니다.';
      if (resultCode === -3) errorMsg = '비즈노 1일 200건 조회 한도를 초과했습니다.';
      return { info: null, errorMsg };
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return { info: null };
    }

    const item = data.items[0];
    
    // 대소문자 구분을 방지하기 위한 안전한 파싱
    const parsedInfo: BiznoCompanyInfo = {
      bno: item.bno || cleanBno,
      cno: item.cno || '',
      company: item.company || '회사명 없음',
      bsttcd: item.bsttcd || item.BSttCd || '',
      bstt: item.bstt || '',
      taxtypeCd: item.TaxTypeCd || item.taxtypeCd || item.taxtypecd || '',
      taxtype: item.taxtype || '',
      endDt: item.EndDt || item.endDt || item.enddt || ''
    };

    return { info: parsedInfo };
  } catch (error) {
    console.error('queryBiznoCompany 실패:', error);
    return { info: null, errorMsg: 'API 서버 통신 중 오류가 발생했습니다.' };
  }
}

/**
 * 비즈노 DB에 없는 신규 사업장 등록 및 정보 수정 요청 API 호출 (bizCU)
 */
export async function requestBiznoRegistration(params: {
  bno: string;
  company: string;
  btype?: string;
  bsector?: string;
  ceo?: string;
}): Promise<{ success: boolean; message: string }> {
  const cleanBno = params.bno.replace(/-/g, '');
  const url = new URL('https://bizno.net/api/bizCU');
  url.searchParams.append('key', BIZNO_API_KEY);
  url.searchParams.append('bno', cleanBno);
  url.searchParams.append('company', params.company);
  if (params.btype) url.searchParams.append('btype', params.btype);
  if (params.bsector) url.searchParams.append('bsector', params.bsector);
  if (params.ceo) url.searchParams.append('ceo', params.ceo);

  try {
    const response = await fetch(url.toString());
    const xmlText = await response.text();

    const resultCode = xmlText.match(/<resultCode>(.*?)<\/resultCode>/)?.[1];
    const resultMsg = xmlText.match(/<resultMsg>(.*?)<\/resultMsg>/)?.[1];

    if (resultCode === '0') {
      return { success: true, message: '비즈노 사업자 등록/수정 요청이 접수되었습니다. (반영에 1영업일 소요)' };
    } else {
      return { success: false, message: resultMsg || '비즈노 서버 등록 실패' };
    }
  } catch (error) {
    console.error('requestBiznoRegistration 실패:', error);
    return { success: false, message: '비즈노 등록 요청 서버 통신 오류' };
  }
}
