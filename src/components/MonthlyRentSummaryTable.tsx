import React from 'react';

interface MonthlyRentSummaryTableProps {
  regForm: any;
  targetYears: string[];
}

export const MonthlyRentSummaryTable: React.FC<MonthlyRentSummaryTableProps> = ({
  regForm,
  targetYears
}) => {
  if (regForm.isMonthlyRent !== '가') return null;

  return (
    <div style={{ padding: '0 18px 18px 18px', backgroundColor: '#ffffff' }}>
      <div style={{ 
        borderTop: '1px solid #e2e8f0', 
        paddingTop: '18px', 
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ fontSize: '16px' }}>🏠</span>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>
          월세 세액공제(환급) 경정청구 세부 명세
        </h4>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1000px', border: '1px solid #e2e8f0' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', textAlign: 'center' }}>
            <th style={{ border: '1px solid #e2e8f0', padding: '6px', width: '120px' }}>구분</th>
            {targetYears.map(yr => (
              <th key={yr} style={{ border: '1px solid #e2e8f0', padding: '6px', width: '150px' }}>{yr}년도</th>
            ))}
            <th style={{ border: '1px solid #e2e8f0', padding: '6px', width: '150px', backgroundColor: '#f8fafc' }}>5개년 총계</th>
          </tr>
        </thead>
        <tbody>
          {/* Row 1: 월세 적용 여부 */}
          <tr>
            <td style={{ border: '1px solid #e2e8f0', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f8fafc' }}>
              공제율 적용 구분
            </td>
            {targetYears.map(yr => {
              const currentYearData = (regForm.years || []).find((y: any) => String(y.year) === yr && y.active);
              const totalSalary = Number(currentYearData?.salaryTotal) || 0;
              let rateText = '-';
              if (currentYearData && regForm.isMonthlyRent === '가' && regForm.rentAllHouseholdsNoHouse === '가') {
                if (totalSalary <= 55000000) rateText = '대상 (17%)';
                else if (totalSalary <= 80000000) rateText = '대상 (15%)';
                else rateText = '제외 (소득 초과)';
              } else if (currentYearData && regForm.rentAllHouseholdsNoHouse !== '가') {
                rateText = '제외 (무주택 미충족)';
              }
              return (
                <td key={yr} style={{ border: '1px solid #e2e8f0', padding: '6px', textAlign: 'center', color: '#0284c7', fontWeight: 'bold' }}>
                  {rateText}
                </td>
              );
            })}
            <td style={{ border: '1px solid #e2e8f0', padding: '6px', textAlign: 'center', backgroundColor: '#f8fafc', color: '#64748b' }}>
              -
          </td>
          </tr>

          {/* Row 2: 연간 월세액 납부 총액 */}
          <tr>
            <td style={{ border: '1px solid #e2e8f0', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f8fafc' }}>
              연간 월세액 납부총액
            </td>
            {targetYears.map(yr => {
              const currentYearData = (regForm.years || []).find((y: any) => String(y.year) === yr && y.active);
              const hasRent = currentYearData && regForm.isMonthlyRent === '가' && regForm.monthlyRentFee;
              const rentVal = hasRent ? (Number(regForm.monthlyRentFee) * 12) : 0;
              return (
                <td key={yr} style={{ border: '1px solid #e2e8f0', padding: '6px', textAlign: 'right' }}>
                  {hasRent ? `${rentVal.toLocaleString()}원` : '-'}
                </td>
              );
            })}
            <td style={{ border: '1px solid #e2e8f0', padding: '6px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              {targetYears.reduce((sum, yr) => {
                const currentYearData = (regForm.years || []).find((y: any) => String(y.year) === yr && y.active);
                const rentVal = (currentYearData && regForm.isMonthlyRent === '가' && regForm.monthlyRentFee) ? (Number(regForm.monthlyRentFee) * 12) : 0;
                return sum + rentVal;
              }, 0).toLocaleString()}원
            </td>
          </tr>

          {/* Row 3: 예상 환급액 (소득세 + 지방세 합산) */}
          <tr style={{ backgroundColor: '#f0f9ff' }}>
            <td style={{ border: '1px solid #e2e8f0', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#0369a1', backgroundColor: '#e0f2fe' }}>
              월세 환급 예상액
            </td>
            {targetYears.map(yr => {
              const currentYearData = (regForm.years || []).find((y: any) => String(y.year) === yr && y.active);
              const totalSalary = Number(currentYearData?.salaryTotal) || 0;
              const hasRent = currentYearData && regForm.isMonthlyRent === '가' && regForm.rentAllHouseholdsNoHouse === '가' && regForm.monthlyRentFee;
              
              let refund = 0;
              if (hasRent) {
                const rate = totalSalary <= 55000000 ? 0.17 : (totalSalary <= 80000000 ? 0.15 : 0);
                const rentLimit = Math.min(Number(regForm.monthlyRentFee) * 12, 10000000);
                const nationalRefund = Math.floor(rentLimit * rate);
                const localRefund = Math.floor(nationalRefund * 0.1);
                refund = nationalRefund + localRefund;
              }

              return (
                <td key={yr} style={{ border: '1px solid #e2e8f0', padding: '6px', textAlign: 'right', fontWeight: 'bold', color: '#0369a1' }}>
                  {refund > 0 ? `+${refund.toLocaleString()}원` : '-'}
                </td>
              );
            })}
            <td style={{ border: '1px solid #e2e8f0', padding: '6px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
              {targetYears.reduce((sum, yr) => {
                const currentYearData = (regForm.years || []).find((y: any) => String(y.year) === yr && y.active);
                const totalSalary = Number(currentYearData?.salaryTotal) || 0;
                const hasRent = currentYearData && regForm.isMonthlyRent === '가' && regForm.rentAllHouseholdsNoHouse === '가' && regForm.monthlyRentFee;
                
                let refund = 0;
                if (hasRent) {
                  const rate = totalSalary <= 55000000 ? 0.17 : (totalSalary <= 80000000 ? 0.15 : 0);
                  const rentLimit = Math.min(Number(regForm.monthlyRentFee) * 12, 10000000);
                  const nationalRefund = Math.floor(rentLimit * rate);
                  const localRefund = Math.floor(nationalRefund * 0.1);
                  refund = nationalRefund + localRefund;
                }
                return sum + refund;
              }, 0).toLocaleString()}원
            </td>
          </tr>

          {/* Row 4: 입력 계약정보 요약 */}
          <tr>
            <td style={{ border: '1px solid #e2e8f0', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f8fafc' }}>
              임대차 계약 명세
            </td>
            <td colSpan={targetYears.length + 1} style={{ border: '1px solid #e2e8f0', padding: '6px', color: '#475569' }}>
              {regForm.landlordName ? (
                <div style={{ display: 'flex', gap: '20px' }}>
                  <span><strong>임대인:</strong> {regForm.landlordName} ({regForm.landlordRegNum || '주민번호 미입력'})</span>
                  <span><strong>명의:</strong> {regForm.rentContractor || '본인'} / <strong>세대구분:</strong> {regForm.rentHouseholder || '세대주'}</span>
                  <span><strong>주택정보:</strong> {regForm.rentHousingType || '오피스텔'} / {regForm.rentHousingSize ? `${regForm.rentHousingSize}㎡` : '면적 미입력'}</span>
                  <span><strong>계약기간:</strong> {regForm.rentLeaseStart || '시작일 미정'} ~ {regForm.rentLeaseEnd || '종료일 미정'}</span>
                </div>
              ) : (
                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>상단 폼에 월세 계약 세부 내역을 입력해 주세요.</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
