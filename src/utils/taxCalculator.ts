
function cleanNum(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/,/g, '').trim();
  const parsed = Number(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper to determine youth tax reduction eligibility based on RRN and Employment Date
export const checkYouthEligibility = (rrnStr: string, empDateStr: string, yearsObj?: any) => {
  const rrn = rrnStr ? rrnStr.replace(/-/g, '').trim() : '';
  let employmentDateStr = empDateStr ? empDateStr.trim() : '';

  if (!employmentDateStr && yearsObj) {
    const periods = Object.values(yearsObj || {})
      .map((y: any) => y.workPeriod)
      .filter((wp: string) => wp && wp.includes('~'))
      .map((wp: string) => wp.split('~')[0].trim())
      .filter((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
    if (periods.length > 0) {
      employmentDateStr = periods[0];
    }
  }

  if (!employmentDateStr) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    employmentDateStr = `${yyyy}-${mm}-${dd}`;
  }

  if (!rrn || rrn.length < 7) {
    return { isEligible: true, age: null }; // Default to true if RRN is not fully entered
  }

  const yy = rrn.substring(0, 2);
  const mm = rrn.substring(2, 4);
  const dd = rrn.substring(4, 6);
  const genderDigit = rrn.charAt(6);

  let century = '19';
  if (genderDigit === '1' || genderDigit === '2' || genderDigit === '5' || genderDigit === '6') {
    century = '19';
  } else if (genderDigit === '3' || genderDigit === '4' || genderDigit === '7' || genderDigit === '8') {
    century = '20';
  } else if (genderDigit === '9' || genderDigit === '0') {
    century = '18';
  } else {
    century = Number(yy) > 26 ? '19' : '20';
  }

  const birthYear = parseInt(`${century}${yy}`, 10);
  const birthMonth = parseInt(mm, 10);
  const birthDay = parseInt(dd, 10);

  const empParts = employmentDateStr.split('-');
  if (empParts.length !== 3) {
    return { isEligible: true, age: null };
  }
  const empYear = parseInt(empParts[0], 10);
  const empMonth = parseInt(empParts[1], 10);
  const empDay = parseInt(empParts[2], 10);

  let age = empYear - birthYear;
  if (empMonth < birthMonth || (empMonth === birthMonth && empDay < birthDay)) {
    age--;
  }

  const isEligible = age >= 15 && age <= 34;
  return { isEligible, age };
};

// 월세 세액공제 계산 엔진
export const calculateRentDeduction = (yrData: any, formObj: any) => {
  if (!formObj || formObj.isMonthlyRent !== '가' || formObj.rentAllHouseholdsNoHouse !== '가') {
    return 0;
  }
  
  const totalSalary = cleanNum(yrData.salaryTotal);
  // 연봉 요건: 총급여 8,000만 원 이하
  if (totalSalary <= 0 || totalSalary > 80000000) {
    return 0;
  }

  // 공제율 설정: 총급여 5,500만 원 이하 17% / 8,000만 원 이하 15%
  const rate = totalSalary <= 55000000 ? 0.17 : 0.15;
  const monthlyRent = Number(formObj.monthlyRentFee) || 0;
  const annualPaid = monthlyRent * 12;
  // 공제대상 한도: 연간 최대 1,000만 원
  const limitAmount = Math.min(annualPaid, 10000000);
  
  return Math.round(limitAmount * rate);
};

// Pure tax calculator formula engine
export const recalculateYearData = (
  yrData: any, 
  depCount: number, 
  senCount: number, 
  disCount: number, 
  chCount: number, 
  feeRate: number,
  rrn: string,
  empDate: string,
  formObj?: any
) => {
  if (!yrData || (!yrData.active && !yrData.isFileUploaded)) return yrData;

  const eligibility = checkYouthEligibility(rrn, empDate);

  const originalDecisionTax = cleanNum(yrData.decisionTax);
  const originalLocalTax = cleanNum(yrData.localTax) || Math.round(originalDecisionTax * 0.1);
  const calculatedTax = cleanNum(yrData.taxBase);
  const childDeduction = cleanNum(yrData.childDeduction);

  const isReductionApplied = eligibility.isEligible && yrData.childReductionApply !== 'N' && yrData.childReductionApply !== '0';
  const yrNum = Number(yrData.year) || 0;
  const limit = yrNum >= 2023 ? 2000000 : 1500000;
  const reductionAmt = isReductionApplied ? Math.min(limit, Math.round(calculatedTax * 0.9)) : 0;
  
  // 부양가족 소득공제 (인당 150만, 경로우대 +100만, 장애인 +200만)
  const extraIncomeDeduction = (depCount * 1500000) + (senCount * 1000000) + (disCount * 2000000);
  // 소득공제에 따른 세액 절감액 (기본 6% 적용)
  const extraTaxReductionFromDeduction = Math.round(extraIncomeDeduction * 0.06);

  // 자녀 세액공제 (인당 15만 원)
  const extraChildTaxCredit = chCount * 150000;


  const remainingTaxAfterReduction = Math.max(0, calculatedTax - reductionAmt - extraTaxReductionFromDeduction);
  const changedChildDeduction = calculatedTax > 0 ? Math.round(childDeduction * (remainingTaxAfterReduction / calculatedTax)) : 0;

  // 월세 차감 전 결정세액 (부양가족 공제 등까지만 차감)
  const changedDecisionTaxWithoutRent = Math.max(0, remainingTaxAfterReduction - changedChildDeduction - extraChildTaxCredit);

  // 월세 세액공제 계산
  const rentDeductionAmt = calculateRentDeduction(yrData, formObj);

  // 월세 차감 후 최종 결정세액
  const changedDecisionTax = Math.max(0, changedDecisionTaxWithoutRent - rentDeductionAmt);
  const changedLocalTax = Math.round(changedDecisionTax * 0.1);

  // 순수 월세로 인한 국세/지방세 환급액 계산 (월세 적용 전 결정세액 - 적용 후 결정세액)
  const rentRefundNational = Math.max(0, changedDecisionTaxWithoutRent - changedDecisionTax);
  const rentRefundLocal = Math.max(0, Math.round(changedDecisionTaxWithoutRent * 0.1) - changedLocalTax);
  const rentRefundTotal = rentRefundNational + rentRefundLocal;

  // 월세를 제외한 순수 근로소득 환급금
  const refundNational = Math.max(0, originalDecisionTax - changedDecisionTaxWithoutRent);
  const refundLocal = Math.max(0, originalLocalTax - Math.round(changedDecisionTaxWithoutRent * 0.1));
  
  // 월세까지 포함한 최종 환급액
  const finalRefundNational = Math.max(0, originalDecisionTax - changedDecisionTax);
  const finalRefundLocal = Math.max(0, originalLocalTax - changedLocalTax);

  const isOverridden = Boolean(yrData.isRefundOverridden);
  const finalRefundNatVal = isOverridden ? String(yrData.refundExpectNational || 0) : String(refundNational);
  const finalRefundLocVal = isOverridden ? String(yrData.refundExpectLocal || 0) : String(refundLocal);
  const finalTotalCourtFee = isOverridden
    ? (Number(yrData.courtFee) || (Number(finalRefundNatVal) + Number(finalRefundLocVal)))
    : (finalRefundNational + finalRefundLocal);
  const expectedFee = isOverridden
    ? (Number(yrData.expectedFeeAmt) || Math.round(finalTotalCourtFee * (feeRate / 100)))
    : Math.round(finalTotalCourtFee * (feeRate / 100));

  // Calculate extra refund generated purely by dependent family deductions
  const remainingWithoutDeps = Math.max(0, calculatedTax - reductionAmt);
  const childDeductionWithoutDeps = calculatedTax > 0 ? Math.round(childDeduction * (remainingWithoutDeps / calculatedTax)) : 0;
  const decisionTaxWithoutDeps = Math.max(0, remainingWithoutDeps - childDeductionWithoutDeps);
  const refundNationalWithoutDeps = Math.max(0, originalDecisionTax - decisionTaxWithoutDeps);
  const refundLocalWithoutDeps = Math.max(0, originalLocalTax - Math.round(decisionTaxWithoutDeps * 0.1));
  const totalRefundWithoutDeps = refundNationalWithoutDeps + refundLocalWithoutDeps;

  const dependentRefundTotal = Math.max(0, finalTotalCourtFee - totalRefundWithoutDeps - rentRefundTotal);

  return {
    ...yrData,
    childReductionApplyAmt: String(reductionAmt),
    childDeductionApplyAmt: String(changedChildDeduction + extraChildTaxCredit),
    decisionTaxApplyAmt: String(changedDecisionTax),
    localTaxApplyAmt: String(changedLocalTax),
    decisionTaxRefundAmt: String(changedDecisionTax + changedLocalTax),
    refundExpectNational: finalRefundNatVal,
    refundExpectLocal: finalRefundLocVal,
    rentRefundTotal: String(rentRefundTotal),
    rentRefundExpectNational: String(rentRefundNational),
    rentRefundExpectLocal: String(rentRefundLocal),
    courtFee: String(finalTotalCourtFee),
    expectedFeeAmt: String(expectedFee),
    dependentRefundTotal: String(dependentRefundTotal)
  };
};
