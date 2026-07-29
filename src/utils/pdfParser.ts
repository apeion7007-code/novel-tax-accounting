// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface ParsedPdfResult {
  year: string;
  name: string;
  foreignerNumber: string;
  workPlace: string;
  businessNumber: string;
  workPeriod: string;
  salaryTotal: string;
  taxBase: string;
  decisionTax: string;
  childReduction: string;
  childDeduction: string;
  determinedIncomeTax: string;
  determinedLocalTax: string;
  isNonRefundable?: boolean;
  incomeTypeCode?: string;
  taxReductionApplyDateStart?: string;
  taxReductionApplyDateEnd?: string;
}

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
};

export const parsePdfText = (text: string, targetYear?: string): ParsedPdfResult => {
  const cleanText = text.replace(/\s+/g, ' ');

  // Detect and parse "중소기업 취업자 소득세 감면 대상 명세서" PDF
  if (cleanText.includes('중소기업 취업자 소득세 감면 대상 명세서') || cleanText.includes('중소기업취업자소득세감면대상명세서')) {
    let parsedName = '';
    let parsedForeignerNumber = '';
    let parsedWorkPeriod = ''; // Employment Date
    let parsedTaxReductionApplyDateStart = '';
    let parsedTaxReductionApplyDateEnd = '';
    let parsedWorkPlace = '';
    let parsedBusinessNumber = '';

    // Match row: Name, RRN, Employment Date, Type, Age, Military, Deducted Age, Start Date, End Date
    const rowMatch = cleanText.match(/([가-힣A-Za-z0-9*\s]{2,20})\s+(\d{6}-[\d*]{7})\s+(\d{4}-\d{2}-\d{2})\s+([가-힣]{2,6})\s*(\d*)\s*([-\d가-힣]*)\s*([-\d가-힣]*)\s*(\d{4}-\d{2}-\d{2})\s*(\d{4}-\d{2}-\d{2})/);
    
    if (rowMatch) {
      parsedName = rowMatch[1].trim();
      parsedForeignerNumber = rowMatch[2].trim();
      parsedWorkPeriod = rowMatch[3].trim();
      parsedTaxReductionApplyDateStart = rowMatch[8].trim();
      parsedTaxReductionApplyDateEnd = rowMatch[9].trim();
    } else {
      const dates = cleanText.match(/\d{4}-\d{2}-\d{2}/g) || [];
      if (dates.length >= 3) {
        parsedWorkPeriod = dates[0] || '';
        parsedTaxReductionApplyDateStart = dates[1] || '';
        parsedTaxReductionApplyDateEnd = dates[2] || '';
      }
      const rrnMatch = cleanText.replace(/\s/g, '').match(/(\d{6}-[\d*]{7})/);
      if (rrnMatch) {
        parsedForeignerNumber = rrnMatch[1];
      }
      const nameMatch = cleanText.match(/(?:성\s*명|소\s*득\s*자\s*성\s*명)\s*[:：]?\s*([가-힣A-Za-z0-9*\s]+?)(?=\s*주민|등록번호|$)/);
      if (nameMatch) {
        parsedName = nameMatch[1].trim();
      }
    }

    const compMatch = cleanText.match(/(?:상\s*호|법인명)\s*[:：]\s*([가-힣A-Za-z0-9인주식회사㈜()\s]+?)(?=\s*사업자|사업자등록번호|$)/);
    if (compMatch) {
      parsedWorkPlace = compMatch[1].trim();
    }
    const bizMatch = cleanText.replace(/\s/g, '').match(/(?:사업자등록번호)[:：](\d{3}-\d{2}-\d{5})/);
    if (bizMatch) {
      parsedBusinessNumber = bizMatch[1];
    }

    return {
      year: parsedWorkPeriod ? parsedWorkPeriod.substring(0, 4) : (targetYear || ''),
      name: parsedName,
      foreignerNumber: parsedForeignerNumber,
      workPlace: parsedWorkPlace,
      businessNumber: parsedBusinessNumber,
      workPeriod: parsedWorkPeriod,
      salaryTotal: '0',
      taxBase: '0',
      decisionTax: '0',
      childReduction: '0',
      childDeduction: '0',
      determinedIncomeTax: '0',
      determinedLocalTax: '0',
      taxReductionApplyDateStart: parsedTaxReductionApplyDateStart,
      taxReductionApplyDateEnd: parsedTaxReductionApplyDateEnd
    };
  }

  // Identify income type
  const isBusinessIncome = cleanText.includes('사업소득');
  const isOtherIncome = cleanText.includes('기타소득');

  // 1. 근무기간 및 귀속연도
  let year = '';
  let workPeriod = '';
  const periodMatch = cleanText.match(/(?:근\s*무\s*기\s*간|근무기간)\s*(\d{4}[-./]\d{2}[-./]\d{2})\s*~\s*(\d{4}[-./]\d{2}[-./]\d{2}|\d{2}[-./]\d{2})/);
  if (periodMatch) {
    const start = periodMatch[1].replace(/[./]/g, '-');
    let end = periodMatch[2].replace(/[./]/g, '-');
    if (end.length === 5) { // MM-DD format
      const startYear = start.substring(0, 4);
      end = `${startYear}-${end}`;
    }
    workPeriod = `${start} ~ ${end}`;
    year = start.substring(0, 4);
  }

  // Fallback for year from PDF text
  if (!year) {
    const yearMatch = cleanText.match(/(202\d)\s*(?:년)?\s*귀\s*속/i) || cleanText.match(/귀\s*속\s*(?:연\s*도)?\s*(202\d)/i) || cleanText.match(/(202\d)\s*년도/);
    if (yearMatch) {
      year = yearMatch[1];
    }
  }

  // Fallback to targetYear only if PDF text does not specify year
  if (!year && targetYear) {
    year = targetYear;
  }

  // 2. 소득자 정보 (성명, 주민등록번호)
  let name = '';
  
  // Find all indices of "소득자" or "소 득 자"
  const earnerIndices: number[] = [];
  let idx = cleanText.indexOf('소득자');
  while (idx !== -1) {
    earnerIndices.push(idx);
    idx = cleanText.indexOf('소득자', idx + 1);
  }
  let idxSp = cleanText.indexOf('소 득 자');
  while (idxSp !== -1) {
    earnerIndices.push(idxSp);
    idxSp = cleanText.indexOf('소 득 자', idxSp + 1);
  }
  earnerIndices.sort((a, b) => a - b);

  // Search backwards to find the taxpayer section (not withholder section)
  for (let i = earnerIndices.length - 1; i >= 0; i--) {
    const start = earnerIndices[i];
    const sub = cleanText.substring(start);
    const nameMatch = sub.match(/(?:성\s*명|소\s*득\s*자\s*성\s*명)\s*[:：]?\s*([가-힣A-Za-z0-9*\s]+?)(?=\s*[^가-힣A-Za-z0-9*\s]|$)/);
    if (nameMatch) {
      const matchedName = nameMatch[1].trim();
      const intermediateText = sub.substring(0, sub.indexOf(nameMatch[0]));
      // The taxpayer section name should not have "징수" or "징 수" in between "소득자" and the name
      if (!intermediateText.includes('징수') && !intermediateText.includes('징 수')) {
        name = matchedName;
        break;
      }
    }
  }

  // If name not found, fallback to standard matching
  if (!name) {
    const nameMatch = cleanText.match(/(?:성\s*명|소\s*득\s*자\s*성\s*명)\s*[:：]?\s*([가-힣A-Za-z0-9*\s]+?)(?=\s*[^가-힣A-Za-z0-9*\s]|$)/i);
    if (nameMatch) {
      name = nameMatch[1].trim();
    }
  }
  
  let foreignerNumber = '';
  // Support asterisks in RRN: 960126-*******
  const rrnMatch = cleanText.replace(/\s/g, '').match(/(\d{6}-[\d*]{7})/);
  if (rrnMatch) {
    foreignerNumber = rrnMatch[1];
  }

  // 3. 근무처 정보 (회사명, 사업자등록번호)
  let workPlace = '';
  const compMatch = cleanText.match(/(?:법\s*인\s*명\s*\(상\s*호\)|상\s*호|징\s*수\s*의\s*무\s*자\s*상\s*호)\s*([가-힣A-Za-z0-9인주식회사㈜()\s]+?)(?=\s*[^가-힣A-Za-z0-9인주식회사㈜()\s]|$)/i);
  if (compMatch) {
    workPlace = compMatch[1].trim();
  }
  
  let businessNumber = '';
  const businessMatches = cleanText.replace(/\s/g, '').match(/(\d{3}-\d{2}-\d{5})/g);
  if (businessMatches) {
    businessNumber = businessMatches[0];
  }

  // Default initial values for wage/salary income
  let salaryTotal = '0';
  let taxBase = '0';
  let decisionTax = '0';
  let childReduction = '0';
  let childDeduction = '0';
  let determinedIncomeTax = '0';
  let determinedLocalTax = '0';

  // 4. Extract data row numbers for Business Income / Other Income
  const rowMatch = cleanText.match(/(202\d)\s+(202\d)\s+(.*)/);
  if (rowMatch && (isBusinessIncome || isOtherIncome)) {
    const numbersSub = rowMatch[0];
    const numRegex = /(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)/g;
    const numbers: string[] = [];
    let numMatch;
    // Extract up to 15 numbers
    while ((numMatch = numRegex.exec(numbersSub)) !== null && numbers.length < 15) {
      numbers.push(numMatch[0].replace(/,/g, ''));
    }

    if (isOtherIncome && numbers.length >= 9) {
      // 기타소득 format mapping
      salaryTotal = numbers[2] || '0';
      taxBase = numbers[5] || '0'; // 소득금액
      determinedIncomeTax = numbers[7] || '0'; // 소득세
      determinedLocalTax = numbers[8] || '0'; // 지방소득세
      decisionTax = taxBase; // fallback
    } else if (isBusinessIncome && numbers.length >= 6) {
      // 사업소득 format mapping
      salaryTotal = numbers[2] || '0';
      determinedIncomeTax = numbers[4] || '0'; // 소득세
      determinedLocalTax = numbers[5] || '0'; // 지방소득세
      taxBase = salaryTotal; // For business income, use total payment as base or default
      decisionTax = taxBase;
    }
  }

  // 3.3% 프리랜서 사업소득 데이터 Fallback 분석 (줄 정규식이 실패한 경우)
  if (isBusinessIncome && salaryTotal === '0') {
    // 1) 지급총액 / 연간합계 / 지급액 키워드 바로 뒤의 숫자 획득
    const paymentMatch = cleanText.match(/(?:지\s*급\s*총\s*액|연\s*간\s*합\s*계|지\s*급\s*액)\s*(\d{1,3}(?:,\d{3})+|[1-9]\d{2,15})/);
    if (paymentMatch) {
      salaryTotal = paymentMatch[1].replace(/,/g, '');
      taxBase = salaryTotal;
      decisionTax = salaryTotal;
    }
    
    // 2) 소득세 및 지방소득세 키워드 뒤의 숫자 획득
    const incomeTaxMatch = cleanText.match(/(?:소\s*득\s*세)\s*(\d{1,3}(?:,\d{3})+|[1-9]\d{2,15})/);
    if (incomeTaxMatch) {
      determinedIncomeTax = incomeTaxMatch[1].replace(/,/g, '');
    }
    
    const localTaxMatch = cleanText.match(/(?:지\s*방\s*소\s*득\s*세|지방소득세)\s*(\d{1,3}(?:,\d{3})+|[1-9]\d{2,15})/);
    if (localTaxMatch) {
      determinedLocalTax = localTaxMatch[1].replace(/,/g, '');
    } else if (determinedIncomeTax !== '0') {
      determinedLocalTax = String(Math.round(Number(determinedIncomeTax) * 0.1));
    }
  }

  // Fallback to old parsing logic for salary and taxes if we didn't extract them via table rows
  if (salaryTotal === '0' && determinedIncomeTax === '0') {
    const getNumbersAfterKeyword = (keywordRegex: RegExp, count: number): string[] | null => {
      const match = cleanText.match(keywordRegex);
      if (!match) return null;
      const startIndex = match.index! + match[0].length;
      const sub = cleanText.substring(startIndex, startIndex + 300);
      const numbers: string[] = [];
      const numRegex = /(\d{1,3}(?:,\d{3})+|[1-9]\d{2,15}|0)/g;
      let numMatch;
      while ((numMatch = numRegex.exec(sub)) !== null && numbers.length < count) {
        numbers.push(numMatch[0].replace(/,/g, ''));
      }
      return numbers.length > 0 ? numbers : null;
    };

    const salaryNums = getNumbersAfterKeyword(/(?:⑯|16)\s*계/i, 1)
                    || getNumbersAfterKeyword(/(?:⑬|13)\s*급\s*여/i, 1)
                    || getNumbersAfterKeyword(/21\s*총\s*급\s*여/i, 1)
                    || getNumbersAfterKeyword(/총\s*급\s*여/i, 1);
    salaryTotal = salaryNums ? salaryNums[0] : '0';

    const taxBaseNums = getNumbersAfterKeyword(/49\s*(?:종\s*합\s*소\s*득\s*)?과\s*세\s*표\s*준/i, 1)
                      || getNumbersAfterKeyword(/과\s*세\s*표\s*준/i, 1)
                      || getNumbersAfterKeyword(/(?:㉖|26|23)\s*근\s*로\s*소\s*득\s*금\s*액/i, 1);
    taxBase = taxBaseNums ? taxBaseNums[0] : '0';

    const calcTaxNums = getNumbersAfterKeyword(/50\s*산\s*출\s*세\s*액/i, 1)
                      || getNumbersAfterKeyword(/산\s*출\s*세\s*액/i, 1)
                      || getNumbersAfterKeyword(/(?:㉛|31)\s*산\s*출\s*세\s*액/i, 1);
    decisionTax = calcTaxNums ? calcTaxNums[0] : '0';

    const childReductionNums = getNumbersAfterKeyword(/53\s*(?:「\s*조\s*세\s*특\s*례\s*제\s*한\s*법\s*」\s*)?제\s*3\s*0\s*조/i, 1)
                            || getNumbersAfterKeyword(/조\s*세\s*특\s*례\s*제\s*한\s*법\s*제\s*3\s*0\s*조/i, 1)
                            || getNumbersAfterKeyword(/중\s*소\s*기\s*업\s*(?:취\s*업\s*자)?\s*(?:소\s*득\s*세)?\s*감\s*면/i, 1);
    childReduction = childReductionNums ? childReductionNums[0] : '0';

    const childDeductionNums = getNumbersAfterKeyword(/56\s*근\s*로\s*소\s*득/i, 1)
                            || getNumbersAfterKeyword(/근\s*로\s*소\s*득\s*세\s*액\s*공\s*제/i, 1);
    childDeduction = childDeductionNums ? childDeductionNums[0] : '0';


    // 결정세액에서 소득세와 지방소득세를 정규식 및 순서 분석으로 직접 추출
    let parsedIncomeTax = '0';
    let parsedLocalTax = '0';

    // 1) "지방소득세" 키워드 바로 뒤에 오는 숫자를 명시적 정규식으로 직접 획득 시도
    const explicitLocalTaxMatch = cleanText.match(/(?:지\s*방\s*소\s*득\s*세|지방소득세)\s*(\d{1,3}(?:,\d{3})+|[1-9]\d{2,15})/);
    if (explicitLocalTaxMatch) {
      parsedLocalTax = explicitLocalTaxMatch[1].replace(/,/g, '');
    }

    // 2) 결정세액 라인 번호(72번 또는 73번) 기준 파싱 시도
    const detTaxNums = getNumbersAfterKeyword(/73\s*결\s*정\s*세\s*액/i, 2)
                    || getNumbersAfterKeyword(/72\s*결\s*정\s*세\s*액/i, 2)
                    || getNumbersAfterKeyword(/결\s*정\s*세\s*액/i, 2);
    
    if (detTaxNums) {
      parsedIncomeTax = detTaxNums[0] || '0';
      // 명시적으로 지방소득세를 긁어오지 못했거나 깨진 경우, 두 번째 매칭된 숫자를 숫자 검증 후 사용
      if (parsedLocalTax === '0' && detTaxNums[1]) {
        const cleanedSecNum = detTaxNums[1].replace(/[^0-9]/g, '');
        if (cleanedSecNum && !isNaN(Number(cleanedSecNum))) {
          parsedLocalTax = cleanedSecNum;
        }
      }
    }

    determinedIncomeTax = parsedIncomeTax;
    
    // 최종 검증: 지방소득세가 아직도 0이거나 문자로 깨져있다면 국세 결정세액의 10%로 자동 보정하여 누락 방지
    if (parsedLocalTax === '0' || isNaN(Number(parsedLocalTax)) || parsedLocalTax === '') {
      determinedLocalTax = String(Math.round(Number(determinedIncomeTax) * 0.1));
    } else {
      determinedLocalTax = parsedLocalTax;
    }
  }

  // Check for code checkbox selection
  let incomeTypeCode = '3.3%';
  let isNonRefundable = false;

  const codeRegex = /(?:[√vVxXoO✔☑☒■]|\[[vVxXoO]\])\s*(60|61|62|63|64|65|68|69|71|72|73|74|75|76|77|78|79|80)/;
  const codeRegexReverse = /(60|61|62|63|64|65|68|69|71|72|73|74|75|76|77|78|79|80)\s*(?:[√vVxXoO✔☑☒■]|\[[vVxXoO]\])/;
  
  const m1 = cleanText.match(codeRegex);
  const m2 = cleanText.match(codeRegexReverse);
  
  if (m1) {
    incomeTypeCode = m1[1];
  } else if (m2) {
    incomeTypeCode = m2[1];
  } else if (isOtherIncome) {
    incomeTypeCode = '62';
  }

  const NON_REFUNDABLE_CODES = [
    '60', '61', '62', '63', '64', '65', '68', '69',
    '71', '72', '73', '74', '75', '76', '77', '78', '79', '80'
  ];
  if (NON_REFUNDABLE_CODES.includes(incomeTypeCode)) {
    isNonRefundable = true;
  }

  return {
    year,
    name,
    foreignerNumber,
    workPlace,
    businessNumber,
    workPeriod,
    salaryTotal,
    taxBase,
    decisionTax,
    childReduction,
    childDeduction,
    determinedIncomeTax,
    determinedLocalTax,
    isNonRefundable,
    incomeTypeCode,
    taxReductionApplyDateStart: '',
    taxReductionApplyDateEnd: ''
  };
};
