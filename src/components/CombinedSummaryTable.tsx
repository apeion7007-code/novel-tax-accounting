import React from 'react';

interface CombinedSummaryTableProps {
  regForm: any;
  targetYears: string[];
  selectedFeeRate: number;
  handleFeeRateChange: (rate: number) => void;
  getCombinedRefund: (yr: string) => { refund: number; fee: number };
}

export const CombinedSummaryTable: React.FC<CombinedSummaryTableProps> = ({
  regForm,
  targetYears,
  selectedFeeRate,
  handleFeeRateChange,
  getCombinedRefund
}) => {
  return (
    <div style={{ marginTop: '24px', marginBottom: '24px', border: '2px solid #2563eb', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
      {/* Header Banner */}
      <div style={{ backgroundColor: '#1e3a8a', color: '#ffffff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>📊</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
              근로소득 + 3.3% 사업소득 통합 경정청구 예상 환급 요약
            </h3>
            <span style={{ fontSize: '12px', color: '#bfdbfe', fontWeight: 'normal' }}>
              근로 및 사업소득이 동시에 존재할 경우 종합소득세 세율 합산 구간을 재판정한 정확한 실무용 예상 환급액 요약
            </span>
          </div>
        </div>
      </div>

      {/* Combined Table */}
      <div className="table-scroll-container">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '1100px' }}>
          <thead>
            <tr style={{ backgroundColor: '#dbeafe', color: '#1e3a8a', fontWeight: 'bold', textAlign: 'center' }}>
              <th colSpan={2} style={{ width: '220px', border: '1px solid #bfdbfe', padding: '8px' }}>
                연도별 정산 구분
              </th>
              {targetYears.map(yr => (
                <th key={yr} style={{ border: '1px solid #bfdbfe', padding: '8px', width: '150px' }}>
                  {yr}년도 통합
                </th>
              ))}
              <th style={{ width: '160px', border: '1px solid #bfdbfe', padding: '8px', backgroundColor: '#bfdbfe', color: '#1e3a8a' }}>
                5개년 합계
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1: 근로소득 개별 환급금 */}
            <tr>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                근로소득 예상 환급금 (A)
              </td>
              {targetYears.map(yr => {
                const matchingWageDataList = (regForm.years || []).filter((y: any) => String(y.year) === yr && y.active);
                const hasWage = matchingWageDataList.length > 0;
                const wageRef = matchingWageDataList.reduce((sum: number, yrData: any) => sum + (Number(yrData.refundExpectNational || 0) + Number(yrData.refundExpectLocal || 0)), 0);
                return (
                  <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', color: '#475569' }}>
                    {hasWage ? `${wageRef.toLocaleString()}원` : '-'}
                  </td>
                );
              })}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#f8fafc', color: '#475569' }}>
                {targetYears.reduce((sum, yr) => {
                  const matchingWageDataList = (regForm.years || []).filter((y: any) => String(y.year) === yr && y.active);
                  const wageRef = matchingWageDataList.reduce((sumVal: number, yrData: any) => sumVal + (Number(yrData.refundExpectNational || 0) + Number(yrData.refundExpectLocal || 0)), 0);
                  return sum + wageRef;
                }, 0).toLocaleString()}원
              </td>
            </tr>

            {/* Row 2: 사업소득 개별 환급금 */}
            <tr>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                3.3% 프리랜서 예상 환급금 (B)
              </td>
              {targetYears.map(yr => {
                const freeData = regForm.freelancerYears?.[yr];
                const freeRef = freeData?.active ? (Number(freeData.courtFee || 0)) : 0;
                return (
                  <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', color: '#475569' }}>
                    {freeData?.active ? `${freeRef.toLocaleString()}원` : '-'}
                  </td>
                );
              })}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#f8fafc', color: '#475569' }}>
                {targetYears.reduce((sum, yr) => {
                  const freeData = regForm.freelancerYears?.[yr];
                  const freeRef = freeData?.active ? (Number(freeData.courtFee || 0)) : 0;
                  return sum + freeRef;
                }, 0).toLocaleString()}원
              </td>
            </tr>

            {/* Row 3: 통합 합산 경정청구 예상 환급금 */}
            <tr style={{ backgroundColor: '#eff6ff' }}>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#1e40af', backgroundColor: '#dbeafe' }}>
                통합 경정청구 예상 환급금 (C)
              </td>
              {targetYears.map(yr => {
                const combined = getCombinedRefund(yr);
                const hasWage = (regForm.years || []).some((y: any) => String(y.year) === yr && y.active);
                const isActive = hasWage || regForm.freelancerYears?.[yr]?.active;
                return (
                  <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', fontWeight: 'bold', color: '#1e40af', fontSize: '13px' }}>
                    {isActive ? `${combined.refund.toLocaleString()}원` : '-'}
                  </td>
                );
              })}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '6px', backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '13px' }}>
                {targetYears.reduce((sum, yr) => {
                  const hasWage = (regForm.years || []).some((y: any) => String(y.year) === yr && y.active);
                  const isActive = hasWage || regForm.freelancerYears?.[yr]?.active;
                  return sum + (isActive ? getCombinedRefund(yr).refund : 0);
                }, 0).toLocaleString()}원
              </td>
            </tr>

            {/* Row: 적용 부양가족 수 / 소득공제 */}
            <tr style={{ backgroundColor: '#f0fdf4' }}>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#15803d', backgroundColor: '#dcfce7' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>👨‍&zwj;👩&zwj;👧&zwj;👦</span>
                  <span>적용 부양가족 수 / 인적공제</span>
                </div>
              </td>
              {targetYears.map(yr => {
                const totalDeps = (regForm.dependentsCount || 0) + (regForm.seniorCount || 0) + (regForm.disabledCount || 0) + (regForm.childCount || 0);
                const totalDeductionVal = ((regForm.dependentsCount || 0) * 150) + ((regForm.seniorCount || 0) * 100) + ((regForm.disabledCount || 0) * 200);
                return (
                  <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center', fontWeight: 'bold', color: '#15803d', backgroundColor: '#f0fdf4' }}>
                    {totalDeps > 0 ? `${totalDeps}명 (+${totalDeductionVal}만 원 공제)` : '본인 기본공제'}
                  </td>
                );
              })}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', padding: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '12px' }}>
                {((regForm.dependentsCount || 0) + (regForm.seniorCount || 0) + (regForm.disabledCount || 0) + (regForm.childCount || 0)) > 0 
                  ? `부양가족 총 ${(regForm.dependentsCount || 0) + (regForm.seniorCount || 0) + (regForm.disabledCount || 0) + (regForm.childCount || 0)}명 반영` 
                  : '본인 공제 반영'}
              </td>
            </tr>

            {/* Row: 적용 부양가족 환급금 */}
            <tr style={{ backgroundColor: '#f0fdf4' }}>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#15803d', backgroundColor: '#dcfce7' }}>
                적용 부양가족 환급금
              </td>
              {targetYears.map(yr => {
                const matchingWageDataList = (regForm.years || []).filter((y: any) => String(y.year) === yr && y.active);
                const hasWage = matchingWageDataList.length > 0;
                const depRefund = matchingWageDataList.reduce((sum: number, yrData: any) => sum + (Number(yrData?.dependentRefundTotal) || 0), 0);
                return (
                  <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', color: '#15803d', fontWeight: 'bold' }}>
                    {hasWage ? `+${depRefund.toLocaleString()}원` : '-'}
                  </td>
                );
              })}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#dcfce7', color: '#15803d' }}>
                +{targetYears.reduce((sum, yr) => {
                  const matchingWageDataList = (regForm.years || []).filter((y: any) => String(y.year) === yr && y.active);
                  const depRefund = matchingWageDataList.reduce((sumVal: number, yrData: any) => sumVal + (Number(yrData?.dependentRefundTotal) || 0), 0);
                  return sum + depRefund;
                }, 0).toLocaleString()}원
              </td>
            </tr>

            {/* Row 4: 통합 청구 수수료 */}
            <tr style={{ backgroundColor: '#eff6ff' }}>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', color: '#1e40af', backgroundColor: '#dbeafe', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span>통합 청구 수수료</span>
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
              {targetYears.map(yr => {
                const combined = getCombinedRefund(yr);
                const hasWage = (regForm.years || []).some((y: any) => String(y.year) === yr && y.active);
                const isActive = hasWage || regForm.freelancerYears?.[yr]?.active;
                return (
                  <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', color: '#1e40af', fontWeight: 'bold' }}>
                    {isActive ? `${combined.fee.toLocaleString()}원` : '-'}
                  </td>
                );
              })}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#dbeafe', color: '#1e40af' }}>
                {targetYears.reduce((sum, yr) => {
                  const hasWage = (regForm.years || []).some((y: any) => String(y.year) === yr && y.active);
                  const isActive = hasWage || regForm.freelancerYears?.[yr]?.active;
                  return sum + (isActive ? getCombinedRefund(yr).fee : 0);
                }, 0).toLocaleString()}원
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
