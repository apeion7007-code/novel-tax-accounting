import ExcelJS from 'exceljs/dist/exceljs.min.js';
import JSZip from 'jszip';

interface Dependent {
  name: string;
  rrn: string;
  relation?: string;
}

interface YearData {
  active: boolean;
  year: string;
  workPlace?: string;
  businessNumber?: string;
  companyRegNum?: string;
  salaryTotal?: string;
  taxBase?: string;
  decisionTax?: string;
  decisionTaxApplyAmt?: string;
  refundExpectNational?: string;
  rentRefundExpectNational?: string;
}

interface RegForm {
  name: string;
  foreignerNumber?: string;
  residentRegisterAddress?: string;
  residentAddress?: string;
  taxReductionApplyDateStart?: string;
  taxReductionApplyDateEnd?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyIndustry?: string;
  isMonthlyRent?: string;
  landlordName?: string;
  landlordRegNum?: string;
  rentHousingType?: string;
  rentHousingSize?: string;
  monthlyRentFee?: string;
  rentLeaseStart?: string;
  rentLeaseEnd?: string;
  refundBankName?: string;
  refundBank?: string;
  dependents?: Dependent[];
  years?: YearData[];
}

/**
 * [초세밀 ZIP 압축 구현판] 엑셀 병합 셀 파싱 우회 + 명시적 Row 커밋 기법을 적용하여 100% 실젯값 커밋
 * 활성화된 모든 연도에 대하여 각각 경정청구서 및 소득세액공제신고서를 채워 단일 ZIP 파일로 내려받습니다.
 */
export const generateConsolidatedExcel = async (
  regForm: RegForm,
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
) => {
  const cleanName = (regForm.name || '고객').trim();
  const activeYears = (regForm.years || []).filter((y: any) => y.active);

  if (activeYears.length === 0) {
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
  for (const yrData of activeYears) {
    const yr = yrData.year;

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
    const bNum = yrData.businessNumber || yrData.companyRegNum || '';
    claimSheet.getCell('I5').value = bNum;

    // 주소 기입 (Row 6~7, Col 4~8 - top-left is D6)
    const addr = regForm.residentRegisterAddress || regForm.residentAddress || '';
    claimSheet.getCell('D6').value = addr;

    // 전화번호 기입 (Row 6~7, Col 9~12 - top-left is I6)
    const phone = regForm.companyPhone || '';
    claimSheet.getCell('I6').value = phone;

    // 상호 기입 (Row 8, Col 4~13 - top-left is D8)
    const workPlace = yrData.workPlace || '';
    claimSheet.getCell('D8').value = workPlace;

    // 최초신고일 및 법정신고일 표시 (법정신고일 top-left is D10, 최초신고일 top-left is H10)
    claimSheet.getCell('D10').value = `${Number(yr) + 1}년 05월 31일`;
    claimSheet.getCell('H10').value = `${Number(yr) + 1}년 05월 31일`;

    // 경정청구 이유 (top-left is D11)
    const claimReason = `${yr}년 귀속 중소기업 취업자 소득세 감면(90%) 적용 누락 소급 환급 청구 및 월세 세액공제 누락분 가산 환급 경정청구`;
    claimSheet.getCell('D11').value = claimReason;

    // 세액 세부 항목 기입 (Row 13 ~ Row 20)
    const originalTax = Number(yrData.taxBase) || 0; // 산출세액
    const origDecisionTax = Number(yrData.decisionTax) || 0; // 당초 결정세액
    const origDeduction = Math.max(0, originalTax - origDecisionTax); // 당초 공제감면

    const newDecisionTax = Number(yrData.decisionTaxApplyAmt) || 0; // 경정 결정세액
    const newDeduction = Math.max(0, originalTax - newDecisionTax); // 경정 공제감면
    const refundAmt = (Number(yrData.refundExpectNational) || 0) + (Number(yrData.rentRefundExpectNational) || 0); // 환급 국세 (근로소득 환급 + 월세 환급)

    // ⑩ 세목 (Col 4 is D13, Col 8 is H13)
    claimSheet.getCell('D13').value = '종합소득세';
    claimSheet.getCell('H13').value = '종합소득세';

    // ⑪ 과세표준금액 (비워둠)
    claimSheet.getCell('D14').value = '';
    claimSheet.getCell('H14').value = '';

    // ⑫ 산출세액
    claimSheet.getCell('D15').value = originalTax;
    claimSheet.getCell('D15').numFmt = '#,##0';
    claimSheet.getCell('H15').value = originalTax;
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
    showToast(`${yr}년 소득세액공제신고서 작성 중...`, 'info');
    const resDeduction = await fetch('/2023년 귀속 소득세액공제신고서_.xlsx');
    if (!resDeduction.ok) throw new Error(`[${yr}년] 소득세액공제신고서 템플릿 파일을 찾을 수 없습니다.`);
    const deductionBuf = await resDeduction.arrayBuffer();
    const deductionWb = new ExcelJS.Workbook();
    await deductionWb.xlsx.load(deductionBuf);
    
    // Position-based로 두 번째 시트 획득 ("2023년 소득공제신고서")
    const dedSheet = deductionWb.worksheets[1];
    if (!dedSheet) throw new Error(`[${yr}년] 소득세액공제신고서 템플릿의 두 번째 시트를 찾지 못했습니다.`);

    // 신고서 제목 귀속연도 동적 변경 기입 (Row 4, Col 6~38: 공제신고서 대형 타이틀 영역)
    writeRange(dedSheet, 4, 4, 6, 38, `소득ㆍ세액 공제신고서/근로소득자 소득ㆍ세액 공제신고서(${yr}년 소득에 대한)`);

    // 인적사항 기입 (Row 6, Col 7~21: 성명 / Row 6, Col 28~38: 주민번호)
    writeRange(dedSheet, 6, 6, 7, 21, regForm.name || '', { isName: true });
    writeRange(dedSheet, 6, 6, 28, 38, fNum, { isRrn: true });

    // 근무처 정보 기입 (Row 7, Col 7~21: 근무처명 / Row 7, Col 28~38: 사업자등록번호)
    writeRange(dedSheet, 7, 7, 7, 21, workPlace);
    writeRange(dedSheet, 7, 7, 28, 38, bNum);

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
      const formattedStart = reductionStart.replace(/-/g, '.');
      const formattedEnd = reductionEnd.replace(/-/g, '.');
      writeRange(dedSheet, 9, 9, 28, 38, `${formattedStart} ∼ ${formattedEnd}`);
    }

    // 부양가족 루프 매핑 (Row 20부터 2행 간격으로 배정: 20-21은 1번째 부양가족, 22-23은 2번째 부양가족)
    const dependentsList = regForm.dependents || [];
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

        // 기본공제 체크 (Column J-K: Col 10~11)
        writeRange(dedSheet, nameRow, nameRow, 10, 11, '○');
      }
    });

    // 월세 정보 기입 (Row 307)
    if (regForm.isMonthlyRent === 'ga' || regForm.isMonthlyRent === '가') {
      writeRange(dedSheet, 307, 307, 1, 3, regForm.landlordName || ''); // 임대인 성명 (A-C)
      writeRange(dedSheet, 307, 307, 4, 7, regForm.landlordRegNum || ''); // 임대인 주민번호 (D-G)
      writeRange(dedSheet, 307, 307, 8, 10, regForm.rentHousingType === '오피스텔' ? '6' : '1'); // 주택유형 (H-J)
      writeRange(dedSheet, 307, 307, 11, 15, regForm.rentHousingSize ? Number(regForm.rentHousingSize) : ''); // 전용면적 (K-O)
      writeRange(dedSheet, 307, 307, 16, 25, regForm.residentRegisterAddress || regForm.residentAddress || ''); // 임대차계약 주소 (P-Y)
      writeRange(dedSheet, 307, 307, 26, 29, regForm.rentLeaseStart || ''); // 계약기간 시작일 (Z-AC)
      writeRange(dedSheet, 307, 307, 30, 33, regForm.rentLeaseEnd || ''); // 계약기간 종료일 (AD-AG)
      
      const annualRent = (Number(regForm.monthlyRentFee) || 0) * 12;
      writeRange(dedSheet, 307, 307, 34, 38, annualRent, { numFmt: '#,##0' }); // 연간 월세액 (AH-AL)
      
      const mainSalary = Number(yrData.salaryTotal) || 0;
      const rate = mainSalary <= 55000000 ? 0.17 : 0.15;
      const limitRent = Math.min(annualRent, 10000000);
      const deductionAmt = Math.round(limitRent * rate);
      
      writeRange(dedSheet, 307, 307, 39, 42, deductionAmt, { numFmt: '#,##0' }); // 세액공제액 (AM-AP)
    }

    // 행 커밋 진행
    dedSheet.getRow(4).commit();
    dedSheet.getRow(6).commit();
    dedSheet.getRow(7).commit();
    dedSheet.getRow(9).commit();
    dedSheet.getRow(20).commit();
    dedSheet.getRow(21).commit();
    dedSheet.getRow(22).commit();
    dedSheet.getRow(23).commit();
    dedSheet.getRow(307).commit();

    const deductionBuffer = await deductionWb.xlsx.writeBuffer();
    zip.file(`${yr}_2.소득세액공제신고서_월세명세포함.xlsx`, deductionBuffer);
  }

  // ==========================================
  // [파일 3] 중소기업 취업자 소득세 감면 명세서 (최근 활성화된 연도 기준 1개만 생성)
  // ==========================================
  const latestYrData = activeYears[activeYears.length - 1];
  
  showToast('3. 중소기업 감면명세서 작성 중...', 'info');
  const resSme = await fetch('/중소기업 취업자 소득세 감면 대상 명세서.xlsx');
  if (!resSme.ok) throw new Error('중소기업 감면 명세서 템플릿 파일을 찾을 수 없습니다.');
  const smeBuf = await resSme.arrayBuffer();
  const smeWb = new ExcelJS.Workbook();
  await smeWb.xlsx.load(smeBuf);
  
  const smeSheet = smeWb.worksheets[0];
  if (!smeSheet) throw new Error('중소기업 감면 명세서의 첫 번째 시트를 찾지 못했습니다.');

  const companyName = latestYrData.workPlace || '';
  const bNum = latestYrData.businessNumber || latestYrData.companyRegNum || '';

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
  cellC11.value = regForm.residentAddress || '';
  cellC11.alignment = { ...cellC11.alignment, vertical: 'middle', wrapText: false };

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
  cellH12.value = reductionStart || '';
  cellH12.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };

  const cellI12 = smeSheet.getCell('I12');
  cellI12.value = reductionEnd || '';
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
