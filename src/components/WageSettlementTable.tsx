import React from 'react';
import { FileSpreadsheet, Plus, X } from 'lucide-react';
import { checkYouthEligibility } from '../App';

interface WageSettlementTableProps {
  regForm: any;
  setRegForm: React.Dispatch<React.SetStateAction<any>>;
  targetYears: string[];
  selectedFeeRate: number;
  handleSingleYearPdfUpload: (e: React.ChangeEvent<HTMLInputElement>, fallbackYr?: string) => Promise<void>;
  handleBulkPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleReanalyzeYearPdf: (yr: string) => Promise<void>;
  handleDownloadPdf: (yr: string) => Promise<void>;
  handleAddYear: () => void;
  handleRemoveYear: (yearToRemove: string) => void;
  handleFeeRateChange: (rate: number) => void;
}

export const WageSettlementTable: React.FC<WageSettlementTableProps> = ({
  regForm,
  setRegForm,
  targetYears,
  selectedFeeRate,
  handleSingleYearPdfUpload,
  handleBulkPdfUpload,
  handleReanalyzeYearPdf,
  handleDownloadPdf,
  handleAddYear,
  handleRemoveYear,
  handleFeeRateChange
}) => {
  return (
    <div style={{ overflowX: 'auto', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '1100px' }}>
        <thead>
          {/* Year columns header */}
          <tr style={{ backgroundColor: '#bae6fd', color: '#0369a1', fontWeight: 'bold', textAlign: 'center' }}>
            <th colSpan={2} style={{ width: '220px', border: '1px solid #cbd5e1', padding: '8px', position: 'relative' }}>
              연도별 정산 연도
              <button
                type="button"
                onClick={handleAddYear}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '2px 6px',
                  fontSize: '12px',
                  backgroundColor: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'normal'
                }}
              >
                <Plus size={12} /> 연도 추가
              </button>
            </th>
            {targetYears.map(yr => (
              <th key={yr} style={{ border: '1px solid #cbd5e1', padding: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span>{yr}년도</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveYear(yr)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="연도 삭제"
                  >
                    <X size={12} />
                  </button>
                </div>
              </th>
            ))}
            <th style={{ border: '1px solid #cbd5e1', padding: '8px', width: '120px' }}>합계금액</th>
          </tr>
        </thead>
        <tbody>
          {/* PDF File Selection Row */}
          <tr style={{ backgroundColor: '#fef08a' }}>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span>PDF파일 선택</span>
                <label style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 'bold',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  <FileSpreadsheet size={12} />
                  📁 PDF 5개 한꺼번에 자동분석
                  <input 
                    type="file" 
                    accept=".pdf" 
                    multiple
                    style={{ display: 'none' }} 
                    onChange={handleBulkPdfUpload} 
                  />
                </label>
              </div>
            </td>
            {targetYears.map(yr => {
              const yrData = regForm.years[yr];
              const hasPdf = yrData?.isFileUploaded || Boolean(yrData?.fileURL) || Boolean(yrData?.pdfUrl) || Boolean(yrData?.pdfFile);
              return (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                    {hasPdf ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(yr)}
                          style={{
                            backgroundColor: '#15803d',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            fontSize: '11px',
                            padding: '4px 10px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}
                        >
                          다운로드
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReanalyzeYearPdf(yr)}
                          style={{
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            fontSize: '11px',
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}
                          title="PDF 원본을 다시 분석하여 최신 로직으로 세액 및 환급금을 자동 교정합니다."
                        >
                          🔄 PDF 재분석
                        </button>
                      </>
                    ) : (
                      <input 
                        type="file" 
                        accept=".pdf" 
                        multiple
                        style={{ fontSize: '12px', width: '150px' }} 
                        onChange={(e) => handleSingleYearPdfUpload(e, yr)} 
                      />
                    )}
                  </div>
                </td>
              );
            })}
            <td style={{ border: '1px solid #cbd5e1', backgroundColor: '#e2e8f0' }}></td>
          </tr>

          {/* Work Details Row Group */}
          <tr>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', backgroundColor: '#f8fafc', fontWeight: 'bold', textAlign: 'center' }}>적용연도</td>
            {targetYears.map(yr => <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>{yr}</td>)}
            <td style={{ border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }}></td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', backgroundColor: '#f8fafc', fontWeight: 'bold', textAlign: 'center' }}>근무기간</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'center' }}
                  value={regForm.years[yr]?.workPeriod || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], workPeriod: val } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }}></td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', backgroundColor: '#f8fafc', fontWeight: 'bold', textAlign: 'center' }}>근무처명</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'center' }}
                  value={regForm.years[yr]?.workPlace || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], workPlace: val } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }}></td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', backgroundColor: '#f8fafc', fontWeight: 'bold', textAlign: 'center' }}>사업자등록번호</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'center' }}
                  value={regForm.years[yr]?.businessNumber || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], businessNumber: val } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }}></td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', backgroundColor: '#f8fafc', fontWeight: 'bold', textAlign: 'center' }}>생년월일</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'center' }}
                  value={regForm.years[yr]?.birthDate || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], birthDate: val } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }}></td>
          </tr>

          {/* Financial values (Zebra rows, light purple headers on left) */}
          {/* 1. 급여 -> 총급여, 계 */}
          <tr style={{ backgroundColor: '#faf5ff' }}>
            <td rowSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#7e22ce', backgroundColor: '#f3e8ff', verticalAlign: 'middle' }}>급여</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#7e22ce', backgroundColor: '#faf5ff' }}>총급여</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.salaryTotal || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], salaryTotal: val, active: true } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#f3e8ff' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.salaryTotal) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>
          <tr style={{ backgroundColor: '#faf5ff' }}>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#7e22ce', backgroundColor: '#faf5ff' }}>계</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.salaryTotal || '0' : ''}
                  placeholder="-"
                  readOnly
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#f3e8ff' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.salaryTotal) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>

          {/* 2. 과세표준 -> 산출세액 */}
          <tr>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f8fafc' }}>과세표준</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center' }}>산출세액</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.taxBase || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], taxBase: val, active: true } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.taxBase) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>

          {/* 3. 세액감면 -> 중소기업 청년 세액감면 */}
          <tr style={{ backgroundColor: '#faf5ff' }}>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#7e22ce', backgroundColor: '#f3e8ff' }}>세액감면</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#7e22ce', backgroundColor: '#faf5ff' }}>중소기업 청년 세액감면</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.childReduction || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], childReduction: val, active: true } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#f3e8ff' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.childReduction) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>

          {/* 4. 세액공제 -> 근로소득 세액공제 */}
          <tr>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f8fafc' }}>세액공제</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center' }}>근로소득 세액공제</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.childDeduction || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], childDeduction: val, active: true } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.childDeduction) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>

          {/* 5. 결정세액 */}
          <tr style={{ backgroundColor: '#faf5ff' }}>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#7e22ce', backgroundColor: '#faf5ff' }}>결정세액</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.decisionTax || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], decisionTax: val, active: true } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#f3e8ff' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.decisionTax) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>

          {/* 6. 지방세 */}
          <tr>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center' }}>지방세</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.localTax || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], localTax: val, active: true } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.localTax) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>

          {/* 7. 세액합계금액 */}
          <tr style={{ backgroundColor: '#faf5ff' }}>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#7e22ce', backgroundColor: '#faf5ff' }}>세액합계금액</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.taxRefundTotal || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], taxRefundTotal: val, active: true } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#f3e8ff' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.taxRefundTotal) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>

          {/* 8. 중소기업 청년 세액감면 적용 */}
          <tr>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#e0f2fe', color: '#0369a1' }}>중소기업 청년 세액감면 적용</td>
            {targetYears.map(yr => {
              const yearData = regForm.years[yr];
              const isFileUploaded = Boolean(yearData?.isFileUploaded);
              const applyVal = yearData?.childReductionApply;

              const eligibility = checkYouthEligibility(regForm.foreignerNumber, regForm.residentAddress);
              const isEligible = eligibility.isEligible;

              const isApplied = isEligible && Boolean(
                applyVal !== 'N' && 
                applyVal !== '0' && 
                (applyVal === 'Y' || applyVal === '90%' || Number(yearData?.childReductionApplyAmt) > 0)
              );

              return (
                <td 
                  key={yr} 
                  style={{ 
                    border: '1px solid #cbd5e1', 
                    padding: isFileUploaded ? '6px' : '2px', 
                    textAlign: 'center', 
                    cursor: isEligible && isFileUploaded ? 'pointer' : 'default', 
                    userSelect: 'none',
                    backgroundColor: !isEligible ? '#fef2f2' : ''
                  }}
                  onClick={() => {
                    if (isEligible && isFileUploaded) {
                      setRegForm((prev: any) => ({
                        ...prev,
                        years: {
                          ...prev.years,
                          [yr]: {
                            ...prev.years[yr],
                            childReductionApply: isApplied ? 'N' : 'Y'
                          }
                        }
                      }));
                    }
                  }}
                >
                  {!isEligible ? (
                    <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 'bold', display: 'inline-block', padding: '2px 4px', borderRadius: '4px', backgroundColor: '#fee2e2' }}>
                      ❌ 대상 아님 (만 {eligibility.age}세)
                    </span>
                  ) : !isFileUploaded ? (
                    <input
                      type="text"
                      className="form-control"
                      style={{ height: '28px', fontSize: '12px', textAlign: 'center' }}
                      value={(!yearData?.childReductionApply || yearData?.childReductionApply === '0') ? '90%' : yearData?.childReductionApply}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRegForm((prev: any) => ({
                          ...prev,
                          years: {
                            ...prev.years,
                            [yr]: {
                              ...prev.years[yr],
                              childReductionApply: val
                            }
                          }
                        }));
                      }}
                      placeholder="90%"
                    />
                  ) : isApplied ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11" cy="11" r="10" fill="#22c55e"/>
                        <path d="M7 11.2L9.8 14L15 8.2" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ) : (
                    <span style={{ color: '#64748b', fontWeight: 'normal' }}>-</span>
                  )}
                </td>
              );
            })}
            <td style={{ border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }}></td>
          </tr>

          {/* Row 2: 세액감면 & 중소기업 청년 세액감면 */}
          <tr>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#e0f2fe', color: '#0369a1', width: '120px' }}>세액감면</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f8fafc' }}>중소기업 청년 세액감면</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.childReductionApplyAmt || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], childReductionApplyAmt: val, active: true } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#f1f5f9' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.childReductionApplyAmt) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>

          {/* Row 3: 세액공제 & 근로소득 세액공제(변경) */}
          <tr>
            <td rowSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#e0f2fe', color: '#0369a1', verticalAlign: 'middle' }}>세액공제</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f8fafc' }}>근로소득 세액공제(변경)</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.childDeductionApplyAmt || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], childDeductionApplyAmt: val, active: true } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#f1f5f9' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.childDeductionApplyAmt) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>

          {/* Row 4: 결정세액(변경) */}
          <tr>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f8fafc' }}>결정세액(변경)</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.decisionTaxApplyAmt || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], decisionTaxApplyAmt: val, active: true } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#f1f5f9' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.decisionTaxApplyAmt) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>

          {/* Row 5: 지방세액(변경) */}
          <tr>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#e0f2fe', color: '#0369a1' }}>지방세액(변경)</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.localTaxApplyAmt || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], localTaxApplyAmt: val, active: true } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#f1f5f9' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.localTaxApplyAmt) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>

          {/* Row 6: 세액합계금액(변경) */}
          <tr>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#e0f2fe', color: '#0369a1' }}>세액합계금액(변경)</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.decisionTaxRefundAmt || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], decisionTaxRefundAmt: val, active: true } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#f1f5f9' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.decisionTaxRefundAmt) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>

          {/* Expected Refund Section */}
          <tr style={{ backgroundColor: '#fef9c3' }}>
            <td rowSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#854d0e', backgroundColor: '#fef08a', verticalAlign: 'middle' }}>환급예상금액</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#854d0e', backgroundColor: '#fef9c3' }}>국세환급금</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right', backgroundColor: '#fffbeb' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.refundExpectNational || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const local = Number(regForm.years[yr]?.refundExpectLocal) || 0;
                    const newCourtFee = (Number(val) || 0) + local;
                    const newFee = Math.round(newCourtFee * (selectedFeeRate / 100));
                    setRegForm((prev: any) => ({
                      ...prev,
                      years: {
                        ...prev.years,
                        [yr]: {
                          ...prev.years[yr],
                          refundExpectNational: val,
                          courtFee: String(newCourtFee),
                          expectedFeeAmt: String(newFee),
                          active: true
                        }
                      }
                    }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#fef08a' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.refundExpectNational) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>
          <tr style={{ backgroundColor: '#fef9c3' }}>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#854d0e', backgroundColor: '#fef9c3' }}>지방세 환급금</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right', backgroundColor: '#fffbeb' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.refundExpectLocal || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nat = Number(regForm.years[yr]?.refundExpectNational) || 0;
                    const newCourtFee = nat + (Number(val) || 0);
                    const newFee = Math.round(newCourtFee * (selectedFeeRate / 100));
                    setRegForm((prev: any) => ({
                      ...prev,
                      years: {
                        ...prev.years,
                        [yr]: {
                          ...prev.years[yr],
                          refundExpectLocal: val,
                          courtFee: String(newCourtFee),
                          expectedFeeAmt: String(newFee),
                          active: true
                        }
                      }
                    }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#fef08a' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.refundExpectLocal) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>

          {/* Row 9: 3.3% 총 환급 합계금액 */}
          <tr style={{ backgroundColor: '#fef9c3' }}>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#854d0e', backgroundColor: '#fef08a' }}>
              총 환급 합계금액
            </td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', fontWeight: 'bold', color: '#854d0e' }}>
                {regForm.years[yr]?.active ? `${Number(regForm.years[yr]?.courtFee || 0).toLocaleString()}원` : '-'}
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '6px', backgroundColor: '#fef08a', color: '#854d0e', fontSize: '13px' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.courtFee) || 0 : 0), 0).toLocaleString()}원
            </td>
          </tr>

          {/* Row: 적용 부양가족 수 / 소득공제 */}
          <tr style={{ backgroundColor: '#f0fdf4' }}>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#15803d', backgroundColor: '#dcfce7' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>👨‍👩‍👧‍👦</span>
                <span>적용 부양가족 수 / 인적공제</span>
              </div>
            </td>
            {targetYears.map(yr => {
              const totalDeps = regForm.dependentsCount + regForm.seniorCount + regForm.disabledCount + regForm.childCount;
              const totalDeductionVal = (regForm.dependentsCount * 150) + (regForm.seniorCount * 100) + (regForm.disabledCount * 200);
              return (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center', fontSize: '11px', color: '#15803d', fontWeight: 'bold', backgroundColor: '#f0fdf4' }}>
                  {totalDeps > 0 ? `${totalDeps}명 (+${totalDeductionVal}만 원 공제)` : '본인 기본공제'}
                </td>
              );
            })}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', padding: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '12px' }}>
              {(regForm.dependentsCount + regForm.seniorCount + regForm.disabledCount + regForm.childCount) > 0 ? `부양가족 총 ${regForm.dependentsCount + regForm.seniorCount + regForm.disabledCount + regForm.childCount}명 반영` : '본인 공제 반영'}
            </td>
          </tr>

          {/* Row 10: 적용 부양가족 환급금 */}
          <tr style={{ backgroundColor: '#f0fdf4' }}>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#15803d', backgroundColor: '#dcfce7' }}>
              적용 부양가족 환급금
            </td>
            {targetYears.map(yr => {
              const yrData = regForm.years[yr];
              const depRefund = Number(yrData?.dependentRefundTotal) || 0;
              return (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', color: '#15803d' }}>
                  {yrData?.active ? `+${depRefund.toLocaleString()}원` : '-'}
                </td>
              );
            })}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '6px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '13px' }}>
              +{targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.dependentRefundTotal) || 0 : 0), 0).toLocaleString()}원
            </td>
          </tr>

          <tr style={{ backgroundColor: '#fef9c3' }}>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', color: '#854d0e', backgroundColor: '#fef08a' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>예상수수료금액</span>
                <select
                  value={selectedFeeRate}
                  onChange={(e) => handleFeeRateChange(Number(e.target.value))}
                  style={{
                    padding: '2px 4px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    color: '#334155',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    height: '24px'
                  }}
                >
                  {[30, 28, 26, 24, 22, 20, 19, 18, 17, 16, 15].map(pct => (
                    <option key={pct} value={pct}>{pct}%</option>
                  ))}
                </select>
              </div>
            </td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                <input
                  type="number"
                  className="form-control"
                  style={{ height: '28px', fontSize: '12px', textAlign: 'right', backgroundColor: '#fffbeb' }}
                  value={regForm.years[yr]?.active ? regForm.years[yr]?.expectedFeeAmt || '0' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegForm((prev: any) => ({ ...prev, years: { ...prev.years, [yr]: { ...prev.years[yr], expectedFeeAmt: val, active: true } } }));
                  }}
                  placeholder="-"
                />
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#fef08a' }}>
              {targetYears.reduce((sum, yr) => sum + (regForm.years[yr]?.active ? Number(regForm.years[yr]?.expectedFeeAmt) || 0 : 0), 0).toLocaleString()}
            </td>
          </tr>

          {/* 세액재정정 경정 청구서 파일 row */}
          <tr style={{ backgroundColor: '#fef08a' }}>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#fef08a', color: '#854d0e' }}>
              세액재정정 경정 청구서 파일
            </td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    style={{ fontSize: '12px', width: '150px' }} 
                  />
                </div>
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1' }}></td>
          </tr>

          {/* PDF file attachment row at the very bottom */}
          <tr style={{ backgroundColor: '#f1f5f9' }}>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center' }}>세액결정 경정 청구서 파일</td>
            {targetYears.map(yr => (
              <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                  <input type="file" style={{ fontSize: '12px', width: '150px' }} />
                </div>
              </td>
            ))}
            <td style={{ border: '1px solid #cbd5e1' }}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
