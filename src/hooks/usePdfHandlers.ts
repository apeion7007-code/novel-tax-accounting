import React from 'react';
import { extractTextFromPdf, parsePdfText } from '../utils/pdfParser';
import { recalculateYearData } from '../utils/taxCalculator';
const isMaskedVal = (val: string) => !val || val.includes('*');

const getBestFieldVal = (existingVal: string, newVal: string) => {
  const cleanExisting = (existingVal || '').trim();
  const cleanNew = (newVal || '').trim();
  if (!cleanNew) return cleanExisting;
  if (!cleanExisting) return cleanNew;
  if (isMaskedVal(cleanNew) && !isMaskedVal(cleanExisting)) {
    return cleanExisting;
  }
  return cleanNew;
};

export function usePdfHandlers(
  regForm: any,
  setRegForm: React.Dispatch<React.SetStateAction<any>>,
  selectedFeeRate: number,
  setTargetYears: React.Dispatch<React.SetStateAction<string[]>>,
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
) {
  const handleDownloadPdf = async (targetId: string, yrLabel: string) => {
    const yearData = (regForm.years || []).find((y: any) => y.id === targetId);
    const yr = yearData?.year || '';

    // 1. Memory uploaded file
    if (yearData?.pdfFile) {
      const url = URL.createObjectURL(yearData.pdfFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = yearData.pdfFile.name || `${yrLabel}_원천징수영수증.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`[${yrLabel}] PDF 원본 파일 다운로드를 완료했습니다.`, 'success');
      return;
    }

    // 1-2. Supabase Storage uploaded file URL
    if ((yearData as any)?.fileURL) {
      window.open((yearData as any).fileURL, '_blank');
      showToast(`[${yrLabel}] Supabase 스토리지 원본 PDF 파일을 엽니다.`, 'success');
      return;
    }

    // 2. Try fetching from public/${yr}.pdf
    try {
      const pdfUrl = `/${yr}.pdf`;
      const response = await fetch(pdfUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${yrLabel}_원천징수영수증.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast(`[${yrLabel}] PDF 원본 파일 다운로드를 완료했습니다.`, 'success');
        return;
      }
    } catch (e) {
      console.warn('PDF fetch error:', e);
    }

    // 3. Fallback text file
    const textContent = `[노벨세무회계 연구] ${yrLabel} 근로소득 원천징수영수증 정산 데이터\n\n` +
      `신청인: ${regForm.name || '-'}\n` +
      `외국인등록번호: ${regForm.foreignerNumber || '-'}\n` +
      `근무처: ${yearData?.workPlace || '-'}\n` +
      `근무기간: ${yearData?.workPeriod || '-'}\n` +
      `총급여액: ${Number(yearData?.salaryTotal || 0).toLocaleString()}원\n` +
      `산출세액: ${Number(yearData?.taxBase || 0).toLocaleString()}원\n` +
      `기존 결정세액(소득세): ${Number(yearData?.decisionTax || 0).toLocaleString()}원\n` +
      `기존 결정세액(지방세): ${Number(yearData?.localTax || 0).toLocaleString()}원\n` +
      `청년세액감면 적용액: ${Number(yearData?.childReductionApplyAmt || 0).toLocaleString()}원\n` +
      `예상 환급금 합계: ${Number(yearData?.courtFee || 0).toLocaleString()}원\n`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${yrLabel}_원천징수영수증_정산서.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`[${yrLabel}] 정산서 다운로드를 완료했습니다.`, 'success');
  };

  const handleSingleYearPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast(`PDF 분석을 시작합니다 (${file.name})...`, 'info');
      const text = await extractTextFromPdf(file);
      
      const isBusiness = text.includes('사업소득');
      const isOther = text.includes('기타소득');
      if (isBusiness || isOther) {
        const parsed = parsePdfText(text);
        const yr = parsed.year;
        if (!yr || !/^\d{4}$/.test(yr)) {
          showToast(`PDF 파일에서 귀속연도를 감지하지 못했습니다.`, 'error');
          return;
        }

        const isNonRefund = parsed.isNonRefundable || false;
        if (isNonRefund) {
          showToast(`⚠️ [${yr}년도] 환급 불가 대상 소득(기타소득 코드: ${parsed.incomeTypeCode || '62'})이 감지되어 환급액이 0원 처리되었습니다.`, 'error');
        }

        setRegForm((prev: any) => {
          const updatedFreelancer = { ...prev.freelancerYears };
          const income = Number(parsed.salaryTotal) || 0;
          const code = parsed.incomeTypeCode || '3.3%';
          const isNonRefund = parsed.isNonRefundable || false;
          
          const taxRate = code === '3.3%' ? 0.03 : 0.20;
          const tax3 = Math.round(income * taxRate);
          const tax03 = Math.round(tax3 * 0.1);
          
          const refundNat = isNonRefund ? 0 : (Number(parsed.determinedIncomeTax) || tax3);
          const refundLoc = isNonRefund ? 0 : (Number(parsed.determinedLocalTax) || tax03);
          const courtFee = refundNat + refundLoc;
          const feeAmt = Math.round(courtFee * (selectedFeeRate / 100));

          updatedFreelancer[yr] = {
            active: true,
            isFileUploaded: true,
            pdfFile: file,
            workPlace: parsed.workPlace || '',
            businessNumber: parsed.businessNumber || '',
            totalIncome: String(income),
            withholdingTax3: String(parsed.determinedIncomeTax || tax3),
            localTax03: String(parsed.determinedLocalTax || tax03),
            totalWithholding33: String(Number(parsed.determinedIncomeTax || tax3) + Number(parsed.determinedLocalTax || tax03)),
            refundExpectNational: String(refundNat),
            refundExpectLocal: String(refundLoc),
            courtFee: String(courtFee),
            expectedFeeAmt: String(feeAmt),
            incomeTypeCode: code,
            isNonRefundable: isNonRefund
          };

          const updatedBasic: any = {};
          if (parsed.name && !prev.name) updatedBasic.name = parsed.name;
          if (parsed.foreignerNumber) updatedBasic.foreignerNumber = getBestFieldVal(prev.foreignerNumber, parsed.foreignerNumber);

          return {
            ...prev,
            ...updatedBasic,
            freelancerYears: updatedFreelancer
          };
        });
        showToast(`[${yr}년도] 프리랜서 소득 파일로 감지되어 프리랜서 테이블로 자동 업로드되었습니다.`, 'success');
        return;
      }

      const parsed = parsePdfText(text);

      const yr = parsed.year;
      if (!yr || !/^\d{4}$/.test(yr)) {
        showToast(`PDF 파일에서 귀속연도를 감지하지 못했습니다.`, 'error');
        return;
      }

      const originalDecisionTax = Number(parsed.determinedIncomeTax) || 0;
      const originalLocalTax = Number(parsed.determinedLocalTax) || 0;

      setRegForm((prev: any) => {
        const updatedYears = [...(prev.years || [])];
        
        let targetIndex = -1;
        if (targetId) {
          targetIndex = updatedYears.findIndex(y => y.id === targetId);
        }
        
        // If not found by ID, try to find an inactive column for the parsed year to occupy
        if (targetIndex === -1) {
          targetIndex = updatedYears.findIndex(y => y.year === yr && !y.active && !y.isFileUploaded);
        }

        const rawYrData = {
          id: targetIndex !== -1 ? updatedYears[targetIndex].id : ('temp_' + Date.now()),
          active: true,
          isFileUploaded: true,
          pdfFile: file,
          year: yr,
          workPeriod: parsed.workPeriod || (targetIndex !== -1 ? updatedYears[targetIndex].workPeriod : '') || '',
          workPlace: parsed.workPlace || (targetIndex !== -1 ? updatedYears[targetIndex].workPlace : '') || '',
          businessNumber: parsed.businessNumber || (targetIndex !== -1 ? updatedYears[targetIndex].businessNumber : '') || '',
          birthDate: parsed.foreignerNumber ? parsed.foreignerNumber.substring(0, 6) : (targetIndex !== -1 ? updatedYears[targetIndex].birthDate : '') || '',
          salaryTotal: parsed.salaryTotal || '0',
          taxBase: parsed.decisionTax || parsed.taxBase || '0',
          childReduction: parsed.childReduction || '0',
          childDeduction: parsed.childDeduction || '0',
          decisionTax: parsed.determinedIncomeTax || '0',
          localTax: parsed.determinedLocalTax || '0',
          taxRefundTotal: String(originalDecisionTax + originalLocalTax),
          childReductionApply: 'Y',
        };

        const updatedBasic: any = {};
        if (parsed.name && !prev.name) updatedBasic.name = parsed.name;
        if (parsed.foreignerNumber) updatedBasic.foreignerNumber = getBestFieldVal(prev.foreignerNumber, parsed.foreignerNumber);
        if (parsed.taxReductionApplyDateStart) updatedBasic.taxReductionApplyDateStart = parsed.taxReductionApplyDateStart;
        if (parsed.taxReductionApplyDateEnd) updatedBasic.taxReductionApplyDateEnd = parsed.taxReductionApplyDateEnd;

        if (parsed.workPeriod) {
          const start = parsed.workPeriod.split('~')[0].trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(start)) {
            const currentAddress = prev.residentAddress || updatedBasic.residentAddress;
            if (!currentAddress) {
              updatedBasic.residentAddress = start;
            } else if (start < currentAddress) {
              updatedBasic.residentAddress = start;
            }
          }
        }

        const newRrn = updatedBasic.foreignerNumber || prev.foreignerNumber;
        const newEmpDate = updatedBasic.residentAddress || prev.residentAddress;

        if (targetIndex !== -1) {
          updatedYears[targetIndex] = rawYrData;
        } else {
          updatedYears.push(rawYrData);
        }

        const finalYears = updatedYears.map((yrData: any) => {
          if (yrData && (yrData.active || yrData.isFileUploaded)) {
            return recalculateYearData(
              yrData,
              prev.dependentsCount,
              prev.seniorCount,
              prev.disabledCount,
              prev.childCount,
              selectedFeeRate,
              newRrn,
              newEmpDate,
              prev
            );
          }
          return yrData;
        });

        finalYears.sort((a, b) => {
          const yrA = Number(a.year) || 0;
          const yrB = Number(b.year) || 0;
          if (yrA !== yrB) return yrA - yrB;
          const dateA = a.workPeriod?.split('~')[0]?.trim() || '';
          const dateB = b.workPeriod?.split('~')[0]?.trim() || '';
          return dateA.localeCompare(dateB);
        });

        return {
          ...prev,
          ...updatedBasic,
          years: finalYears
        };
      });

      showToast(`PDF 자동 분석 완료! [${yr}년도] 칸에 데이터가 자동으로 반영되었습니다.`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`PDF 분석 중 오류가 발생했습니다: ${err.message || err}`, 'error');
    }
  };

  const handleFreelancerSingleYearPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, fallbackYr?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast(`프리랜서 지급명세서 PDF 분석을 시작합니다 (${file.name})...`, 'info');
      const text = await extractTextFromPdf(file);
      const parsed = parsePdfText(text, fallbackYr);

      const yr = parsed.year || fallbackYr;
      if (!yr || !/^\d{4}$/.test(yr)) {
        showToast(`PDF 파일에서 귀속연도를 감지하지 못했습니다.`, 'error');
        return;
      }

      const isBusiness = text.includes('사업소득');
      const isOther = text.includes('기타소득');
      if (!isBusiness && !isOther) {
        const originalDecisionTax = Number(parsed.determinedIncomeTax) || 0;
        const originalLocalTax = Number(parsed.determinedLocalTax) || 0;

        setRegForm((prev: any) => {
          const updatedYears = [...(prev.years || [])];
          let targetIndex = updatedYears.findIndex(y => y.year === yr && !y.active && !y.isFileUploaded);
          
          const rawYrData = {
            id: targetIndex !== -1 ? updatedYears[targetIndex].id : ('temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5)),
            active: true,
            isFileUploaded: true,
            pdfFile: file,
            year: yr,
            workPeriod: parsed.workPeriod || (targetIndex !== -1 ? updatedYears[targetIndex].workPeriod : '') || '',
            workPlace: parsed.workPlace || (targetIndex !== -1 ? updatedYears[targetIndex].workPlace : '') || '',
            businessNumber: parsed.businessNumber || (targetIndex !== -1 ? updatedYears[targetIndex].businessNumber : '') || '',
            birthDate: parsed.foreignerNumber ? parsed.foreignerNumber.substring(0, 6) : (targetIndex !== -1 ? updatedYears[targetIndex].birthDate : '') || '',
            salaryTotal: parsed.salaryTotal || '0',
            taxBase: parsed.decisionTax || parsed.taxBase || '0',
            childReduction: parsed.childReduction || '0',
            childDeduction: parsed.childDeduction || '0',
            decisionTax: parsed.determinedIncomeTax || '0',
            localTax: parsed.determinedLocalTax || '0',
            taxRefundTotal: String(originalDecisionTax + originalLocalTax),
            childReductionApply: 'Y',
          };

          const updatedBasic: any = {};
          if (parsed.name && !prev.name) updatedBasic.name = parsed.name;
          if (parsed.foreignerNumber) updatedBasic.foreignerNumber = getBestFieldVal(prev.foreignerNumber, parsed.foreignerNumber);
          if (parsed.taxReductionApplyDateStart) updatedBasic.taxReductionApplyDateStart = parsed.taxReductionApplyDateStart;
          if (parsed.taxReductionApplyDateEnd) updatedBasic.taxReductionApplyDateEnd = parsed.taxReductionApplyDateEnd;

          if (parsed.workPeriod) {
            const start = parsed.workPeriod.split('~')[0].trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(start)) {
              const currentAddress = prev.residentAddress || updatedBasic.residentAddress;
              if (!currentAddress) {
                updatedBasic.residentAddress = start;
              } else if (start < currentAddress) {
                updatedBasic.residentAddress = start;
              }
            }
          }

          const newRrn = updatedBasic.foreignerNumber || prev.foreignerNumber;
          const newEmpDate = updatedBasic.residentAddress || prev.residentAddress;

          if (targetIndex !== -1) {
            updatedYears[targetIndex] = rawYrData;
          } else {
            updatedYears.push(rawYrData);
          }

          const finalYears = updatedYears.map((yrData: any) => {
            if (yrData && (yrData.active || yrData.isFileUploaded)) {
              return recalculateYearData(
                yrData,
                prev.dependentsCount,
                prev.seniorCount,
                prev.disabledCount,
                prev.childCount,
                selectedFeeRate,
                newRrn,
                newEmpDate,
                prev
              );
            }
            return yrData;
          });

          finalYears.sort((a, b) => Number(a.year) - Number(b.year));

          return {
            ...prev,
            ...updatedBasic,
            years: finalYears
          };
        });

        showToast(`[${yr}년도] 근로소득 파일로 감지되어 근로소득 테이블로 자동 업로드되었습니다.`, 'success');
        return;
      }

      const isNonRefund = parsed.isNonRefundable || false;
      if (isNonRefund) {
        showToast(`⚠️ [${yr}년도] 환급 불가 대상 소득(기타소득 코드: ${parsed.incomeTypeCode || '62'})이 감지되어 환급액이 0원 처리되었습니다.`, 'error');
      }

      setRegForm((prev: any) => {
        const updatedYears = { ...prev.freelancerYears };
        
        const income = Number(parsed.salaryTotal) || 0;
        const code = parsed.incomeTypeCode || '3.3%';
        const isNonRefund = parsed.isNonRefundable || false;
        
        const taxRate = code === '3.3%' ? 0.03 : 0.20;
        const tax3 = Math.round(income * taxRate);
        const tax03 = Math.round(tax3 * 0.1);
        
        const refundNat = isNonRefund ? 0 : (Number(parsed.determinedIncomeTax) || tax3);
        const refundLoc = isNonRefund ? 0 : (Number(parsed.determinedLocalTax) || tax03);
        const courtFee = refundNat + refundLoc;
        const feeAmt = Math.round(courtFee * (selectedFeeRate / 100));

        const updatedBasic: any = {};
        if (parsed.name && !prev.name) updatedBasic.name = parsed.name;
        if (parsed.foreignerNumber) updatedBasic.foreignerNumber = getBestFieldVal(prev.foreignerNumber, parsed.foreignerNumber);

        updatedYears[yr] = {
          active: true,
          isFileUploaded: true,
          pdfFile: file,
          workPlace: parsed.workPlace || updatedYears[yr]?.workPlace || '',
          businessNumber: parsed.businessNumber || updatedYears[yr]?.businessNumber || '',
          totalIncome: String(income),
          withholdingTax3: String(parsed.determinedIncomeTax || tax3),
          localTax03: String(parsed.determinedLocalTax || tax03),
          totalWithholding33: String(Number(parsed.determinedIncomeTax || tax3) + Number(parsed.determinedLocalTax || tax03)),
          refundExpectNational: String(refundNat),
          refundExpectLocal: String(refundLoc),
          courtFee: String(courtFee),
          expectedFeeAmt: String(feeAmt),
          incomeTypeCode: code,
          isNonRefundable: isNonRefund
        };

        return {
          ...prev,
          ...updatedBasic,
          freelancerYears: updatedYears
        };
      });

      showToast(`PDF 자동 분석 완료! 프리랜서 [${yr}년도] 칸에 데이터가 자동으로 반영되었습니다.`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`PDF 분석 중 오류가 발생했습니다: ${err.message || err}`, 'error');
    }
  };

  const handleReanalyzeYearPdf = async (targetId: string, yrLabel: string) => {
    const targetIndex = (regForm.years || []).findIndex((y: any) => y.id === targetId);
    if (targetIndex === -1) return;
    const yrData = regForm.years[targetIndex];
    const yr = yrData.year;

    try {
      showToast(`[${yrLabel}] 원본 PDF 파일 다시 읽기 및 세액 재계산을 진행합니다...`, 'info');
      let text = '';
      let fileObj: File | null = yrData.pdfFile || null;

      if (fileObj) {
        text = await extractTextFromPdf(fileObj);
      } else if (yrData.fileURL || yrData.pdfUrl) {
        const targetUrl = (yrData.fileURL || yrData.pdfUrl) as string;
        const resp = await fetch(targetUrl);
        if (!resp.ok) throw new Error('PDF 파일 다운로드에 실패했습니다.');
        const blob = await resp.blob();
        fileObj = new File([blob], `${yr}.pdf`, { type: 'application/pdf' });
        text = await extractTextFromPdf(fileObj);
      } else {
        showToast(`[${yrLabel}] 재분석할 PDF 파일이 존재하지 않습니다.`, 'error');
        return;
      }

      const isBusiness = text.includes('사업소득');
      const isOther = text.includes('기타소득');
      if (isBusiness || isOther) {
        showToast('이 파일은 프리랜서(3.3%) 소득 PDF 파일입니다. 근로소득으로 재분석할 수 없습니다.', 'error');
        return;
      }

      const parsed = parsePdfText(text, yr);
      const originalDecisionTax = Number(parsed.determinedIncomeTax) || 0;
      const originalLocalTax = Number(parsed.determinedLocalTax) || 0;

      setRegForm((prev: any) => {
        const updatedYears = [...(prev.years || [])];
        const idx = updatedYears.findIndex((y: any) => y.id === targetId);
        if (idx === -1) return prev;

        const rawYrData = {
          id: targetId,
          active: true,
          isFileUploaded: true,
          pdfFile: fileObj,
          fileURL: yrData.fileURL || yrData.pdfUrl || '',
          pdfUrl: yrData.fileURL || yrData.pdfUrl || '',
          year: yr,
          workPeriod: parsed.workPeriod || updatedYears[idx]?.workPeriod || '',
          workPlace: parsed.workPlace || updatedYears[idx]?.workPlace || '',
          businessNumber: parsed.businessNumber || updatedYears[idx]?.businessNumber || '',
          birthDate: parsed.foreignerNumber ? parsed.foreignerNumber.substring(0, 6) : updatedYears[idx]?.birthDate || '',
          salaryTotal: parsed.salaryTotal || updatedYears[idx]?.salaryTotal || '0',
          taxBase: parsed.decisionTax || parsed.taxBase || updatedYears[idx]?.taxBase || '0',
          childReduction: parsed.childReduction || '0',
          childDeduction: parsed.childDeduction || '0',
          decisionTax: parsed.determinedIncomeTax || '0',
          localTax: parsed.determinedLocalTax || '0',
          taxRefundTotal: String(originalDecisionTax + originalLocalTax),
          childReductionApply: 'Y',
        };

        updatedYears[idx] = rawYrData;

        const finalYears = updatedYears.map((yrData: any) => {
          if (yrData && (yrData.active || yrData.isFileUploaded)) {
            return recalculateYearData(
              yrData,
              prev.dependentsCount,
              prev.seniorCount,
              prev.disabledCount,
              prev.childCount,
              selectedFeeRate,
              prev.foreignerNumber,
              prev.residentAddress,
              prev
            );
          }
          return yrData;
        });

        return {
          ...prev,
          years: finalYears
        };
      });

      showToast(`[${yrLabel}] PDF 원본 재분석 완료! 세액 및 환급금이 최신 로직으로 자동 교정되었습니다.`, 'success');
    } catch (err: any) {
      console.error('Reanalyze PDF Error:', err);
      showToast(`PDF 재분석 실패: ${err.message || err}`, 'error');
    }
  };

  const handleBulkPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    showToast(`${files.length}개 PDF 파일 자동 분석을 시작합니다...`, 'info');
    let successCount = 0;
    const detectedYears: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await extractTextFromPdf(file);
        const parsed = parsePdfText(text);
        const yr = parsed.year;

        if (!yr || !/^\d{4}$/.test(yr)) {
          showToast(`파일 [${file.name}]에서 귀속연도를 감지하지 못했습니다.`, 'error');
          continue;
        }

        if (!detectedYears.includes(yr)) detectedYears.push(yr);
        successCount++;

        setTargetYears(prev => {
          if (!prev.includes(yr)) {
            return [...prev, yr].sort((a, b) => Number(a) - Number(b));
          }
          return prev;
        });

        const isBusiness = text.includes('사업소득');
        const isOther = text.includes('기타소득');

        if (isBusiness || isOther) {
          const isNonRefund = parsed.isNonRefundable || false;
          if (isNonRefund) {
            showToast(`⚠️ [${yr}년도] 환급 불가 대상 소득(기타소득 코드: ${parsed.incomeTypeCode || '62'})이 감지되어 환급액이 0원 처리되었습니다.`, 'error');
          }
          setRegForm((prev: any) => {
            const updatedYears = { ...prev.freelancerYears };
            
            const income = Number(parsed.salaryTotal) || 0;
            const code = parsed.incomeTypeCode || '3.3%';
            const isNonRefund = parsed.isNonRefundable || false;
            
            const taxRate = code === '3.3%' ? 0.03 : 0.20;
            const tax3 = Math.round(income * taxRate);
            const tax03 = Math.round(tax3 * 0.1);
            
            const refundNat = isNonRefund ? 0 : (Number(parsed.determinedIncomeTax) || tax3);
            const refundLoc = isNonRefund ? 0 : (Number(parsed.determinedLocalTax) || tax03);
            const courtFee = refundNat + refundLoc;
            const feeAmt = Math.round(courtFee * (selectedFeeRate / 100));

            const updatedBasic: any = {};
            if (parsed.name && !prev.name) updatedBasic.name = parsed.name;
            if (parsed.foreignerNumber) updatedBasic.foreignerNumber = getBestFieldVal(prev.foreignerNumber, parsed.foreignerNumber);

            updatedYears[yr] = {
              active: true,
              isFileUploaded: true,
              pdfFile: file,
              workPlace: parsed.workPlace || '',
              businessNumber: parsed.businessNumber || '',
              totalIncome: String(income),
              withholdingTax3: String(parsed.determinedIncomeTax || tax3),
              localTax03: String(parsed.determinedLocalTax || tax03),
              totalWithholding33: String(Number(parsed.determinedIncomeTax || tax3) + Number(parsed.determinedLocalTax || tax03)),
              refundExpectNational: String(refundNat),
              refundExpectLocal: String(refundLoc),
              courtFee: String(courtFee),
              expectedFeeAmt: String(feeAmt),
              incomeTypeCode: code,
              isNonRefundable: isNonRefund
            };

            return {
              ...prev,
              ...updatedBasic,
              freelancerYears: updatedYears
            };
          });
        } else {
          const originalDecisionTax = Number(parsed.determinedIncomeTax) || 0;
          const originalLocalTax = Number(parsed.determinedLocalTax) || 0;

          setRegForm((prev: any) => {
            const updatedYears = [...(prev.years || [])];
            
            // Find if there is an inactive column for this year to occupy
            let targetIndex = updatedYears.findIndex(y => y.year === yr && !y.active && !y.isFileUploaded);

            const rawYrData = {
              id: targetIndex !== -1 ? updatedYears[targetIndex].id : ('temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5)),
              active: true,
              isFileUploaded: true,
              pdfFile: file,
              year: yr,
              workPeriod: parsed.workPeriod || (targetIndex !== -1 ? updatedYears[targetIndex].workPeriod : '') || '',
              workPlace: parsed.workPlace || (targetIndex !== -1 ? updatedYears[targetIndex].workPlace : '') || '',
              businessNumber: parsed.businessNumber || (targetIndex !== -1 ? updatedYears[targetIndex].businessNumber : '') || '',
              birthDate: parsed.foreignerNumber ? parsed.foreignerNumber.substring(0, 6) : (targetIndex !== -1 ? updatedYears[targetIndex].birthDate : '') || '',
              salaryTotal: parsed.salaryTotal || '0',
              taxBase: parsed.decisionTax || parsed.taxBase || '0',
              childReduction: parsed.childReduction || '0',
              childDeduction: parsed.childDeduction || '0',
              decisionTax: parsed.determinedIncomeTax || '0',
              localTax: parsed.determinedLocalTax || '0',
              taxRefundTotal: String(originalDecisionTax + originalLocalTax),
              childReductionApply: 'Y',
            };

            const updatedBasic: any = {};
            if (parsed.name && !prev.name) updatedBasic.name = parsed.name;
            if (parsed.foreignerNumber) updatedBasic.foreignerNumber = getBestFieldVal(prev.foreignerNumber, parsed.foreignerNumber);
            if (parsed.taxReductionApplyDateStart) updatedBasic.taxReductionApplyDateStart = parsed.taxReductionApplyDateStart;
            if (parsed.taxReductionApplyDateEnd) updatedBasic.taxReductionApplyDateEnd = parsed.taxReductionApplyDateEnd;

            if (parsed.workPeriod) {
              const start = parsed.workPeriod.split('~')[0].trim();
              if (/^\d{4}-\d{2}-\d{2}$/.test(start)) {
                const currentAddress = prev.residentAddress || updatedBasic.residentAddress;
                if (!currentAddress) {
                  updatedBasic.residentAddress = start;
                } else if (start < currentAddress) {
                  updatedBasic.residentAddress = start;
                }
              }
            }

            const newRrn = updatedBasic.foreignerNumber || prev.foreignerNumber;
            const newEmpDate = updatedBasic.residentAddress || prev.residentAddress;

            if (targetIndex !== -1) {
              updatedYears[targetIndex] = rawYrData;
            } else {
              updatedYears.push(rawYrData);
            }

            const finalYears = updatedYears.map((yrData: any) => {
              if (yrData && (yrData.active || yrData.isFileUploaded)) {
                return recalculateYearData(
                  yrData,
                  prev.dependentsCount,
                  prev.seniorCount,
                  prev.disabledCount,
                  prev.childCount,
                  selectedFeeRate,
                  newRrn,
                  newEmpDate,
                  prev
                );
              }
              return yrData;
            });

            finalYears.sort((a, b) => {
              const yrA = Number(a.year) || 0;
              const yrB = Number(b.year) || 0;
              if (yrA !== yrB) return yrA - yrB;
              const dateA = a.workPeriod?.split('~')[0]?.trim() || '';
              const dateB = b.workPeriod?.split('~')[0]?.trim() || '';
              return dateA.localeCompare(dateB);
            });

            return {
              ...prev,
              ...updatedBasic,
              years: finalYears
            };
          });
        }
      } catch (err: any) {
        console.error(err);
        showToast(`파일 [${file.name}] 분석 중 오류가 발생했습니다.`, 'error');
      }
    }

    if (successCount > 0) {
      showToast(`총 ${successCount}개 PDF 파일 분석 완료! (${detectedYears.join(', ')}년도 자동 분류되어 입력됨)`, 'success');
    }
  };

  return {
    handleDownloadPdf,
    handleSingleYearPdfUpload,
    handleFreelancerSingleYearPdfUpload,
    handleReanalyzeYearPdf,
    handleBulkPdfUpload
  };
}
