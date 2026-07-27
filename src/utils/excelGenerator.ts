import ExcelJS from 'exceljs/dist/exceljs.min.js';
import JSZip from 'jszip';
import { calculateCombinedRefund } from './combinedTaxCalculator';

import type { RegistrationForm } from '../types/tax';

/**
 * [초세밀 ZIP 압축 구현판] 엑셀 병합 셀 파싱 우회 + 명시적 Row 커밋 기법을 적용하여 100% 실젯값 커밋
 * 활성화된 모든 연도에 대하여 각각 경정청구서 및 소득세액공제신고서를 채워 단일 ZIP 파일로 내려받습니다.
 */
export const generateConsolidatedExcel = async (
  regForm: RegistrationForm,
  selectedFeeRate: number,
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
) => {
  const cleanName = (regForm.name || '고객').trim();
  
  const cleanAndFormatDate = (str: string) => {
    if (!str) return '';
    const normalized = str.replace(/\./g, '-').trim();
    const parts = normalized.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}.${m}.${d}`;
    }
    return str;
  };

  const getCountryNameAndCode = (nationality: string) => {
    const nat = (nationality || '').trim();
    let code = 'KR';
    let name = '대한민국';

    if (nat.includes('인도네시아') || nat.toUpperCase() === 'INDONESIA') {
      name = '인도네시아'; code = 'ID';
    } else if (nat.includes('베트남') || nat.toUpperCase() === 'VIETNAM') {
      name = '베트남'; code = 'VN';
    } else if (nat.includes('네팔') || nat.toUpperCase() === 'NEPAL') {
      name = '네팔'; code = 'NP';
    } else if (nat.includes('캄보디아') || nat.toUpperCase() === 'CAMBODIA') {
      name = '캄보디아'; code = 'KH';
    } else if (nat.includes('미얀마') || nat.toUpperCase() === 'MYANMAR') {
      name = '미얀마'; code = 'MM';
    } else if (nat.includes('태국') || nat.toUpperCase() === 'THAILAND') {
      name = '태국'; code = 'TH';
    } else if (nat.includes('필리핀') || nat.toUpperCase() === 'PHILIPPINES') {
      name = '필리핀'; code = 'PH';
    } else if (nat.includes('방글라데시') || nat.toUpperCase() === 'BANGLADESH') {
      name = '방글라데시'; code = 'BD';
    } else if (nat.includes('몽골') || nat.toUpperCase() === 'MONGOLIA') {
      name = '몽골'; code = 'MN';
    } else if (nat.includes('우즈베키스탄') || nat.toUpperCase() === 'UZBEKISTAN') {
      name = '우즈베키스탄'; code = 'UZ';
    } else if (nat.includes('스리랑카') || nat.toUpperCase() === 'SRI LANKA') {
      name = '스리랑카'; code = 'LK';
    } else if (nat.includes('파키스탄') || nat.toUpperCase() === 'PAKISTAN') {
      name = '파키스탄'; code = 'PK';
    } else if (nat.includes('중국') || nat.toUpperCase() === 'CHINA') {
      name = '중국'; code = 'CN';
    } else if (nat.includes('러시아') || nat.toUpperCase() === 'RUSSIA') {
      name = '러시아'; code = 'RU';
    } else if (nat.includes('동티모르') || nat.toUpperCase() === 'EAST TIMOR') {
      name = '동티모르'; code = 'TL';
    } else if (nat) {
      name = nat;
      code = 'KR';
    }

    return `${name}  ( 국적 코드: ${code} )`;
  };
  
  // Find all unique years that are active in either wage or freelancer
  const wageYears = (regForm.years || []).filter((y: any) => y.active);
  const freelancerYearsList = Object.entries(regForm.freelancerYears || {})
    .filter(([_, data]: [string, any]) => data?.active)
    .map(([yr, _]) => yr);
    
  const uniqueActiveYears = Array.from(new Set([
    ...wageYears.map((y: any) => String(y.year)),
    ...freelancerYearsList
  ])).sort();

  if (uniqueActiveYears.length === 0) {
    showToast('활성화된 정산 연도 데이터가 없습니다.', 'error');
    return;
  }

  // ZIP 인스턴스 생성
  const zip = new JSZip();

  // 병합 셀 쓰기 오류 방지를 위한 헬퍼 함수 (자동 줄바꿈 방지, 폰트 조절 및 행 높이 자동 조절)
  const writeRange = (sheet: ExcelJS.Worksheet, startRow: number, endRow: number, startCol: number, endCol: number, val: any, align?: any) => {
    for (let r = startRow; r <= endRow; r++) {
      const row = sheet.getRow(r);
      for (let c = startCol; c <= endCol; c++) {
        const cell = row.getCell(c);
        cell.value = val;
        if (align?.numFmt) {
          cell.numFmt = align.numFmt;
        }

        const textStr = val !== null && val !== undefined ? String(val) : '';
        const len = textStr.length;

        // Estimate character capacity per line based on columns spanned (roughly 12 chars per column width)
        const colSpan = (endCol - startCol) + 1;
        const charsPerLine = align?.charsPerLine || (colSpan * 12);

        // Auto-wrap if the text exceeds capacity, or if wrapText is explicitly enabled
        const shouldWrap = align?.wrapText !== undefined
          ? align.wrapText
          : (len > charsPerLine);

        const existingAlignment = cell.alignment || {};
        cell.alignment = {
          vertical: 'middle',
          ...existingAlignment,
          wrapText: shouldWrap,
          ...align
        };

        // Adjust font size: default to 0.5pt smaller for clean appearance, and shrink further on overflow
        const originalSize = cell.font ? (cell.font.size || 10) : 10;
        let fontSize = align?.fontSize;
        if (!fontSize) {
          if (align?.isName) {
            if (len > 25) {
              fontSize = 6.5; // Aggressively shrink for extremely long foreigner names
            } else if (len > 18) {
              fontSize = 7.5;
            } else if (len > 12) {
              fontSize = 8.5;
            } else {
              fontSize = Math.max(9, originalSize - 0.5);
            }
          } else if (align?.isRrn) {
            fontSize = 8.5; // Keep RRN at 8.5pt so 14 chars fit on a single line
          } else {
            if (len > charsPerLine * 1.5) {
              fontSize = Math.max(8, originalSize - 2); // Shrink by 2pt if very long
            } else if (len > charsPerLine) {
              fontSize = Math.max(8.5, originalSize - 1.5); // Shrink by 1.5pt
            } else {
              fontSize = Math.max(9, originalSize - 0.5); // Default slight shrink for premium look
            }
          }
        }

        cell.font = {
          ...cell.font,
          size: fontSize
        };

        // Adjust row height dynamically if text wraps into multiple lines
        if (shouldWrap && len > 0) {
          const effectiveCharsPerLine = Math.floor(charsPerLine * (10 / fontSize));
          const lines = Math.ceil(len / Math.max(5, effectiveCharsPerLine));
          if (lines > 1) {
            const calculatedHeight = lines * 15 + 4;
            const currentHeight = row.height || 18;
            if (calculatedHeight > currentHeight) {
              row.height = calculatedHeight;
            }
          }
        }
      }
    }
  };

  // 1. 활성화된 연도별로 경정청구서 및 공제신고서 작성
  for (const yr of uniqueActiveYears) {
    const wageData = (regForm.years || []).find((y: any) => String(y.year) === yr && y.active);
    const freeData = regForm.freelancerYears?.[yr];
    const combinedRes = calculateCombinedRefund(regForm, yr, selectedFeeRate);

    // ==========================================
    // [파일 1] 과세표준 및 세액의 결정(경정)청구서
    // ==========================================
    showToast(`${yr}년 경정청구서 작성 중...`, 'info');
    const resClaim = await fetch('/2.국세기본법 제16호의2 과세표준및세액의결정청구서,경정청구서.xlsx');
    if (!resClaim.ok) throw new Error(`[${yr}년] 경정청구서 템플릿 파일을 찾을 수 없습니다.`);
    const claimBuf = await resClaim.arrayBuffer();
    const claimWb = new ExcelJS.Workbook();
    await claimWb.xlsx.load(claimBuf);
    
    // Position-based로 첫 번째 시트 획득 (ID 매핑 버그 우회)
    const claimSheet = claimWb.worksheets[0];
    if (!claimSheet) throw new Error(`[${yr}년] 경정청구서 템플릿의 첫 번째 시트를 찾지 못했습니다.`);
    try { claimSheet.unprotect(); } catch (e) {}

    // 제목에 귀속연도 기입 (Row 2~3, Col 1~12: 과세표준 및 세액의 결정(경정)청구서 타이틀 영역)
    claimSheet.getCell('A2').value = `과세표준 및 세액의 결정(경정)청구서 (${yr}년 귀속)`;

    // 인적 사항 기입 (Row 4~5, Col 4~5: 성명 - top-left is D4)
    claimSheet.getCell('D4').value = regForm.name || '';

    // 주민번호 기입 (Col 6 is F5, Col 8 is H5 - separated by dash in Col 7 G5)
    // We split the foreignerNumber (RRN) to write into F5 (first part) and H5 (second part)
    const fNum = regForm.foreignerNumber || '';
    const fNumParts = fNum.split('-');
    claimSheet.getCell('F5').value = fNumParts[0] || '';
    claimSheet.getCell('H5').value = fNumParts[1] || '';

    // 사업자등록번호 기입 (Row 5, Col 9~13: 사업자번호 값 영역 - top-left is I5)
    const bNum = wageData?.businessNumber || wageData?.companyRegNum || freeData?.businessNumber || '';
    claimSheet.getCell('I5').value = bNum;

     // 주소 기입 (Row 6~7, Col 4~8 - top-left is D6)
     const addr = regForm.residentRegisterAddress || '';
     claimSheet.getCell('D6').value = addr;

    // 전화번호 기입 (Row 6~7, Col 9~12 - top-left is I6)
    const phone = regForm.phone || '';
    claimSheet.getCell('I6').value = phone;

    // 상호 기입 (Row 8, Col 4~13 - top-left is D8)
    const workPlace = wageData?.workPlace || freeData?.workPlace || '';
    claimSheet.getCell('D8').value = workPlace;

    // 최초신고일 및 법정신고일 표시 (법정신고일 top-left is D10, 최초신고일 top-left is H10)
    claimSheet.getCell('D10').value = `${Number(yr) + 1}년 05월 31일`;
    claimSheet.getCell('H10').value = `${Number(yr) + 1}년 05월 31일`;

    // 경정청구 이유 (top-left is D11)
    let claimReason = '';
    if (wageData && freeData?.active) {
      claimReason = `${yr}년 귀속 근로소득 및 3.3% 사업소득 합산 종합소득세 경정청구 (중소기업 감면 및 인적공제 누락분 소급 적용)`;
    } else if (wageData) {
      claimReason = `${yr}년 귀속 중소기업 취업자 소득세 감면(90%) 적용 누락 소급 환급 청구 및 월세 세액공제 누락분 가산 환급 경정청구`;
    } else {
      claimReason = `${yr}년 귀속 3.3% 사업소득 원천징수세액 환급 경정청구`;
    }
    claimSheet.getCell('D11').value = claimReason;

    // 세액 세부 항목 기입 (Row 13 ~ Row 20)
    const originalTax = combinedRes.originalCalcTax || 0; // 산출세액 (당초)
    const origDecisionTax = combinedRes.originalDecisionTax || 0; // 결정세액 (당초)
    const origDeduction = Math.max(0, originalTax - origDecisionTax); // 당초 공제감면

    const newDecisionTax = combinedRes.combinedDecisionTax || 0; // 결정세액 (경정)
    const newDeduction = Math.max(0, (combinedRes.combinedCalcTax || 0) - newDecisionTax); // 경정 공제감면
    const refundAmt = combinedRes.nationalRefund || 0; // 환급 국세

    // ⑩ 세목 (Col 4 is D13, Col 8 is H13)
    claimSheet.getCell('D13').value = '종합소득세';
    claimSheet.getCell('H13').value = '종합소득세';

    // ⑪ 과세표준금액
    claimSheet.getCell('D14').value = combinedRes.originalTaxable || 0;
    claimSheet.getCell('D14').numFmt = '#,##0';
    claimSheet.getCell('H14').value = combinedRes.combinedTaxable || 0;
    claimSheet.getCell('H14').numFmt = '#,##0';

    // ⑫ 산출세액
    claimSheet.getCell('D15').value = originalTax;
    claimSheet.getCell('D15').numFmt = '#,##0';
    claimSheet.getCell('H15').value = combinedRes.combinedCalcTax || originalTax;
    claimSheet.getCell('H15').numFmt = '#,##0';

    // ⑬ 가산세액
    claimSheet.getCell('D16').value = 0;
    claimSheet.getCell('D16').numFmt = '#,##0';
    claimSheet.getCell('H16').value = 0;
    claimSheet.getCell('H16').numFmt = '#,##0';

    // ⑭ 공제 및 감면세액
    claimSheet.getCell('D17').value = origDeduction;
    claimSheet.getCell('D17').numFmt = '#,##0';
    claimSheet.getCell('H17').value = newDeduction;
    claimSheet.getCell('H17').numFmt = '#,##0';

    // ⑮ 납부할 세액 (결정세액)
    claimSheet.getCell('D18').value = origDecisionTax;
    claimSheet.getCell('D18').numFmt = '#,##0';
    claimSheet.getCell('H18').value = newDecisionTax;
    claimSheet.getCell('H18').numFmt = '#,##0';

    // (16) 국세환급금 계좌신고 (Col 5 is E19, Col 10 is J19)
    claimSheet.getCell('E19').value = regForm.refundBankName || '';
    claimSheet.getCell('J19').value = regForm.refundBank || '';

    // ⑰ 환급받을 세액 (Col 8 is H20)
    claimSheet.getCell('H20').value = refundAmt;
    claimSheet.getCell('H20').numFmt = '#,##0';

    // 하단 접수증 인적사항 기입 (Row 33, Col 3 is C33: 성명, Col 8 is H33: 주소)
    claimSheet.getCell('C33').value = regForm.name || '';
    claimSheet.getCell('H33').value = addr;

    // 오늘 날짜 및 서명 란 채우기 (Row 23 / Row 25 - top-left is A23 and A25)
    const today = new Date();
    const yy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    claimSheet.getCell('A23').value = `               ${yy}년       ${mm}월       ${dd}일`;
    claimSheet.getCell('A23').alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };

    claimSheet.getCell('A25').value = `                                                 청구인:   ${regForm.name} (서명 또는 인)`;
    claimSheet.getCell('A25').alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };

    // 변경 행 강제 커밋 진행
    claimSheet.getRow(2).commit();
    claimSheet.getRow(3).commit();
    claimSheet.getRow(4).commit();
    claimSheet.getRow(5).commit();
    claimSheet.getRow(6).commit();
    claimSheet.getRow(7).commit();
    claimSheet.getRow(8).commit();
    claimSheet.getRow(10).commit();
    claimSheet.getRow(11).commit();
    claimSheet.getRow(13).commit();
    claimSheet.getRow(14).commit();
    claimSheet.getRow(15).commit();
    claimSheet.getRow(16).commit();
    claimSheet.getRow(17).commit();
    claimSheet.getRow(18).commit();
    claimSheet.getRow(19).commit();
    claimSheet.getRow(20).commit();
    claimSheet.getRow(23).commit();
    claimSheet.getRow(25).commit();
    claimSheet.getRow(33).commit();

    const claimBuffer = await claimWb.xlsx.writeBuffer();
    zip.file(`${yr}_1.과세표준및세액의결정(경정)청구서.xlsx`, claimBuffer);

    // ==========================================
    // [파일 2] 소득·세액 공제신고서 (부양가족 및 월세 명세 포함)
    // ==========================================
    if (wageData) {
      showToast(`${yr}년 소득세액공제신고서 작성 중...`, 'info');
      const resDeduction = await fetch('/2023년 귀속 소득세액공제신고서_.xlsx');
      if (!resDeduction.ok) throw new Error(`[${yr}년] 소득세액공제신고서 템플릿 파일을 찾을 수 없습니다.`);
      const deductionBuf = await resDeduction.arrayBuffer();
      const deductionWb = new ExcelJS.Workbook();
      await deductionWb.xlsx.load(deductionBuf);
      
      // Position-based로 두 번째 시트 획득 ("2023년 소득공제신고서")
      const dedSheet = deductionWb.worksheets[1];
      if (!dedSheet) throw new Error(`[${yr}년] 소득세액공제신고서 템플릿의 두 번째 시트를 찾지 못했습니다.`);
      try { dedSheet.unprotect(); } catch (e) {}
      const infoSheet = deductionWb.worksheets[0];
      if (infoSheet) {
        try { infoSheet.unprotect(); } catch (e) {}
      }

      // 신고서 제목 귀속연도 동적 변경 기입 (Row 4, Col 6~38: 공제신고서 대형 타이틀 영역)
      writeRange(dedSheet, 4, 4, 6, 38, `소득ㆍ세액 공제신고서/근로소득자 소득ㆍ세액 공제신고서(${yr}년 소득에 대한)`);

      // 인적사항 기입 (Row 6, Col 7~21: 성명 / Row 6, Col 28~38: 주민번호)
      writeRange(dedSheet, 6, 6, 7, 21, regForm.name || '', { isName: true });
      writeRange(dedSheet, 6, 6, 28, 38, fNum, { isRrn: true });

      // 근무처 정보 기입 (Row 7, Col 7~21: 근무처명 / Row 7, Col 28~38: 사업자등록번호)
      writeRange(dedSheet, 7, 7, 7, 21, workPlace);
      writeRange(dedSheet, 7, 7, 28, 38, bNum);

      // 세대주 여부 (Row 8, Col 7~21) 및 국적 (Row 8, Col 28~38)
      const householderVal = regForm.rentHouseholder === '세대원' ? '[  ]세대주 [○]세대원 ' : '[○]세대주 [  ]세대원 ';
      writeRange(dedSheet, 8, 8, 7, 21, householderVal);
      writeRange(dedSheet, 8, 8, 28, 38, getCountryNameAndCode(regForm.nationality));

      // 거주구분 (Row 10, Col 7~21) 및 거주지국 (Row 10, Col 28~38)
      writeRange(dedSheet, 10, 10, 7, 21, '[○]거주자 [  ]비거주자');
      writeRange(dedSheet, 10, 10, 28, 38, '대한민국  ( 거주지국 코드: KR )');

      // 원천징수세액 선택 (Row 12, Col 7~21)
      writeRange(dedSheet, 12, 12, 7, 21, '[  ]120% [○]100% [  ]80%');

      // 인적공제 항목 변동 여부 (Row 11, Col 7~21) 및 분납신청 여부 (Row 11, Col 28~42)
      writeRange(dedSheet, 11, 11, 7, 21, '[○]전년과 동일  [  ]변동');
      writeRange(dedSheet, 11, 11, 28, 42, '[  ]신청   [○]미신청');

      // 근무기간 및 감면기간 동적 기입 (Row 9, Col 7~21: 근무기간 / Col 28~38: 감면기간)
      writeRange(dedSheet, 9, 9, 7, 21, `${yr}.01.01~${yr}.12.31`);

      let reductionStart = regForm.taxReductionApplyDateStart || '';
      let reductionEnd = regForm.taxReductionApplyDateEnd || '';
      if (!reductionStart && regForm.residentAddress) {
        const empParts = regForm.residentAddress.split('-');
        if (empParts.length === 3) {
          const empDateObj = new Date(Number(empParts[0]), Number(empParts[1]) - 1, Number(empParts[2]));
          const nextMonth = new Date(empDateObj.getFullYear(), empDateObj.getMonth() + 1, 1);
          const y = nextMonth.getFullYear();
          const m = String(nextMonth.getMonth() + 1).padStart(2, '0');
          reductionStart = `${y}-${m}-01`;
          const endMonth = new Date(y + 5, nextMonth.getMonth(), 0);
          reductionEnd = `${endMonth.getFullYear()}-${String(endMonth.getMonth() + 1).padStart(2, '0')}-${String(endMonth.getDate()).padStart(2, '0')}`;
        }
      }
      if (reductionStart && reductionEnd) {
        const formattedStart = cleanAndFormatDate(reductionStart);
        const formattedEnd = cleanAndFormatDate(reductionEnd);
        writeRange(dedSheet, 9, 9, 28, 38, `${formattedStart} ∼ ${formattedEnd}`);
      }

      // 중소기업 취업자 감면 정보 기입 (Row 116, Col 24~30: 취업일 / Col 39~42: 감면기간 종료일)
      if (regForm.residentAddress) {
        writeRange(dedSheet, 116, 116, 24, 30, cleanAndFormatDate(regForm.residentAddress));
      }
      if (reductionEnd) {
        writeRange(dedSheet, 116, 116, 39, 42, cleanAndFormatDate(reductionEnd));
      }

      let dependentsList = [...(regForm.dependents || [])];
      if (dependentsList.length === 0) {
        const depCount = Number(regForm.dependentsCount) || 0;
        const senCount = Number(regForm.seniorCount) || 0;
        const disCount = Number(regForm.disabledCount) || 0;
        const chCount = Number(regForm.childCount) || 0;

        const totalUniqueDeps = Math.max(depCount, senCount, disCount, chCount);

        for (let i = 0; i < totalUniqueDeps; i++) {
          dependentsList.push({
            name: `부양가족 ${i + 1} (성명 입력)`,
            rrn: '주민번호 입력',
            relation: '직계비속',
            isBasic: i < depCount || i < (senCount + disCount + chCount),
            isSenior: i < senCount,
            isDisabled: i >= senCount && i < (senCount + disCount),
            isChild: i >= (senCount + disCount) && i < (senCount + disCount + chCount)
          });
        }
      }

      dependentsList.forEach((dep: any, idx: number) => {
        const nameRow = 20 + (idx * 2);
        const rrnRow = 21 + (idx * 2);
        if (rrnRow <= 23) { // 템플릿 한계 상 2명까지 안전하게 채움
          // 관계코드 (Column B)
          let relationCode = '4'; // 기본값: 직계비속
          const relationStr = dep.relation || '';
          if (relationStr.includes('배우자')) relationCode = '3';
          else if (relationStr.includes('부') || relationStr.includes('모') || relationStr.includes('조부') || relationStr.includes('조모')) relationCode = '1';
          else if (relationStr.includes('형제') || relationStr.includes('자매')) relationCode = '6';

          writeRange(dedSheet, nameRow, nameRow, 2, 2, relationCode);
          
          // 내외국인 (Column B, rrnRow)
          writeRange(dedSheet, rrnRow, rrnRow, 2, 2, '1'); // 내국인

          // 성명 (Column C-F: Col 3~6)
          writeRange(dedSheet, nameRow, nameRow, 3, 6, dep.name || '');

          // 주민등록번호 (Column C-F: Col 3~6)
          writeRange(dedSheet, rrnRow, rrnRow, 3, 6, dep.rrn || '');

          // 기본공제 체크 (Column J-M: Col 10~13)
          if (dep.isBasic !== false) {
            writeRange(dedSheet, nameRow, nameRow, 10, 13, '○');
          }

          // 경로우대 체크 (Column N-O: Col 14~15 in nameRow)
          if (dep.isSenior) {
            writeRange(dedSheet, nameRow, nameRow, 14, 15, '○');
          }

          // 장애인 체크 (Column N-O: Col 14~15 in rrnRow)
          if (dep.isDisabled) {
            writeRange(dedSheet, rrnRow, rrnRow, 14, 15, '○');
          }

          // 자녀 체크 (Column P-Q: Col 16~17 in rrnRow)
          if (dep.isChild) {
            writeRange(dedSheet, rrnRow, rrnRow, 16, 17, '○');
          }
        }
      });

      // 월세 정보 기입 (Row 307)
      if (regForm.isMonthlyRent === 'ga' || regForm.isMonthlyRent === '가') {
        writeRange(dedSheet, 307, 307, 1, 3, regForm.landlordName || ''); // 임대인 성명 (A-C)
        writeRange(dedSheet, 307, 307, 4, 7, regForm.landlordRegNum || ''); // 임대인 주민번호 (D-G)
        
        let typeCode = '1';
        const typeStr = regForm.rentHousingType || '';
        if (typeStr.includes('단독')) typeCode = '1';
        else if (typeStr.includes('다가구')) typeCode = '2';
        else if (typeStr.includes('다세대')) typeCode = '3';
        else if (typeStr.includes('연립')) typeCode = '4';
        else if (typeStr.includes('아파트')) typeCode = '5';
        else if (typeStr.includes('오피스텔')) typeCode = '6';
        else if (typeStr.includes('고시원') || typeStr.includes('원룸')) typeCode = '7';
        else typeCode = '8';

        writeRange(dedSheet, 307, 307, 8, 10, typeCode); // 주택유형 (H-J)
        writeRange(dedSheet, 307, 307, 11, 15, regForm.rentHousingSize ? Number(regForm.rentHousingSize) : ''); // 전용면적 (K-O)
        writeRange(dedSheet, 307, 307, 16, 25, regForm.residentRegisterAddress || ''); // 임대차계약 주소 (P-Y)
        writeRange(dedSheet, 307, 307, 26, 29, regForm.rentLeaseStart || ''); // 계약기간 시작일 (Z-AC)
        writeRange(dedSheet, 307, 307, 30, 33, regForm.rentLeaseEnd || ''); // 계약기간 종료일 (AD-AG)
        
        const annualRent = (Number(regForm.monthlyRentFee) || 0) * 12;
        writeRange(dedSheet, 307, 307, 34, 38, annualRent, { numFmt: '#,##0' }); // 연간 월세액 (AH-AL)
        
        const mainSalary = Number(wageData.salaryTotal) || 0;
        const rate = mainSalary <= 55000000 ? 0.17 : 0.15;
        const limitRent = Math.min(annualRent, 10000000);
        const deductionAmt = Math.round(limitRent * rate);
        
        writeRange(dedSheet, 307, 307, 39, 42, deductionAmt, { numFmt: '#,##0' }); // 세액공제액 (AM-AP)

        // Row 154 월세액 세액공제 요약 기입 (지출액 및 세액공제액)
        writeRange(dedSheet, 154, 154, 22, 25, annualRent, { numFmt: '#,##0' }); // 지출액 (V-Y)
        writeRange(dedSheet, 154, 154, 36, 42, deductionAmt, { numFmt: '#,##0' }); // 세액공제금액 (AJ-AP)
      } else {
        // 월세액 세액공제 없는 경우 비워주기
        writeRange(dedSheet, 154, 154, 22, 25, '');
        writeRange(dedSheet, 154, 154, 36, 42, '');
      }

      // 행 커밋 진행
      dedSheet.getRow(4).commit();
      dedSheet.getRow(6).commit();
      dedSheet.getRow(7).commit();
      dedSheet.getRow(8).commit();
      dedSheet.getRow(9).commit();
      dedSheet.getRow(10).commit();
      dedSheet.getRow(11).commit();
      dedSheet.getRow(12).commit();
      dedSheet.getRow(20).commit();
      dedSheet.getRow(21).commit();
      dedSheet.getRow(22).commit();
      dedSheet.getRow(23).commit();
      dedSheet.getRow(116).commit();
      dedSheet.getRow(154).commit();
      dedSheet.getRow(307).commit();


      const deductionBuffer = await deductionWb.xlsx.writeBuffer();
      zip.file(`${yr}_2.소득세액공제신고서_월세명세포함.xlsx`, deductionBuffer);
    }
  }

  // ==========================================
  // [파일 3] 중소기업 취업자 소득세 감면 명세서 (최근 활성화된 근로소득 연도 기준 1개만 생성)
  // ==========================================
  const latestWageYrData = wageYears[wageYears.length - 1];
  if (latestWageYrData) {
    showToast('3. 중소기업 감면명세서 작성 중...', 'info');
    const resSme = await fetch('/중소기업 취업자 소득세 감면 대상 명세서.xlsx');
    if (!resSme.ok) throw new Error('중소기업 감면 명세서 템플릿 파일을 찾을 수 없습니다.');
    const smeBuf = await resSme.arrayBuffer();
    const smeWb = new ExcelJS.Workbook();
    await smeWb.xlsx.load(smeBuf);
    
    const smeSheet = smeWb.worksheets[0];
    if (!smeSheet) throw new Error('중소기업 감면 명세서 of 첫 번째 시트를 찾지 못했습니다.');
    try { smeSheet.unprotect(); } catch (e) {}

    const companyName = latestWageYrData.workPlace || '';
    const bNum = latestWageYrData.businessNumber || latestWageYrData.companyRegNum || '';

    // 1. Calculate Age at Employment (만 나이)
    const rrn = regForm.foreignerNumber ? regForm.foreignerNumber.replace(/-/g, '').trim() : '';
    let birthYear = 0;
    let birthMonth = 0;
    let birthDay = 0;
    if (rrn.length >= 7) {
      const yy = Number(rrn.substring(0, 2));
      const mm = Number(rrn.substring(2, 4));
      const dd = Number(rrn.substring(4, 6));
      const genderChar = rrn.charAt(6);
      
      if (['1', '2', '5', '6'].includes(genderChar)) {
        birthYear = 1900 + yy;
      } else if (['3', '4', '7', '8'].includes(genderChar)) {
        birthYear = 2000 + yy;
      } else {
        birthYear = (yy > 30) ? 1900 + yy : 2000 + yy;
      }
      birthMonth = mm;
      birthDay = dd;
    }

    let ageAtEmployment = '';
    if (birthYear > 0 && regForm.residentAddress) {
      const empParts = regForm.residentAddress.split('-');
      if (empParts.length === 3) {
        const empYear = Number(empParts[0]);
        const empMonth = Number(empParts[1]);
        const empDay = Number(empParts[2]);
        
        let age = empYear - birthYear;
        if (empMonth < birthMonth || (empMonth === birthMonth && empDay < birthDay)) {
          age--;
        }
        ageAtEmployment = String(age);
      }
    }

    let reductionStart = '';
    let reductionEnd = '';
    if (regForm.residentAddress) {
      const empParts = regForm.residentAddress.split('-');
      if (empParts.length === 3) {
        const empYear = Number(empParts[0]);
        const empMonth = Number(empParts[1]);
        reductionStart = regForm.residentAddress; // 시작일은 취업일 그 자체
        const endMonthDate = new Date(empYear + 5, empMonth, 0); // 5년 후 취업월의 말일
        const ey = endMonthDate.getFullYear();
        const em = String(endMonthDate.getMonth() + 1).padStart(2, '0');
        const ed = String(endMonthDate.getDate()).padStart(2, '0');
        reductionEnd = `${ey}-${em}-${ed}`;
      }
    }
    if (!reductionStart) {
      reductionStart = regForm.taxReductionApplyDateStart || '';
      reductionEnd = regForm.taxReductionApplyDateEnd || '';
    }

    // 5. Force column widths to prevent text wrapping/cutting off
    smeSheet.getColumn('A').width = 9.5;
    smeSheet.getColumn('B').width = 16.5;
    smeSheet.getColumn('C').width = 13.0;
    smeSheet.getColumn('D').width = 10.0;
    smeSheet.getColumn('E').width = 12.0;
    smeSheet.getColumn('F').width = 16.0;
    smeSheet.getColumn('G').width = 13.0;
    smeSheet.getColumn('H').width = 12.0;
    smeSheet.getColumn('I').width = 12.0;

    // 6. Force row heights to prevent overlapping and provide spaces
    smeSheet.getRow(4).height = 28;
    smeSheet.getRow(5).height = 28;
    smeSheet.getRow(6).height = 28;
    smeSheet.getRow(9).height = 25;
    smeSheet.getRow(10).height = 25;

    for (let r = 11; r <= 18; r++) {
      smeSheet.getRow(r).height = 22;
    }

    smeSheet.getRow(20).height = 40;
    smeSheet.getRow(22).height = 30;
    smeSheet.getRow(23).height = 35;
    smeSheet.getRow(24).height = 35;

    smeSheet.getRow(27).height = 22;
    smeSheet.getRow(28).height = 28;
    smeSheet.getRow(29).height = 28;
    smeSheet.getRow(30).height = 38;
    smeSheet.getRow(31).height = 38;

    // 7. Configure Page Setup for 1-Page Scaling with narrow margins
    smeSheet.pageSetup = {
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      orientation: 'portrait',
      paperSize: 9, // A4
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2
      }
    };

    // 1. 원천징수의무자 기본 정보 (병합 영역 기입)
    smeSheet.getCell('C4').value = "상 호 : " + companyName;
    smeSheet.getCell('G4').value = "사업자등록번호 : " + bNum;
    smeSheet.getCell('C5').value = "사업장소재지 : " + (regForm.companyAddress || '');
    smeSheet.getCell('G5').value = "주업종코드 : " + (regForm.companyIndustry || '');
    smeSheet.getCell('C6').value = "(전화번호 : " + (regForm.companyPhone || '') + ")";

    // Helper to adjust cell style alignment
    const cleanCellLayout = (cell: ExcelJS.Cell, isLongText = false) => {
      const text = cell.value ? String(cell.value) : '';
      const len = text.length;
      const existingAlignment = cell.alignment || {};
      cell.alignment = {
        vertical: 'middle',
        ...existingAlignment,
        wrapText: isLongText ? (len > 35) : false
      };
      if (isLongText && len > 35 && cell.font) {
        cell.font = {
          ...cell.font,
          size: Math.max(8.5, (cell.font.size || 10) - 1.5)
        };
      }
    };

    cleanCellLayout(smeSheet.getCell('C4'));
    cleanCellLayout(smeSheet.getCell('G4'));
    cleanCellLayout(smeSheet.getCell('C5'), true);
    cleanCellLayout(smeSheet.getCell('G5'));
    cleanCellLayout(smeSheet.getCell('C6'));

    // 2. 근로자 대상자 기본 정보 (Row 11~12 병합 셀 기입)
    const cellA11 = smeSheet.getCell('A11');
    cellA11.value = regForm.name ? regForm.name.toUpperCase() : '';
    const nameLen = String(cellA11.value).length;
    if (nameLen > 25) {
      cellA11.font = { ...cellA11.font, size: 6.5 };
    } else if (nameLen > 18) {
      cellA11.font = { ...cellA11.font, size: 7.5 };
    } else if (nameLen > 12) {
      cellA11.font = { ...cellA11.font, size: 8.5 };
    } else if (cellA11.font) {
      cellA11.font = { ...cellA11.font, size: Math.max(9, (cellA11.font.size || 10) - 0.5) };
    }
    cellA11.alignment = { ...cellA11.alignment, vertical: 'middle', wrapText: true };

    const cellB11 = smeSheet.getCell('B11');
    cellB11.value = regForm.foreignerNumber || '';
    cellB11.font = { ...cellB11.font, size: 8.5 };
    cellB11.alignment = { ...cellB11.alignment, vertical: 'middle', wrapText: false };

    const cellC11 = smeSheet.getCell('C11');
    cellC11.value = cleanAndFormatDate(regForm.residentAddress);
    cellC11.alignment = { ...cellC11.alignment, vertical: 'middle', horizontal: 'center', wrapText: false };

    const cellD11 = smeSheet.getCell('D11');
    cellD11.value = '청년';
    cellD11.alignment = { ...cellD11.alignment, vertical: 'middle', wrapText: false };

    const cellE11 = smeSheet.getCell('E11');
    cellE11.value = ageAtEmployment || '';
    cellE11.alignment = { ...cellE11.alignment, vertical: 'middle', wrapText: false };

    smeSheet.getCell('F11').value = '-';
    smeSheet.getCell('G11').value = '-';
    
    // 시작일 / 종료일
    const cellH12 = smeSheet.getCell('H12');
    cellH12.value = cleanAndFormatDate(reductionStart);
    cellH12.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };

    const cellI12 = smeSheet.getCell('I12');
    cellI12.value = cleanAndFormatDate(reductionEnd);
    cellI12.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };

    // 3. 하단 신고 날짜 및 의무자 서명
    const today = new Date();
    const yy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    smeSheet.getCell('A22').value = `${yy}년         ${mm}월         ${dd}일`;
    
    smeSheet.getCell('A23').value = {
      richText: [
        { text: "원천징수의무자                  " },
        { font: { size: 10, bold: true, name: "돋움" }, text: companyName },
        { text: "                  " },
        { font: { size: 8, color: { argb: "FF7F7F7F" }, name: "돋움" }, text: "(서명 또는 인)" }
      ]
    };

    smeSheet.getRow(4).commit();
    smeSheet.getRow(5).commit();
    smeSheet.getRow(6).commit();
    smeSheet.getRow(11).commit();
    smeSheet.getRow(12).commit();
    smeSheet.getRow(22).commit();
    smeSheet.getRow(23).commit();

    const smeBuffer = await smeWb.xlsx.writeBuffer();
    zip.file(`3.중소기업취업자소득세감면대상명세서.xlsx`, smeBuffer);
  }

  // ==========================================
  // ZIP 다운로드
  // ==========================================
  showToast('통합 엑셀 압축 파일(ZIP) 패키징 중...', 'info');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanName}_통합_경정청구_명세서.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
