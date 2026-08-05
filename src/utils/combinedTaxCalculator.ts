
function cleanNum(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/,/g, '').trim();
  const parsed = Number(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

import type { RegistrationForm } from '../types/tax';
import { getEarnedIncomeDeduction, getEarnedIncomeCredit, deriveTaxableIncome } from './taxCalculator';

export interface CombinedRefundResult {
  wageFreeRefund: number;
  rentRefund: number;
  finalRefund: number;
  fee: number;
  nationalRefund: number;
  localRefund: number;
  combinedCalcTax: number;
  combinedDecisionTax: number;
  originalCalcTax: number;
  originalDecisionTax: number;
  originalTaxable: number;
  combinedTaxable: number;
}

export const calculateCombinedRefund = (
  regForm: Partial<RegistrationForm>,
  yr: string,
  selectedFeeRate: number
): CombinedRefundResult => {
  const matchingWageDataList = (regForm.years || []).filter((y: any) => String(y.year) === yr && y.active);
  const freeData = regForm.freelancerYears?.[yr];

  const hasWage = matchingWageDataList.length > 0;
  const hasFree = freeData?.active;

  if (!hasWage && !hasFree) {
    return {
      wageFreeRefund: 0,
      rentRefund: 0,
      finalRefund: 0,
      fee: 0,
      nationalRefund: 0,
      localRefund: 0,
      combinedCalcTax: 0,
      combinedDecisionTax: 0,
      originalCalcTax: 0,
      originalDecisionTax: 0,
      originalTaxable: 0,
      combinedTaxable: 0
    };
  }
  
  // Case 1: Only wage active
  if (hasWage && !hasFree) {
    if (matchingWageDataList.length === 1) {
      const yrData = matchingWageDataList[0];
      const natRefund = cleanNum(yrData.refundExpectNational || yrData.expectedRefundNational);
      const locRefund = cleanNum(yrData.refundExpectLocal || yrData.expectedRefundLocal);
      const wageFreeRefund = natRefund + locRefund;
      
      let yrRentRefund = Number(yrData.rentRefundTotal) || 0;
      let rentRefundNational = 0;
      let rentRefundLocal = 0;

      if (!yrRentRefund && (regForm.isMonthlyRent === 'ga' || regForm.isMonthlyRent === '가') && regForm.rentAllHouseholdsNoHouse === '가' && regForm.monthlyRentFee) {
        const totalSalary = cleanNum(yrData.salaryTotal || yrData.totalSalary);
        const rate = totalSalary <= 55000000 ? 0.17 : (totalSalary <= 80000000 ? 0.15 : 0);
        const rentLimit = Math.min(Number(regForm.monthlyRentFee) * 12, 10000000);
        const rentDeduction = Math.round(rentLimit * rate);
        
        const originalDecisionTax = cleanNum(yrData.decisionTax || yrData.originalDeterminedTax);
        const refundNational = cleanNum(yrData.refundExpectNational || yrData.expectedRefundNational);
        const remainingDecisionTax = Math.max(0, originalDecisionTax - refundNational);
        
        rentRefundNational = Math.min(rentDeduction, remainingDecisionTax);
        rentRefundLocal = Math.round(rentRefundNational * 0.1);
        yrRentRefund = rentRefundNational + rentRefundLocal;
      } else {
        rentRefundNational = cleanNum(yrData.rentRefundExpectNational);
        rentRefundLocal = cleanNum(yrData.rentRefundExpectLocal);
      }
      
      const rentRefund = (regForm.isMonthlyRent === 'ga' || regForm.isMonthlyRent === '가' ? yrRentRefund : 0) || 0;
      const finalRefund = wageFreeRefund + rentRefund;
      const fee = finalRefund > 0 ? Math.round(finalRefund * (selectedFeeRate / 100)) : 0;
      const originalTaxable = deriveTaxableIncome(cleanNum(yrData.taxBase));
      const depCount = Number(regForm.dependentsCount) || 0;
      const senCount = Number(regForm.seniorCount) || 0;
      const disCount = Number(regForm.disabledCount) || 0;
      const extraIncomeDeduction = (depCount * 1500000) + (senCount * 1000000) + (disCount * 2000000);
      const combinedTaxable = Math.max(0, originalTaxable - extraIncomeDeduction);

      return {
        wageFreeRefund,
        rentRefund,
        finalRefund,
        fee,
        nationalRefund: natRefund + (regForm.isMonthlyRent === 'ga' || regForm.isMonthlyRent === '가' ? rentRefundNational : 0),
        localRefund: locRefund + (regForm.isMonthlyRent === 'ga' || regForm.isMonthlyRent === '가' ? rentRefundLocal : 0),
        combinedCalcTax: cleanNum(yrData.taxBase),
        combinedDecisionTax: cleanNum(yrData.decisionTaxApplyAmt),
        originalCalcTax: cleanNum(yrData.taxBase),
        originalDecisionTax: cleanNum(yrData.decisionTax || yrData.originalDeterminedTax),
        originalTaxable,
        combinedTaxable
      };
    } else {
      // Multiple wages -> Combined progressive calculation
      let wageCalcTax = 0;
      let wagePaidTax = 0;
      let wagePaidLocalTax = 0;
      let childReductionApply = 'Y';

      matchingWageDataList.forEach((yrData: any) => {
        const origDecTax = cleanNum(yrData.decisionTax || yrData.originalDeterminedTax);
        wageCalcTax += cleanNum(yrData.taxBase);
        wagePaidTax += origDecTax;
        wagePaidLocalTax += cleanNum(yrData.localTax) || Math.round(origDecTax * 0.1);
        if (yrData.childReductionApply === 'N' || yrData.childReductionApply === '0') {
          childReductionApply = 'N';
        }
      });

      const wageTaxables = matchingWageDataList.map((y: any) => deriveTaxableIncome(cleanNum(y.taxBase)));
      const originalTaxable = wageTaxables.reduce((a: number, b: number) => a + b, 0);

      let totalDeductionsSum = 0;
      matchingWageDataList.forEach((yrData: any) => {
        const salary = cleanNum(yrData.salaryTotal);
        const taxBase = cleanNum(yrData.taxBase);
        if (taxBase > 0) {
          const derivedTaxable = deriveTaxableIncome(taxBase);
          const eDeduction = getEarnedIncomeDeduction(salary);
          const eAmount = salary - eDeduction;
          const deductions = Math.max(0, eAmount - derivedTaxable);
          totalDeductionsSum += deductions;
        } else {
          // Estimate deductions for secondary job with taxBase 0
          const deductions = 1500000 + salary * 0.041;
          totalDeductionsSum += deductions;
        }
      });

      const combinedDeductions = Math.max(0, totalDeductionsSum - 1500000);

      const totalSalary = matchingWageDataList.reduce((sum: number, y: any) => sum + cleanNum(y.salaryTotal), 0);
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
      const yrNum = Number(yr) || 0;
      const limit = yrNum >= 2023 ? 2000000 : 1500000;
      const reductionAmt = isReductionApplied ? Math.min(limit, Math.round(combinedCalcTax * 0.9)) : 0;

      const remainingTaxAfterReduction = Math.max(0, combinedCalcTax - reductionAmt);

      const combinedChildDeduction = getEarnedIncomeCredit(combinedCalcTax, totalSalary);
      const changedChildDeduction = combinedCalcTax > 0 ? Math.round(combinedChildDeduction * (remainingTaxAfterReduction / combinedCalcTax)) : 0;

      const combinedDecisionTax = Math.max(0, remainingTaxAfterReduction - changedChildDeduction);

      let rentDeductionAmt = 0;
      if ((regForm.isMonthlyRent === 'ga' || regForm.isMonthlyRent === '가') && regForm.rentAllHouseholdsNoHouse === '가' && regForm.monthlyRentFee) {
        const totalSalary = matchingWageDataList.reduce((sum: number, y: any) => sum + cleanNum(y.salaryTotal), 0);
        const rate = totalSalary <= 55000000 ? 0.17 : (totalSalary <= 80000000 ? 0.15 : 0);
        const rentLimit = Math.min(Number(regForm.monthlyRentFee) * 12, 10000000);
        rentDeductionAmt = Math.round(rentLimit * rate);
      }

      const finalDecisionTax = Math.max(0, combinedDecisionTax - rentDeductionAmt);
      const finalLocalTax = Math.round(finalDecisionTax * 0.1);

      const refundNational = wagePaidTax - combinedDecisionTax;
      const refundLocal = wagePaidLocalTax - Math.round(combinedDecisionTax * 0.1);
      const wageFreeRefund = refundNational + refundLocal;

      const finalRefundNational = (wagePaidTax - finalDecisionTax);
      const finalRefundLocal = (wagePaidLocalTax - finalLocalTax);
      const finalRefund = finalRefundNational + finalRefundLocal;

      const rentRefund = Math.max(0, finalRefund - wageFreeRefund);
      const fee = finalRefund > 0 ? Math.round(finalRefund * (selectedFeeRate / 100)) : 0;

      return {
        wageFreeRefund,
        rentRefund,
        finalRefund,
        fee,
        nationalRefund: finalRefundNational,
        localRefund: finalRefundLocal,
        combinedCalcTax: combinedCalcTax,
        combinedDecisionTax: finalDecisionTax,
        originalCalcTax: wageCalcTax,
        originalDecisionTax: wagePaidTax,
        originalTaxable: Math.round(originalTaxable),
        combinedTaxable: Math.round(combinedTaxable)
      };
    }
  }

  // Case 2: Only freelancer active
  if (!hasWage && hasFree) {
    const natRefund = cleanNum(freeData.refundExpectNational);
    const locRefund = cleanNum(freeData.refundExpectLocal);
    const wageFreeRefund = natRefund + locRefund;
    const rentRefund = 0;
    const finalRefund = wageFreeRefund;
    const fee = Math.round(finalRefund * (selectedFeeRate / 100));
    const freeIncome = cleanNum(freeData.totalIncome);
    const combinedTaxable = Math.max(0, freeIncome * 0.359);
    return {
      wageFreeRefund,
      rentRefund,
      finalRefund,
      fee,
      nationalRefund: natRefund,
      localRefund: locRefund,
      combinedCalcTax: 0,
      combinedDecisionTax: 0,
      originalCalcTax: 0,
      originalDecisionTax: 0,
      originalTaxable: 0,
      combinedTaxable
    };
  }

  // Case 3: Both active -> Combined tax calculation
  let wageCalcTax = 0;
  let wagePaidTax = 0;
  let wagePaidLocalTax = 0;
  let childDeduction = 0;
  let childReductionApply = 'Y';
  
  matchingWageDataList.forEach((yrData: any) => {
    const origDecTax = cleanNum(yrData.decisionTax);
    wageCalcTax += cleanNum(yrData.taxBase);
    wagePaidTax += origDecTax;
    wagePaidLocalTax += cleanNum(yrData.localTax) || Math.round(origDecTax * 0.1);
    childDeduction += cleanNum(yrData.childDeduction);
    if (yrData.childReductionApply === 'N' || yrData.childReductionApply === '0') {
      childReductionApply = 'N';
    }
  });

  const freeIncome = cleanNum(freeData?.totalIncome);

  let wageTaxable = 0;
  if (matchingWageDataList.length > 1) {
    let totalDeductionsSum = 0;
    matchingWageDataList.forEach((yrData: any) => {
      const salary = cleanNum(yrData.salaryTotal);
      const taxBase = cleanNum(yrData.taxBase);
      if (taxBase > 0) {
        const derivedTaxable = deriveTaxableIncome(taxBase);
        const eDeduction = getEarnedIncomeDeduction(salary);
        const eAmount = salary - eDeduction;
        const deductions = Math.max(0, eAmount - derivedTaxable);
        totalDeductionsSum += deductions;
      } else {
        // Estimate deductions for secondary job with taxBase 0
        const deductions = 1500000 + salary * 0.041;
        totalDeductionsSum += deductions;
      }
    });

    const combinedDeductions = Math.max(0, totalDeductionsSum - 1500000);

    const totalSalary = matchingWageDataList.reduce((sum: number, y: any) => sum + cleanNum(y.salaryTotal), 0);
    const combinedEDeduction = getEarnedIncomeDeduction(totalSalary);
    const combinedEAmount = totalSalary - combinedEDeduction;

    wageTaxable = Math.max(0, combinedEAmount - combinedDeductions);
  } else {
    wageTaxable = deriveTaxableIncome(wageCalcTax);
  }

  const freeTaxable = freeIncome * 0.359;
  const combinedTaxable = wageTaxable + freeTaxable;
  
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
  const yrNum = Number(yr) || 0;
  const limit = yrNum >= 2023 ? 2000000 : 1500000;
  const reductionAmt = isReductionApplied ? Math.min(limit, Math.round(combinedCalcTax * 0.9)) : 0;

  const depCount = Number(regForm.dependentsCount) || 0;
  const senCount = Number(regForm.seniorCount) || 0;
  const disCount = Number(regForm.disabledCount) || 0;
  const chCount = Number(regForm.childCount) || 0;

  const extraIncomeDeduction = (depCount * 1500000) + (senCount * 1000000) + (disCount * 2000000);
  const extraTaxReductionFromDeduction = Math.round(extraIncomeDeduction * 0.06);
  // 자녀 세액공제 계산 (연도별 및 자녀 수에 따른 세법 기준 적용)
  let extraChildTaxCredit = 0;
  if (chCount > 0) {
    if (yrNum >= 2024) {
      if (chCount === 1) {
        extraChildTaxCredit = 250000;
      } else if (chCount === 2) {
        extraChildTaxCredit = 550000;
      } else {
        extraChildTaxCredit = 550000 + (chCount - 2) * 400000;
      }
    } else {
      if (chCount === 1) {
        extraChildTaxCredit = 150000;
      } else if (chCount === 2) {
        extraChildTaxCredit = 300000;
      } else {
        extraChildTaxCredit = 300000 + (chCount - 2) * 300000;
      }
    }
  }

  const remainingTaxAfterReduction = Math.max(0, combinedCalcTax - reductionAmt - extraTaxReductionFromDeduction);
  
  let combinedChildDeduction = 0;
  if (matchingWageDataList.length > 1) {
    const totalSalary = matchingWageDataList.reduce((sum: number, y: any) => sum + cleanNum(y.salaryTotal), 0);
    combinedChildDeduction = getEarnedIncomeCredit(combinedCalcTax, totalSalary);
  } else {
    combinedChildDeduction = childDeduction;
  }

  const changedChildDeduction = combinedCalcTax > 0 ? Math.round(combinedChildDeduction * (remainingTaxAfterReduction / combinedCalcTax)) : 0;

  const combinedDecisionTax = Math.max(0, remainingTaxAfterReduction - changedChildDeduction - extraChildTaxCredit);
  
  // Calculate rent deduction
  let rentDeductionAmt = 0;
  if (regForm.isMonthlyRent === '가' && regForm.rentAllHouseholdsNoHouse === '가' && regForm.monthlyRentFee) {
    const firstWage = matchingWageDataList[0];
    if (firstWage) {
      const totalSalary = cleanNum(firstWage.salaryTotal);
      const rate = totalSalary <= 55000000 ? 0.17 : (totalSalary <= 80000000 ? 0.15 : 0);
      const rentLimit = Math.min(Number(regForm.monthlyRentFee) * 12, 10000000);
      rentDeductionAmt = Math.round(rentLimit * rate);
    }
  }

  const finalDecisionTax = Math.max(0, combinedDecisionTax - rentDeductionAmt);
  const finalLocalTax = Math.round(finalDecisionTax * 0.1);

  const freePaidTax = cleanNum(freeData?.withholdingTax3);
  const freePaidLocalTax = cleanNum(freeData?.localTax03);

  const refundNational = Math.max(0, (wagePaidTax + freePaidTax) - combinedDecisionTax);
  const refundLocal = Math.max(0, (wagePaidLocalTax + freePaidLocalTax) - Math.round(combinedDecisionTax * 0.1));
  const wageFreeRefund = refundNational + refundLocal;

  const finalRefundNational = Math.max(0, (wagePaidTax + freePaidTax) - finalDecisionTax);
  const finalRefundLocal = Math.max(0, (wagePaidLocalTax + freePaidLocalTax) - finalLocalTax);
  const finalRefund = finalRefundNational + finalRefundLocal;

  const rentRefund = Math.max(0, finalRefund - wageFreeRefund);
  const fee = Math.round(finalRefund * (selectedFeeRate / 100));

  return {
    wageFreeRefund,
    rentRefund,
    finalRefund,
    fee,
    nationalRefund: finalRefundNational,
    localRefund: finalRefundLocal,
    combinedCalcTax: combinedCalcTax,
    combinedDecisionTax: finalDecisionTax,
    originalCalcTax: wageCalcTax,
    originalDecisionTax: wagePaidTax,
    originalTaxable: Math.round(wageTaxable),
    combinedTaxable: Math.round(Math.max(0, combinedTaxable - extraIncomeDeduction))
  };
};
