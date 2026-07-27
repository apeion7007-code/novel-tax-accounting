import type { RegistrationForm } from '../types/tax';

export interface CombinedRefundResult {
  wageFreeRefund: number;
  rentRefund: number;
  finalRefund: number;
  fee: number;
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
    return { wageFreeRefund: 0, rentRefund: 0, finalRefund: 0, fee: 0 };
  }
  
  // Case 1: Only wage active
  if (hasWage && !hasFree) {
    let wageFreeRefund = 0;
    let rentRefund = 0;
    matchingWageDataList.forEach((yrData: any) => {
      wageFreeRefund += (Number(yrData.refundExpectNational) || 0) + (Number(yrData.refundExpectLocal) || 0);
      
      let yrRentRefund = Number(yrData.rentRefundTotal) || 0;
      if (!yrRentRefund && (regForm.isMonthlyRent === 'ga' || regForm.isMonthlyRent === '가') && regForm.rentAllHouseholdsNoHouse === '가' && regForm.monthlyRentFee) {
        const totalSalary = Number(yrData.salaryTotal || yrData.totalSalary) || 0;
        const rate = totalSalary <= 55000000 ? 0.17 : (totalSalary <= 80000000 ? 0.15 : 0);
        const rentLimit = Math.min(Number(regForm.monthlyRentFee) * 12, 10000000);
        const rentDeduction = Math.round(rentLimit * rate);
        
        const originalDecisionTax = Number(yrData.decisionTax || yrData.originalDeterminedTax) || 0;
        const refundNational = Number(yrData.refundExpectNational || yrData.expectedRefundNational) || 0;
        const remainingDecisionTax = Math.max(0, originalDecisionTax - refundNational);
        
        const rentRefundNational = Math.min(rentDeduction, remainingDecisionTax);
        const rentRefundLocal = Math.round(rentRefundNational * 0.1);
        yrRentRefund = rentRefundNational + rentRefundLocal;
      }
      
      rentRefund += (regForm.isMonthlyRent === 'ga' || regForm.isMonthlyRent === '가' ? yrRentRefund : 0) || 0;
    });
    const finalRefund = wageFreeRefund + rentRefund;
    const fee = Math.round(finalRefund * (selectedFeeRate / 100));
    return { wageFreeRefund, rentRefund, finalRefund, fee };
  }

  // Case 2: Only freelancer active
  if (!hasWage && hasFree) {
    const wageFreeRefund = (Number(freeData.refundExpectNational) || 0) + (Number(freeData.refundExpectLocal) || 0);
    const rentRefund = 0;
    const finalRefund = wageFreeRefund;
    const fee = Math.round(finalRefund * (selectedFeeRate / 100));
    return { wageFreeRefund, rentRefund, finalRefund, fee };
  }

  // Case 3: Both active -> Combined tax calculation
  let wageCalcTax = 0;
  let wagePaidTax = 0;
  let wagePaidLocalTax = 0;
  let childDeduction = 0;
  let childReductionApply = 'Y';
  
  matchingWageDataList.forEach((yrData: any) => {
    wageCalcTax += Number(yrData.taxBase) || 0;
    wagePaidTax += Number(yrData.decisionTax) || 0;
    wagePaidLocalTax += Number(yrData.localTax) || 0;
    childDeduction += Number(yrData.childDeduction) || 0;
    if (yrData.childReductionApply === 'N' || yrData.childReductionApply === '0') {
      childReductionApply = 'N';
    }
  });

  const freeIncome = Number(freeData?.totalIncome) || 0;
  
  const deriveTaxableIncome = (calcTax: number): number => {
    if (calcTax <= 840000) return calcTax / 0.06;
    if (calcTax <= 6240000) return (calcTax + 1260000) / 0.15;
    return (calcTax + 5760000) / 0.24;
  };
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
  const reductionAmt = isReductionApplied ? Math.min(1500000, Math.round(combinedCalcTax * 0.9)) : 0;

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
      const totalSalary = Number(firstWage.salaryTotal) || 0;
      const rate = totalSalary <= 55000000 ? 0.17 : (totalSalary <= 80000000 ? 0.15 : 0);
      const rentLimit = Math.min(Number(regForm.monthlyRentFee) * 12, 10000000);
      rentDeductionAmt = Math.round(rentLimit * rate);
    }
  }

  const finalDecisionTax = Math.max(0, combinedDecisionTax - rentDeductionAmt);
  const finalLocalTax = Math.round(finalDecisionTax * 0.1);

  const freePaidTax = Number(freeData?.withholdingTax3) || 0;
  const freePaidLocalTax = Number(freeData?.localTax03) || 0;

  const refundNational = Math.max(0, (wagePaidTax + freePaidTax) - combinedDecisionTax);
  const refundLocal = Math.max(0, (wagePaidLocalTax + freePaidLocalTax) - Math.round(combinedDecisionTax * 0.1));
  const wageFreeRefund = refundNational + refundLocal;

  const finalRefundNational = Math.max(0, (wagePaidTax + freePaidTax) - finalDecisionTax);
  const finalRefundLocal = Math.max(0, (wagePaidLocalTax + freePaidLocalTax) - finalLocalTax);
  const finalRefund = finalRefundNational + finalRefundLocal;

  const rentRefund = Math.max(0, finalRefund - wageFreeRefund);
  const fee = Math.round(finalRefund * (selectedFeeRate / 100));

  return { wageFreeRefund, rentRefund, finalRefund, fee };
};
