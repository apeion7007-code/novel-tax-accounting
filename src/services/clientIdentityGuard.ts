/**
 * 🛡️ [고객 신원 검증 및 덮어쓰기 원천 방어 서비스]
 * 
 * 고객 정보 저장 시, 이전 고객의 clientId가 폼에 남아있더라도
 * 다른 고객의 이름/등록번호로 기존 고객 레코드가 덮어씌워지는(Overwrite) 사고를 100% 원천 방어합니다.
 */

export interface IdentityCheckResult {
  /** 신원이 동일하거나 정상 수정 범위인지 여부 */
  isMatch: boolean;
  /** 완전히 다른 고객으로 판단되어 신규 등록(INSERT)으로 강제 전환해야 하는지 여부 */
  isDifferentPerson: boolean;
  /** 이름 또는 주민번호 중 하나만 변경된 부분 수정(오타 수정 등)인지 여부 */
  isPartialMismatch: boolean;
  /** 검증 사유 설명 */
  reason: string;
  /** DB에 저장되어 있던 원래 고객 정보 */
  original: {
    name: string;
    regNum: string;
  };
  /** 현재 저장 시도 중인 입력 정보 */
  incoming: {
    name: string;
    regNum: string;
  };
}

/**
 * 고객명 정규화 (앞뒤 공백 제거, 연속 공백 1칸 통일, 대문자 변환)
 */
export function normalizeCustomerName(name?: string | null): string {
  if (!name) return '';
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

/**
 * 등록번호 정규화 (숫자만 추출)
 */
export function normalizeRegNum(regNum?: string | null): string {
  if (!regNum) return '';
  return String(regNum).replace(/[^0-9]/g, '');
}

/**
 * DB의 기존 고객 정보와 현재 저장 시도하는 입력값의 신원 일치 여부를 정밀 판정
 */
export function checkClientIdentityMatch(
  existingClient: { name?: string | null; regNum?: string | null; serial?: number | null },
  inputName?: string | null,
  inputRegNum?: string | null
): IdentityCheckResult {
  const origName = normalizeCustomerName(existingClient?.name);
  const origReg = normalizeRegNum(existingClient?.regNum);

  const inName = normalizeCustomerName(inputName);
  const inReg = normalizeRegNum(inputRegNum);

  const result: IdentityCheckResult = {
    isMatch: true,
    isDifferentPerson: false,
    isPartialMismatch: false,
    reason: '신원 일치',
    original: { name: origName, regNum: origReg },
    incoming: { name: inName, regNum: inReg }
  };

  // DB에 기존 이름이나 주민번호가 없는 신규/초기 레코드인 경우 정상 일치로 처리
  if (!origName && !origReg) {
    return result;
  }

  const nameMatches = !origName || !inName || origName === inName;
  const regMatches = !origReg || !inReg || origReg === inReg;

  // 1. 이름과 등록번호가 둘 다 완전히 다른 경우 ➔ 100% 다른 고객 덮어쓰기 시도!
  if (origName && inName && origName !== inName && origReg && inReg && origReg !== inReg) {
    result.isMatch = false;
    result.isDifferentPerson = true;
    result.reason = `기존 고객(${existingClient.serial ? existingClient.serial + '번 ' : ''}${origName} / ${origReg})과 입력된 고객(${inName} / ${inReg})의 이름 및 등록번호가 완전히 다릅니다.`;
    return result;
  }

  // 2. 이름 또는 등록번호 중 하나만 다른 경우 (단순 오타 수정 등)
  if (!nameMatches || !regMatches) {
    result.isMatch = false;
    result.isPartialMismatch = true;
    result.reason = `고객 신원 정보의 일부가 변경되었습니다: ${!nameMatches ? `이름(${origName} ➔ ${inName})` : ''} ${!regMatches ? `등록번호(${origReg} ➔ ${inReg})` : ''}`;
    return result;
  }

  return result;
}
