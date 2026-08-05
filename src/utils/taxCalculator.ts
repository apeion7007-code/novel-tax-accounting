
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

// Earned Income Deduction (근로소득공제)
export const getEarnedIncomeDeduction = (salary: number): number => {
  if (salary <= 5000000) return salary * 0.70;
  if (salary <= 15000000) return 3500000 + (salary - 5000000) * 0.40;
  if (salary <= 45000000) return 7500000 + (salary - 15000000) * 0.15;
  if (salary <= 100000000) return 12000000 + (salary - 45000000) * 0.05;
  return 14750000 + (salary - 100000000) * 0.02;
};

// Earned Income Tax Credit (근로소득세액공제)
export const getEarnedIncomeCredit = (calcTax: number, salary: number): number => {
  let baseCredit = 0;
  if (calcTax <= 1300000) {
    baseCredit = calcTax * 0.55;
  } else {
    baseCredit = 715000 + (calcTax - 1300000) * 0.30;
  }

  let limit = 740000;
  if (salary <= 33000000) {
    limit = 740000;
  } else if (salary <= 70000000) {
    limit = Math.max(660000, 740000 - (salary - 33000000) * 0.008);
  } else {
    limit = Math.max(500000, 660000 - (salary - 70000000) * 0.5);
  }

  return Math.min(baseCredit, limit);
};

// Income tax to taxable income inverse function
export const deriveTaxableIncome = (calcTax: number): number => {
  if (calcTax <= 840000) return calcTax / 0.06;
  if (calcTax <= 6240000) return (calcTax + 1260000) / 0.15;
  return (calcTax + 5760000) / 0.24;
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

  const yrStr = String(yrData.year);
  const sameYearWages = formObj?.years 
    ? formObj.years.filter((y: any) => String(y.year) === yrStr && (y.active || y.isFileUploaded)) 
    : [];

  if (sameYearWages.length > 1) {
    const sortedWages = [...sameYearWages].sort((a, b) => cleanNum(b.salaryTotal || b.netSalary) - cleanNum(a.salaryTotal || a.netSalary));
    const isPrimary = sortedWages[0]?.id === yrData.id;

    if (isPrimary) {
      let wagePaidTax = 0;
      let wagePaidLocalTax = 0;
      let childReductionApply = 'Y';

      sameYearWages.forEach((y: any) => {
        const origDec = cleanNum(y.decisionTax || y.originalDeterminedTax);
        wagePaidTax += origDec;
        wagePaidLocalTax += cleanNum(y.localTax) || Math.round(origDec * 0.1);
        if (y.childReductionApply === 'N' || y.childReductionApply === '0') {
          childReductionApply = 'N';
        }
      });

      let totalDeductionsSum = 0;
      sameYearWages.forEach((y: any) => {
        const salary = cleanNum(y.salaryTotal);
        const taxBase = cleanNum(y.taxBase);
        if (taxBase > 0) {
          const derivedTaxable = deriveTaxableIncome(taxBase);
          const eDeduction = getEarnedIncomeDeduction(salary);
          const eAmount = salary - eDeduction;
          const deductions = Math.max(0, eAmount - derivedTaxable);
          totalDeductionsSum += deductions;
        } else {
          // Estimate deductions for secondary job with taxBase 0 (include health/pension approx)
          const deductions = 1500000 + salary * 0.041;
          totalDeductionsSum += deductions;
        }
      });

      const combinedDeductions = Math.max(0, totalDeductionsSum - 1500000);

      const totalSalary = sameYearWages.reduce((sum: number, y: any) => sum + cleanNum(y.salaryTotal), 0);
      const combinedEDeduction = getEarnedIncomeDeduction(totalSalary);
      const combinedEAmount = totalSalary - combinedEDeduction;

      const combinedTaxable = Math.max(0, combinedEAmount - combinedDeductions);

      let combinedCalcTax = 0;
      if (combinedTaxable <= 14000000) {
        combinedCalcTax = combinedTaxable * 0.06;
      } else if (combinedTaxable <= 50000000) {
        combinedCalcTax = combinedTaxable * 0.15 - 1260000;
      } else {
        combinedCalcTax = combinedTaxable * 0.24 - 5760000;
      }
      combinedCalcTax = Math.max(0, Math.round(combinedCalcTax));

      const isReductionApplied = childReductionApply !== 'N' && childReductionApply !== '0';
      const yrNum = Number(yrStr) || 0;
      const limit = yrNum >= 2023 ? 2000000 : 1500000;
      const reductionAmt = isReductionApplied ? Math.min(limit, Math.round(combinedCalcTax * 0.9)) : 0;

      const remainingTaxAfterReduction = Math.max(0, combinedCalcTax - reductionAmt);

      const combinedChildDeduction = getEarnedIncomeCredit(combinedCalcTax, totalSalary);
      const changedChildDeduction = combinedCalcTax > 0 ? Math.round(combinedChildDeduction * (remainingTaxAfterReduction / combinedCalcTax)) : 0;

      const combinedDecisionTax = Math.max(0, remainingTaxAfterReduction - changedChildDeduction);
      const combinedLocalTax = Math.round(combinedDecisionTax * 0.1);

      const isOverridden = Boolean(yrData.isRefundOverridden);
      const refundNational = isOverridden ? Math.max(0, cleanNum(yrData.refundExpectNational)) : Math.max(0, wagePaidTax - combinedDecisionTax);
      const refundLocal = isOverridden ? Math.max(0, cleanNum(yrData.refundExpectLocal)) : Math.max(0, wagePaidLocalTax - combinedLocalTax);
      const courtFee = refundNational + refundLocal;
      const expectedFee = Math.round(courtFee * (feeRate / 100));

      return {
        ...yrData,
        childReductionApplyAmt: String(reductionAmt),
        childDeductionApplyAmt: String(changedChildDeduction),
        decisionTaxApplyAmt: String(combinedDecisionTax),
        localTaxApplyAmt: String(combinedLocalTax),
        decisionTaxRefundAmt: String(combinedDecisionTax + combinedLocalTax),
        refundExpectNational: String(refundNational),
        refundExpectLocal: String(refundLocal),
        courtFee: String(courtFee),
        expectedFeeAmt: String(expectedFee),
        dependentRefundTotal: '0'
      };
    } else {
      const isOverridden = Boolean(yrData.isRefundOverridden);
      const refundNational = isOverridden ? Math.max(0, cleanNum(yrData.refundExpectNational)) : 0;
      const refundLocal = isOverridden ? Math.max(0, cleanNum(yrData.refundExpectLocal)) : 0;
      const courtFee = refundNational + refundLocal;
      const expectedFee = Math.round(courtFee * (feeRate / 100));

      return {
        ...yrData,
        childReductionApplyAmt: '0',
        childDeductionApplyAmt: '0',
        decisionTaxApplyAmt: '0',
        localTaxApplyAmt: '0',
        decisionTaxRefundAmt: '0',
        refundExpectNational: String(refundNational),
        refundExpectLocal: String(refundLocal),
        courtFee: String(courtFee),
        expectedFeeAmt: String(expectedFee),
        dependentRefundTotal: '0'
      };
    }
  }

  const eligibility = checkYouthEligibility(rrn, empDate);

  const finalDepCount = yrData.dependentsCount !== undefined && yrData.dependentsCount !== null ? Number(yrData.dependentsCount) : depCount;
  const finalSenCount = yrData.seniorCount !== undefined && yrData.seniorCount !== null ? Number(yrData.seniorCount) : senCount;
  const finalDisCount = yrData.disabledCount !== undefined && yrData.disabledCount !== null ? Number(yrData.disabledCount) : disCount;
  const finalChCount = yrData.childCount !== undefined && yrData.childCount !== null ? Number(yrData.childCount) : chCount;

  const originalDecisionTax = cleanNum(yrData.decisionTax);
  const originalLocalTax = cleanNum(yrData.localTax) || Math.round(originalDecisionTax * 0.1);
  const calculatedTax = cleanNum(yrData.taxBase);
  const childDeduction = cleanNum(yrData.childDeduction);
  const parsedStdTaxCredit = cleanNum(yrData.stdTaxCredit);
  const calculatedTotalCredit = Math.max(0, calculatedTax - originalDecisionTax - cleanNum(yrData.childReduction));
  const stdTaxCredit = parsedStdTaxCredit || Math.max(0, calculatedTotalCredit - childDeduction);

  const isReductionApplied = eligibility.isEligible && yrData.childReductionApply !== 'N' && yrData.childReductionApply !== '0';
  const yrNum = Number(yrData.year) || 0;
  const limit = yrNum >= 2023 ? 2000000 : 1500000;
  const reductionAmt = isReductionApplied ? Math.min(limit, Math.round(calculatedTax * 0.9)) : 0;
  
  // 부양가족 소득공제 (인당 150만, 경로우대 +100만, 장애인 +200만)
  const extraIncomeDeduction = (finalDepCount * 1500000) + (finalSenCount * 1000000) + (finalDisCount * 2000000);
  // 소득공제에 따른 세액 절감액 (기본 6% 적용)
  const extraTaxReductionFromDeduction = Math.round(extraIncomeDeduction * 0.06);

  // 자녀 세액공제 계산 (연도별 및 자녀 수에 따른 세법 기준 적용)
  let extraChildTaxCredit = 0;
  if (finalChCount > 0) {
    if (yrNum >= 2024) {
      if (finalChCount === 1) {
        extraChildTaxCredit = 250000;
      } else if (finalChCount === 2) {
        extraChildTaxCredit = 550000;
      } else {
        extraChildTaxCredit = 550000 + (finalChCount - 2) * 400000;
      }
    } else {
      if (finalChCount === 1) {
        extraChildTaxCredit = 150000;
      } else if (finalChCount === 2) {
        extraChildTaxCredit = 300000;
      } else {
        extraChildTaxCredit = 300000 + (finalChCount - 2) * 300000;
      }
    }
  }


  const remainingTaxAfterReduction = Math.max(0, calculatedTax - reductionAmt - extraTaxReductionFromDeduction);
  const changedChildDeduction = calculatedTax > 0 ? Math.round(childDeduction * (remainingTaxAfterReduction / calculatedTax)) : 0;

  // 월세 차감 전 결정세액 (부양가족 공제 및 표준/기타 세액공제까지 차감)
  const changedDecisionTaxWithoutRent = Math.max(0, remainingTaxAfterReduction - changedChildDeduction - extraChildTaxCredit - stdTaxCredit);

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
    childDeductionApplyAmt: String(changedChildDeduction + extraChildTaxCredit + stdTaxCredit),
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
