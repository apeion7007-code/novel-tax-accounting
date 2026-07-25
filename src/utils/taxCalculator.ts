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

// Pure tax calculator formula engine
export const recalculateYearData = (
  yrData: any, 
  depCount: number, 
  senCount: number, 
  disCount: number, 
  chCount: number, 
  feeRate: number,
  rrn: string,
  empDate: string
) => {
  if (!yrData || (!yrData.active && !yrData.isFileUploaded)) return yrData;

  const eligibility = checkYouthEligibility(rrn, empDate);

  const originalDecisionTax = Number(yrData.decisionTax) || 0;
  const originalLocalTax = Number(yrData.localTax) || 0;
  const calculatedTax = Number(yrData.taxBase) || 0;
  const childDeduction = Number(yrData.childDeduction) || 0;

  const isReductionApplied = eligibility.isEligible && yrData.childReductionApply !== 'N' && yrData.childReductionApply !== '0';
  const reductionAmt = isReductionApplied ? Math.min(1500000, Math.round(calculatedTax * 0.9)) : 0;
  
  // 부양가족 소득공제 (인당 150만, 경로우대 +100만, 장애인 +200만)
  const extraIncomeDeduction = (depCount * 1500000) + (senCount * 1000000) + (disCount * 2000000);
  // 소득공제에 따른 세액 절감액 (기본 6% 적용)
  const extraTaxReductionFromDeduction = Math.round(extraIncomeDeduction * 0.06);

  // 자녀 세액공제 (인당 15만 원)
  const extraChildTaxCredit = chCount * 150000;

  const remainingTaxAfterReduction = Math.max(0, calculatedTax - reductionAmt - extraTaxReductionFromDeduction);
  const changedChildDeduction = calculatedTax > 0 ? Math.round(childDeduction * (remainingTaxAfterReduction / calculatedTax)) : 0;

  const changedDecisionTax = Math.max(0, remainingTaxAfterReduction - changedChildDeduction - extraChildTaxCredit);
  const changedLocalTax = Math.round(changedDecisionTax * 0.1);

  const refundNational = Math.max(0, originalDecisionTax - changedDecisionTax);
  const refundLocal = Math.max(0, originalLocalTax - changedLocalTax);
  const totalCourtFee = refundNational + refundLocal;
  const expectedFee = Math.round(totalCourtFee * (feeRate / 100));

  // Calculate extra refund generated purely by dependent family deductions
  const remainingWithoutDeps = Math.max(0, calculatedTax - reductionAmt);
  const childDeductionWithoutDeps = calculatedTax > 0 ? Math.round(childDeduction * (remainingWithoutDeps / calculatedTax)) : 0;
  const decisionTaxWithoutDeps = Math.max(0, remainingWithoutDeps - childDeductionWithoutDeps);
  const refundNationalWithoutDeps = Math.max(0, originalDecisionTax - decisionTaxWithoutDeps);
  const refundLocalWithoutDeps = Math.max(0, originalLocalTax - Math.round(decisionTaxWithoutDeps * 0.1));
  const totalRefundWithoutDeps = refundNationalWithoutDeps + refundLocalWithoutDeps;

  const dependentRefundTotal = Math.max(0, totalCourtFee - totalRefundWithoutDeps);

  return {
    ...yrData,
    childReductionApplyAmt: String(reductionAmt),
    childDeductionApplyAmt: String(changedChildDeduction + extraChildTaxCredit),
    decisionTaxApplyAmt: String(changedDecisionTax),
    localTaxApplyAmt: String(changedLocalTax),
    decisionTaxRefundAmt: String(changedDecisionTax + changedLocalTax),
    refundExpectNational: String(refundNational),
    refundExpectLocal: String(refundLocal),
    courtFee: String(totalCourtFee),
    expectedFeeAmt: String(expectedFee),
    dependentRefundTotal: String(dependentRefundTotal)
  };
};
