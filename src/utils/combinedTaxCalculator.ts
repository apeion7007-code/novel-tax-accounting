
function cleanNum(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/,/g, '').trim();
  const parsed = Number(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

import type { RegistrationForm } from '../types/tax';

const deriveTaxableIncome = (calcTax: number): number => {
  if (calcTax <= 840000) return calcTax / 0.06;
  if (calcTax <= 6240000) return (calcTax + 1260000) / 0.15;
  return (calcTax + 5760000) / 0.24;
};

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
    let wageFreeRefund = 0;
    let rentRefund = 0;
    let totalOriginalCalcTax = 0;
    let totalOriginalDecisionTax = 0;
    let totalNewDecisionTax = 0;
    let totalNationalRefund = 0;
    let totalLocalRefund = 0;

    matchingWageDataList.forEach((yrData: any) => {
      const natRefund = cleanNum(yrData.refundExpectNational || yrData.expectedRefundNational);
      const locRefund = cleanNum(yrData.refundExpectLocal || yrData.expectedRefundLocal);
      wageFreeRefund += natRefund + locRefund;
      
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
      
      rentRefund += (regForm.isMonthlyRent === 'ga' || regForm.isMonthlyRent === '가' ? yrRentRefund : 0) || 0;

      totalOriginalCalcTax += cleanNum(yrData.taxBase);
      totalOriginalDecisionTax += cleanNum(yrData.decisionTax || yrData.originalDeterminedTax);
      totalNewDecisionTax += cleanNum(yrData.decisionTaxApplyAmt);
      totalNationalRefund += natRefund + (regForm.isMonthlyRent === 'ga' || regForm.isMonthlyRent === '가' ? rentRefundNational : 0);
      totalLocalRefund += locRefund + (regForm.isMonthlyRent === 'ga' || regForm.isMonthlyRent === '가' ? rentRefundLocal : 0);
    });
    const finalRefund = wageFreeRefund + rentRefund;
    const fee = Math.round(finalRefund * (selectedFeeRate / 100));
    const originalTaxable = deriveTaxableIncome(totalOriginalCalcTax);
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
      nationalRefund: totalNationalRefund,
      localRefund: totalLocalRefund,
      combinedCalcTax: totalOriginalCalcTax,
      combinedDecisionTax: totalNewDecisionTax,
      originalCalcTax: totalOriginalCalcTax,
      originalDecisionTax: totalOriginalDecisionTax,
      originalTaxable,
      combinedTaxable
    };
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
  const wageTaxable = deriveTaxableIncome(wageCalcTax);
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
  const extraChildTaxCredit = chCount * 150000;

  const remainingTaxAfterReduction = Math.max(0, combinedCalcTax - reductionAmt - extraTaxReductionFromDeduction);
  
  const changedChildDeduction = combinedCalcTax > 0 ? Math.round(childDeduction * (remainingTaxAfterReduction / combinedCalcTax)) : 0;

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
