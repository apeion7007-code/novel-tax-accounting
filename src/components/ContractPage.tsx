import React, { useState, useEffect, useRef } from 'react';
import { fetchClientByConsentToken, updateClientContract, supabase } from '../utils/supabaseClient';
import { calculateCombinedRefund } from '../utils/combinedTaxCalculator';
import {
  CONTRACT_LANG_CODES,
  BANK_DETAILS_MAP,
  PREPAID_LABEL_MAP,
  POSTPAID_LABEL_MAP,
  DEFAULT_CONTRACT_TRANSLATIONS,
  getStoredContractTranslations,
  fetchContractTranslationsFromSupabase
} from '../utils/contractTemplateStorage';
import { A4ContractDocument, type ContractData } from './A4ContractDocument';

export {
  CONTRACT_LANG_CODES,
  BANK_DETAILS_MAP,
  PREPAID_LABEL_MAP,
  POSTPAID_LABEL_MAP,
  DEFAULT_CONTRACT_TRANSLATIONS as CONTRACT_TRANSLATIONS,
  getStoredContractTranslations
};

interface ContractPageProps {
  token: string;
  onBackToLogin?: () => void;
}

export function ContractPage({ token }: ContractPageProps) {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('한국어');
  const [expectedRefund, setExpectedRefund] = useState<number>(0);
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>(getStoredContractTranslations);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  // Sync translations from Supabase Cloud on mount & listen to storage updates
  useEffect(() => {
    fetchContractTranslationsFromSupabase().then((cloudData) => {
      setTranslations(cloudData);
    });

    const handleStorageUpdate = () => {
      setTranslations(getStoredContractTranslations());
    };
    window.addEventListener('novel_contract_translations_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('novel_contract_translations_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Load client data & calculate total expected refund across 5 years
  useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await fetchClientByConsentToken(token);
      if (data) {
        setClient(data);

        // Get language parameter from URL if available, else auto-detect from client country
        const params = new URLSearchParams(window.location.search);
        const urlLang = params.get('lang') || params.get('l');

        if (urlLang && CONTRACT_LANG_CODES[urlLang]) {
          setSelectedLanguage(urlLang);
        } else {
          if (data.country === '베트남') setSelectedLanguage('베트남어');
          else if (data.country === '인도네시아') setSelectedLanguage('인도네시아어');
          else if (data.country === '몽골') setSelectedLanguage('몽골어');
          else if (data.country === '미얀마') setSelectedLanguage('미얀마어');
          else if (data.country === '캄보디아') setSelectedLanguage('캄보디아어');
          else if (data.country === '네팔') setSelectedLanguage('네팔어');
          else if (data.country === '방글라데시') setSelectedLanguage('방글라데시어');
          else if (data.country === '우즈베키스탄') setSelectedLanguage('우즈베크어');
          else if (data.country === '파키스탄') setSelectedLanguage('파키스탄어');
          else if (data.country === '태국') setSelectedLanguage('태국어');
          else if (data.country === '필리핀') setSelectedLanguage('필리핀어');
          else if (data.country === '스리랑카') setSelectedLanguage('스리랑카어');
          else if (data.country && data.country !== '대한민국' && data.country !== '한국') setSelectedLanguage('영어');
          else setSelectedLanguage('한국어');
        }

        // Fetch YearEndData to summarize total expected refunds
        try {
          const { data: yearsList } = await supabase
            .from('YearEndData')
            .select(`
              id, year, companyName, netSalary, calculatedTax, determinedTax, changedDeterminedTax,
              totalTaxRefund, localTaxRefund,
              rentRefundExpectNational, rentRefundExpectLocal, rentRefundTotal,
              dependentsCount, seniorCount, disabledCount, childCount,
              freelancerActive, freelancerNetSalary, freelancerDeterminedTax, freelancerLocalTax,
              freelancerRefundExpectNational, freelancerRefundExpectLocal
            `)
            .eq('clientId', data.id);

          if (yearsList && yearsList.length > 0) {
            const reconstructedRegForm: any = {
              nationality: data.country || '인도네시아',
              isMonthlyRent: data.isMonthlyTenant ? '가' : '부',
              rentAllHouseholdsNoHouse: data.rentAllHouseholdsNoHouse || '부',
              monthlyRentFee: String(data.monthlyRentFee || 0),
              dependentsCount: data.dependentsCount || 0,
              seniorCount: data.seniorCount || 0,
              disabledCount: data.disabledCount || 0,
              childCount: data.childCount || 0,
              years: [],
              freelancerYears: {}
            };

            const targetYears = ['2021', '2022', '2023', '2024', '2025'];
            targetYears.forEach((yr) => {
              reconstructedRegForm.freelancerYears[yr] = {
                active: false,
                totalIncome: '0',
                withholdingTax3: '0',
                localTax03: '0',
                refundExpectNational: '0',
                refundExpectLocal: '0'
              };
            });

            yearsList.forEach((y) => {
              const yrStr = String(y.year);
              if (!y.freelancerActive) {
                reconstructedRegForm.years.push({
                  id: String(y.id),
                  year: yrStr,
                  active: true,
                  salaryTotal: String(y.netSalary || 0),
                  taxBase: String(y.calculatedTax || 0),
                  decisionTax: String(y.determinedTax || 0),
                  decisionTaxApplyAmt: String(y.changedDeterminedTax || 0),
                  refundExpectNational: String(y.totalTaxRefund || 0),
                  refundExpectLocal: String(y.localTaxRefund || 0),
                  childDeduction: String((y as any).childDeduction || 0),
                  childReductionApply: (y as any).childReductionApply || 'Y',
                  rentRefundExpectNational: String(y.rentRefundExpectNational || 0),
                  rentRefundExpectLocal: String(y.rentRefundExpectLocal || 0),
                  rentRefundTotal: String(y.rentRefundTotal || 0),
                  dependentsCount: y.dependentsCount,
                  seniorCount: y.seniorCount,
                  disabledCount: y.disabledCount,
                  childCount: y.childCount
                });
              } else {
                reconstructedRegForm.freelancerYears[yrStr] = {
                  active: true,
                  totalIncome: String(y.freelancerNetSalary || 0),
                  withholdingTax3: String(y.freelancerDeterminedTax || 0),
                  localTax03: String(y.freelancerLocalTax || 0),
                  refundExpectNational: String(y.freelancerRefundExpectNational || 0),
                  refundExpectLocal: String(y.freelancerRefundExpectLocal || 0)
                };
              }
            });

            const urlFeeParam = new URLSearchParams(window.location.search).get('feeRate') || new URLSearchParams(window.location.search).get('fee');
            const feeRateToUse = urlFeeParam ? Number(urlFeeParam) : (Number(data.feeRate) || 22);

            let total = 0;
            targetYears.forEach((yr) => {
              const combinedRes = calculateCombinedRefund(reconstructedRegForm, yr, feeRateToUse);
              const hasWage = reconstructedRegForm.years.some((y: any) => String(y.year) === yr && y.active);
              const isActive = hasWage || reconstructedRegForm.freelancerYears[yr]?.active;
              if (isActive) {
                total += combinedRes.finalRefund;
              }
            });

            setExpectedRefund(total);
          }
        } catch (err) {
          console.warn('Failed to summarize expected refunds:', err);
        }
      }
      setLoading(false);
    }
    load();
  }, [token]);

  // Canvas drawing coordinate calculations
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    isDrawingRef.current = true;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Submit contract signature
  const handleSubmit = async () => {
    if (!client) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas is empty
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      alert(selectedLanguage === '영어' ? 'Please sign before submitting.' : '서명을 작성해 주세요.');
      return;
    }

    setSubmitting(true);
    const signatureBase64 = canvas.toDataURL('image/png');

    const res = await updateClientContract(client.id, signatureBase64);
    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
    } else {
      alert(`제출 실패 / Submission Failed: ${res.error}`);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#475569' }}>
          <div style={{ border: '4px solid #cbd5e1', borderTop: '4px solid #2563eb', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Loading Contract...</div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const currentTranslation = translations[selectedLanguage] || DEFAULT_CONTRACT_TRANSLATIONS[selectedLanguage] || DEFAULT_CONTRACT_TRANSLATIONS['한국어'];

  if (!client) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px', fontFamily: 'sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
            {currentTranslation.errorTitle || '고객 정보 로드 오류'}
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
            {currentTranslation.errorText || '계약서 서명을 위한 고객 정보를 찾을 수 없거나 링크가 만료되었습니다. 담당 매니저에게 문의해 주세요.'}
          </p>
        </div>
      </div>
    );
  }

  // Prepared client data for A4 document
  const urlFeeParam = new URLSearchParams(window.location.search).get('feeRate') || new URLSearchParams(window.location.search).get('fee');
  const feeRate = urlFeeParam ? Number(urlFeeParam) : (Number(client.feeRate) || 22);

  const contractData: ContractData = {
    name: client.name || '',
    country: client.country || '',
    regNum: client.regNum || '',
    company: client.company || '-',
    visa: client.visa || '-',
    totalRefund: expectedRefund,
    feeRate: feeRate,
    prepaidRate: Number(client.prepaidRate) || 0,
    postpaidRate: Number(client.postpaidRate) || feeRate,
    signatureUrl: success ? (canvasRef.current?.toDataURL('image/png') || client.signatureUrl) : client.signatureUrl,
    signedDate: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '24px 16px', boxSizing: 'border-box', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '820px' }}>
        <A4ContractDocument
          language={selectedLanguage}
          translations={currentTranslation}
          onLanguageChange={setSelectedLanguage}
          contractData={contractData}
          isEditable={false}
          showLanguageSelector={true}
          showSignaturePad={true}
          onSignatureSubmit={handleSubmit}
          submitting={submitting}
          isCompleted={success}
          canvasRef={canvasRef}
          clearCanvas={clearCanvas}
          startDrawing={startDrawing}
          draw={draw}
          stopDrawing={stopDrawing}
        />
      </div>
    </div>
  );
}
