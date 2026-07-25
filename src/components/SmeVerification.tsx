import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { queryBiznoCompany, requestBiznoRegistration, checkSmeEligibility } from '../utils/biznoService';

interface SmeVerificationProps {
  years: any[];
}

interface SmeResult {
  year: string;
  companyName: string;
  businessNumber: string;
  status: 'SUCCESS' | 'FAIL' | 'WARNING' | 'REGISTERED' | 'ERROR';
  message: string;
  details?: string;
}

export const SmeVerification: React.FC<SmeVerificationProps> = ({ years }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SmeResult[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  const handleVerify = async () => {
    // 1. 테이블 내에 입력된 모든 사업자등록번호 수집
    const activeCompanies = (years || [])
      .filter((data: any) => data && data.businessNumber && data.businessNumber.trim() !== '')
      .map((data: any) => ({
        year: data.year,
        companyName: data.workPlace || '회사명 없음',
        businessNumber: data.businessNumber.trim()
      }));

    if (activeCompanies.length === 0) {
      alert('판별할 사업자등록번호가 테이블에 없습니다. 먼저 PDF 파일이나 사업자등록번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    setHasChecked(true);
    const tempResults: SmeResult[] = [];

    for (const comp of activeCompanies) {
      try {
        // 비즈노 fapi 조회
        const { info, errorMsg } = await queryBiznoCompany(comp.businessNumber);

        if (errorMsg) {
          tempResults.push({
            year: comp.year,
            companyName: comp.companyName,
            businessNumber: comp.businessNumber,
            status: 'ERROR',
            message: errorMsg
          });
          continue;
        }

        if (!info) {
          // 비즈노 DB에 없는 경우 -> 자동 등록 요청 (bizCU)
          const regRes = await requestBiznoRegistration({
            bno: comp.businessNumber,
            company: comp.companyName
          });

          tempResults.push({
            year: comp.year,
            companyName: comp.companyName,
            businessNumber: comp.businessNumber,
            status: 'REGISTERED',
            message: regRes.success 
              ? '비즈노 미등록 사업자입니다. 자동 신규등록 요청을 접수했습니다. (1영업일 내 업데이트)'
              : '비즈노 미등록 사업자입니다. 자동 등록 요청 중 오류가 발생했습니다.'
          });
        } else {
          // 감면 대상 중소기업 여부 분석
          const eligibility = checkSmeEligibility(info);
          
          tempResults.push({
            year: comp.year,
            companyName: info.company || comp.companyName,
            businessNumber: info.bno,
            status: eligibility.status, // 'SUCCESS' | 'FAIL' | 'WARNING'
            message: eligibility.reason,
            details: `법인번호: ${info.cno || '없음'} | 과세유형: ${info.taxtype || '일반과세'} (${info.bstt})`
          });
        }
      } catch (error) {
        console.error('검증 중 오류:', error);
        tempResults.push({
          year: comp.year,
          companyName: comp.companyName,
          businessNumber: comp.businessNumber,
          status: 'ERROR',
          message: '조회 중 에러가 발생했습니다. 네트워크 상태를 확인하세요.'
        });
      }
    }

    setResults(tempResults);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '320px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#0369a1';
          }}
          onMouseOut={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#0284c7';
          }}
        >
          {loading ? (
            <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Search size={15} />
          )}
          중소기업 판별
        </button>
      </div>

      {/* 결과 리포트 출력 창 */}
      {hasChecked && (
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '12px',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
            maxHeight: '180px',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
            📋 중소기업 판별 결과 (무료 API 정보 기반)
          </div>

          {results.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '10px 0' }}>
              판별 대상 사업자가 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.map((res, index) => {
                let badgeColor = '#64748b';
                let bgColor = '#f1f5f9';
                let textColor = '#334155';
                let statusLabel = '확인 불가';

                if (res.status === 'SUCCESS') {
                  badgeColor = '#22c55e';
                  bgColor = '#f0fdf4';
                  textColor = '#166534';
                  statusLabel = '감면 적합';
                } else if (res.status === 'FAIL') {
                  badgeColor = '#ef4444';
                  bgColor = '#fef2f2';
                  textColor = '#991b1b';
                  statusLabel = '감면 제외';
                } else if (res.status === 'WARNING') {
                  badgeColor = '#d97706'; // dark amber
                  bgColor = '#fffbeb';
                  textColor = '#92400e';
                  statusLabel = '수동 확인 필요';
                } else if (res.status === 'REGISTERED') {
                  badgeColor = '#3b82f6'; // blue
                  bgColor = '#eff6ff';
                  textColor = '#1e40af';
                  statusLabel = '신규등록요청';
                } else if (res.status === 'ERROR') {
                  badgeColor = '#6b7280'; // gray
                  bgColor = '#f9fafb';
                  textColor = '#374151';
                  statusLabel = '조회 에러';
                }

                return (
                  <div
                    key={index}
                    style={{
                      backgroundColor: bgColor,
                      border: `1px solid ${badgeColor}40`,
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: textColor,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold' }}>
                        📅 {res.year}년도 ({res.companyName})
                      </span>
                      <span
                        style={{
                          backgroundColor: badgeColor,
                          color: '#ffffff',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', marginBottom: '2px', lineHeight: '1.4' }}>
                      {res.status === 'SUCCESS' ? '🟢' : res.status === 'FAIL' ? '🔴' : res.status === 'WARNING' ? '⚠️' : '🟡'} {res.message}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'monospace' }}>
                      사업자번호: {res.businessNumber} {res.details && `| ${res.details}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
