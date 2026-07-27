import ExcelJS from 'exceljs/dist/exceljs.min.js';

interface Dependent {
  name: string;
  rrn: string;
}

interface YearData {
  active: boolean;
  workPlace?: string;
  businessNumber?: string;
  companyRegNum?: string;
  salaryTotal?: string;
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
  dependents?: Dependent[];
  years?: YearData[];
}

/**
 * 엑셀 다운로드 파일 생성 및 브라우저 다운로드 처리 헬퍼
 */
const downloadWorkbook = async (workbook: ExcelJS.Workbook, filename: string) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  // 순차 다운로드 딜레이를 주어 브라우저 팝업 차단 우회
  await new Promise(r => setTimeout(r, 600));
};

/**
 * [완성판] 엑셀 병합 셀 파싱 우회 + 명시적 Row 커밋 기법을 적용하여 100% 실젯값 커밋
 */
export const generateConsolidatedExcel = async (
  regForm: RegForm,
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
) => {
  const cleanName = (regForm.name || '고객').trim();

  // ==========================================
  // [파일 1] 과세표준 및 세액의 결정(경정)청구서
  // ==========================================
  showToast('1. 경정청구서 파일 작성 중...', 'info');
  const resClaim = await fetch('/2.국세기본법 제16호의2 과세표준및세액의결정청구서,경정청구서.xlsx');
  if (!resClaim.ok) throw new Error('경정청구서 템플릿 파일을 찾을 수 없습니다.');
  const claimBuf = await resClaim.arrayBuffer();
  const claimWb = new ExcelJS.Workbook();
  await claimWb.xlsx.load(claimBuf);
  
  const claimSheet = claimWb.getWorksheet(1);
  if (!claimSheet) throw new Error('경정청구서 템플릿의 첫 번째 시트를 찾지 못했습니다.');

  // 병합 셀 오류 방지: 해당 병합 범위의 모든 셀에 안전하게 값을 동시 기입
  // 성명 (Row 4~5, Col 4~5 범위)
  for (let r = 4; r <= 5; r++) {
    for (let c = 4; c <= 5; c++) {
      claimSheet.getRow(r).getCell(c).value = regForm.name || '';
    }
  }
  
  // 주민번호 (Row 4~5, Col 6~8 범위)
  const fNum = regForm.foreignerNumber || '';
  for (let r = 4; r <= 5; r++) {
    for (let c = 6; c <= 8; c++) {
      claimSheet.getRow(r).getCell(c).value = fNum;
    }
  }

  // 사업자등록번호 (Row 4~5, Col 9~13 범위)
  const bNum = (regForm.years && regForm.years[0]?.businessNumber) || '';
  for (let r = 4; r <= 5; r++) {
    for (let c = 9; c <= 13; c++) {
      claimSheet.getRow(r).getCell(c).value = bNum;
    }
  }

  // 주소 (Row 6~7, Col 4~8 범위)
  const addr = regForm.residentRegisterAddress || regForm.residentAddress || '';
  for (let r = 6; r <= 7; r++) {
    for (let c = 4; c <= 8; c++) {
      claimSheet.getRow(r).getCell(c).value = addr;
    }
  }

  // 전화번호 (Row 6~7, Col 9~12 범위)
  const phone = regForm.companyPhone || '';
  for (let r = 6; r <= 7; r++) {
    for (let c = 9; c <= 12; c++) {
      claimSheet.getRow(r).getCell(c).value = phone;
    }
  }

  // 상호 (Row 8, Col 4~13 범위)
  const workPlace = (regForm.years && regForm.years[0]?.workPlace) || '';
  for (let c = 4; c <= 13; c++) {
    claimSheet.getRow(8).getCell(c).value = workPlace;
  }
  
  // 경정청구 이유 (Row 11, Col 4~13 범위 전체 기입)
  const claimReason = "중소기업 취업자 소득세 감면(90%) 적용 누락 소급 환급 청구 및 월세 세액공제 누락분 가산 환급 경정청구";
  for (let c = 4; c <= 13; c++) {
    claimSheet.getRow(11).getCell(c).value = claimReason;
  }
  
  // 오늘 날짜 및 서명 란 채우기 (Row 23 / Row 25)
  const today = new Date();
  const yy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  
  for (let c = 1; c <= 13; c++) {
    claimSheet.getRow(23).getCell(c).value = `               ${yy}년       ${mm}월       ${dd}일`;
    claimSheet.getRow(25).getCell(c).value = `                                                 청구인:   ${regForm.name} (서명 또는 인)`;
  }

  // 변경 행 강제 커밋 진행
  claimSheet.getRow(4).commit();
  claimSheet.getRow(5).commit();
  claimSheet.getRow(6).commit();
  claimSheet.getRow(7).commit();
  claimSheet.getRow(8).commit();
  claimSheet.getRow(11).commit();
  claimSheet.getRow(23).commit();
  claimSheet.getRow(25).commit();

  await downloadWorkbook(claimWb, `${cleanName}_1.과세표준및세액의결정(경정)청구서.xlsx`);

  // ==========================================
  // [파일 2] 소득·세액 공제신고서 (부양가족 및 월세 명세 포함)
  // ==========================================
  showToast('2. 소득세액공제신고서 파일 작성 중...', 'info');
  const resDeduction = await fetch('/2023년 귀속 소득세액공제신고서_.xlsx');
  if (!resDeduction.ok) throw new Error('소득세액공제신고서 템플릿 파일을 찾을 수 없습니다.');
  const deductionBuf = await resDeduction.arrayBuffer();
  const deductionWb = new ExcelJS.Workbook();
  await deductionWb.xlsx.load(deductionBuf);
  
  const dedSheet = deductionWb.getWorksheet(2);
  if (!dedSheet) throw new Error('소득세액공제신고서 템플릿의 두 번째 시트를 찾지 못했습니다.');

  // 인적사항 병합셀 기입 (D4~H4 / T4~X4)
  for (let c = 4; c <= 8; c++) {
    dedSheet.getRow(4).getCell(c).value = regForm.name || '';
    dedSheet.getRow(5).getCell(c).value = workPlace;
  }
  for (let c = 20; c <= 24; c++) {
    dedSheet.getRow(4).getCell(c).value = fNum;
    dedSheet.getRow(5).getCell(c).value = bNum;
  }

  // 부양가족 루프 매핑 (Row 21부터 2행 간격)
  const dependentsList = regForm.dependents || [];
  dependentsList.forEach((dep: any, idx: number) => {
    const targetRow = 21 + (idx * 2);
    if (targetRow <= 35) {
      dedSheet.getCell(`C${targetRow}`).value = dep.name || '';
      dedSheet.getCell(`E${targetRow}`).value = dep.rrn || '';
      dedSheet.getCell(`J${targetRow}`).value = '○';
    }
  });

  // 월세 정보 기입 (Row 307)
  if (regForm.isMonthlyRent === 'ga' || regForm.isMonthlyRent === '가') {
    dedSheet.getCell('A307').value = regForm.landlordName || '';
    dedSheet.getCell('D307').value = regForm.landlordRegNum || '';
    dedSheet.getCell('J307').value = regForm.rentHousingType === '오피스텔' ? '6' : '1'; 
    dedSheet.getCell('O307').value = regForm.rentHousingSize ? Number(regForm.rentHousingSize) : '';
    dedSheet.getCell('S307').value = regForm.residentRegisterAddress || regForm.residentAddress || '';
    dedSheet.getCell('AA307').value = regForm.rentLeaseStart || '';
    dedSheet.getCell('AF307').value = regForm.rentLeaseEnd || '';
    
    const annualRent = (Number(regForm.monthlyRentFee) || 0) * 12;
    dedSheet.getCell('AH307').value = annualRent;
    
    const mainSalary = regForm.years && regForm.years[0] ? (Number(regForm.years[0].salaryTotal) || 0) : 0;
    const rate = mainSalary <= 55000000 ? 0.17 : 0.15;
    const limitRent = Math.min(annualRent, 10000000);
    const deductionAmt = Math.round(limitRent * rate);
    
    dedSheet.getCell('AM307').value = deductionAmt;
  }

  // 행 커밋 진행
  dedSheet.getRow(4).commit();
  dedSheet.getRow(5).commit();
  dedSheet.getRow(307).commit();
  for (let idx = 0; idx < dependentsList.length; idx++) {
    dedSheet.getRow(21 + (idx * 2)).commit();
  }

  await downloadWorkbook(deductionWb, `${cleanName}_2.소득세액공제신고서_월세명세포함.xlsx`);

  // ==========================================
  // [파일 3] 중소기업 취업자 소득세 감면 명세서
  // ==========================================
  showToast('3. 중소기업 감면명세서 파일 작성 중...', 'info');
  const resSme = await fetch('/중소기업 취업자 소득세 감면 대상 명세서.xlsx');
  if (!resSme.ok) throw new Error('중소기업 감면 명세서 템플릿 파일을 찾을 수 없습니다.');
  const smeBuf = await resSme.arrayBuffer();
  const smeWb = new ExcelJS.Workbook();
  await smeWb.xlsx.load(smeBuf);
  
  const smeSheet = smeWb.getWorksheet(1);
  if (!smeSheet) throw new Error('중소기업 감면 명세서의 첫 번째 시트를 찾지 못했습니다.');

  let companyName = '';
  const years = regForm.years || [];
  for (let i = years.length - 1; i >= 0; i--) {
    const yrData = years[i];
    if (yrData?.active && yrData.workPlace) {
      companyName = yrData.workPlace;
      break;
    }
  }
  if (!companyName && years.length > 0) {
    const lastItem = years[years.length - 1];
    companyName = lastItem.workPlace || '';
  }

  const rrnVal = regForm.foreignerNumber ? regForm.foreignerNumber.replace(/-/g, '').trim() : '';
  let birthYear = 0;
  let birthMonth = 0;
  let birthDay = 0;
  if (rrnVal.length >= 7) {
    const yy2 = Number(rrnVal.substring(0, 2));
    const mm2 = Number(rrnVal.substring(2, 4));
    const dd2 = Number(rrnVal.substring(4, 6));
    const genderChar = rrnVal.charAt(6);
    if (['1', '2', '5', '6'].includes(genderChar)) {
      birthYear = 1900 + yy2;
    } else if (['3', '4', '7', '8'].includes(genderChar)) {
      birthYear = 2000 + yy2;
    } else {
      birthYear = (yy2 > 30) ? 1900 + yy2 : 2000 + yy2;
    }
    birthMonth = mm2;
    birthDay = dd2;
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

  smeSheet.getCell('A11').value = regForm.name ? regForm.name.toUpperCase() : '';
  smeSheet.getCell('B11').value = regForm.foreignerNumber || '';
  smeSheet.getCell('C11').value = regForm.residentAddress || '';
  smeSheet.getCell('D11').value = '청년';
  smeSheet.getCell('E11').value = ageAtEmployment || '';
  smeSheet.getCell('H12').value = reductionStart || '';
  smeSheet.getCell('I12').value = reductionEnd || '';

  smeSheet.getCell('A22').value = `${yy}년         ${mm}월         ${dd}일`;
  smeSheet.getCell('A23').value = {
    richText: [
      { text: "원천징수의무자                  " },
      { font: { size: 10, bold: true, name: "돋움" }, text: companyName },
      { text: "                  " },
      { font: { size: 8, color: { argb: "FF7F7F7F" }, name: "돋움" }, text: "(서명 또는 인)" }
    ]
  };

  smeSheet.getRow(11).commit();
  smeSheet.getRow(12).commit();
  smeSheet.getRow(22).commit();
  smeSheet.getRow(23).commit();

  await downloadWorkbook(smeWb, `${cleanName}_3.중소기업취업자소득세감면대상명세서.xlsx`);
};
