import React from 'react';
import { Upload } from 'lucide-react';

interface FreelancerSettlementTableProps {
  regForm: any;
  setRegForm: React.Dispatch<React.SetStateAction<any>>;
  targetYears: string[];
  selectedFeeRate: number;
  handleFreelancerSingleYearPdfUpload: (e: React.ChangeEvent<HTMLInputElement>, fallbackYr?: string) => Promise<void>;
  handleBulkPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleFeeRateChange: (rate: number) => void;
}

export const FreelancerSettlementTable: React.FC<FreelancerSettlementTableProps> = ({
  regForm,
  setRegForm,
  targetYears,
  selectedFeeRate,
  handleFreelancerSingleYearPdfUpload,
  handleBulkPdfUpload,
  handleFeeRateChange: _handleFeeRateChange
}) => {
  return (
    <div style={{ marginTop: '24px', marginBottom: '24px', border: '2px solid #0d9488', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
      {/* Header Banner */}
      <div style={{ backgroundColor: '#0f766e', color: '#ffffff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>📋</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
              3.3% 사업소득자 (프리랜서 / 지급명세서) 5개년 정산 내역
            </h3>
            <span style={{ fontSize: '12px', color: '#ccfbf1', fontWeight: 'normal' }}>
              원천징수 3.3%(국세 3.0% + 지방소득세 0.3%) 사업소득 지급명세서 데이터를 통한 정산 및 환급 계산
            </span>
          </div>
        </div>
        <label style={{
          backgroundColor: '#14b8a6',
          color: '#ffffff',
          padding: '6px 14px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
        }}>
          <Upload size={14} /> 📁 3.3% 지급명세서 PDF 일괄 분석
          <input
            type="file"
            multiple
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={handleBulkPdfUpload}
          />
        </label>
      </div>

      {/* 3.3% Table */}
      <div className="table-scroll-container">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '1100px' }}>
          <thead>
            <tr style={{ backgroundColor: '#ccfbf1', color: '#115e59', fontWeight: 'bold', textAlign: 'center' }}>
              <th colSpan={2} style={{ width: '220px', border: '1px solid #99f6e4', padding: '8px' }}>
                연도별 정산 연도
              </th>
              {targetYears.map(yr => (
                <th key={yr} style={{ border: '1px solid #99f6e4', padding: '8px', width: '150px' }}>
                  {yr}년도 (3.3%)
                </th>
              ))}
              <th style={{ width: '160px', border: '1px solid #99f6e4', padding: '8px', backgroundColor: '#99f6e4', color: '#0f766e' }}>
                5개년 합계
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1: PDF File upload per year */}
            <tr style={{ backgroundColor: '#f0fdf4' }}>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#115e59' }}>
                3.3% 지급명세서 파일
              </td>
              {targetYears.map(yr => (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>
                  <input
                    type="file"
                    accept=".pdf"
                    style={{ fontSize: '11px', width: '140px' }}
                    onChange={(e) => handleFreelancerSingleYearPdfUpload(e, yr)}
                  />
                </td>
              ))}
              <td style={{ border: '1px solid #cbd5e1', backgroundColor: '#f0fdf4' }}></td>
            </tr>

            {/* Row 2: 지급자 상호명 */}
            <tr>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                지급자 (상호명)
              </td>
              {targetYears.map(yr => (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ height: '28px', fontSize: '12px' }}
                    value={regForm.freelancerYears?.[yr]?.workPlace || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRegForm((prev: any) => ({
                        ...prev,
                        freelancerYears: {
                          ...prev.freelancerYears,
                          [yr]: { ...prev.freelancerYears?.[yr], workPlace: val, active: true }
                        }
                      }));
                    }}
                    placeholder="상호명 기입"
                  />
                </td>
              ))}
              <td style={{ border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}></td>
            </tr>

            {/* Row 3: 사업자등록번호 */}
            <tr>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                사업자등록번호
              </td>
              {targetYears.map(yr => (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ height: '28px', fontSize: '12px' }}
                    value={regForm.freelancerYears?.[yr]?.businessNumber || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRegForm((prev: any) => ({
                        ...prev,
                        freelancerYears: {
                          ...prev.freelancerYears,
                          [yr]: { ...prev.freelancerYears?.[yr], businessNumber: val, active: true }
                        }
                      }));
                    }}
                    placeholder="000-00-00000"
                  />
                </td>
              ))}
              <td style={{ border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}></td>
            </tr>

            {/* Row 4: 총 수입금액 (연간 지급총액) */}
            <tr style={{ backgroundColor: '#f0fdf4' }}>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#065f46' }}>
                총 수입금액 (연 수령액)
              </td>
              {targetYears.map(yr => (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                  <input
                    type="number"
                    className="form-control"
                    style={{ height: '28px', fontSize: '12px', textAlign: 'right', fontWeight: 'bold' }}
                    value={regForm.freelancerYears?.[yr]?.active ? regForm.freelancerYears?.[yr]?.totalIncome || '0' : ''}
                    onChange={(e) => {
                      const income = Number(e.target.value) || 0;
                      const tax3 = Math.round(income * 0.03);
                      const tax03 = Math.round(tax3 * 0.1);
                      const total33 = tax3 + tax03;
                      const feeAmt = Math.round(total33 * (selectedFeeRate / 100));

                      setRegForm((prev: any) => ({
                        ...prev,
                        freelancerYears: {
                          ...prev.freelancerYears,
                          [yr]: {
                            ...prev.freelancerYears?.[yr],
                            totalIncome: String(income),
                            withholdingTax3: String(tax3),
                            localTax03: String(tax03),
                            totalWithholding33: String(total33),
                            refundExpectNational: String(tax3),
                            refundExpectLocal: String(tax03),
                            courtFee: String(total33),
                            expectedFeeAmt: String(feeAmt),
                            active: true
                          }
                        }
                      }));
                    }}
                    placeholder="0"
                  />
                </td>
              ))}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#d1fae5', color: '#065f46' }}>
                {targetYears.reduce((sum, yr) => sum + (regForm.freelancerYears?.[yr]?.active ? Number(regForm.freelancerYears?.[yr]?.totalIncome) || 0 : 0), 0).toLocaleString()}원
              </td>
            </tr>

            {/* Row 5: 기납부 소득세 (3.0%) */}
            <tr>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                기납부 소득세 (3.0%)
              </td>
              {targetYears.map(yr => (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', color: '#475569' }}>
                  {regForm.freelancerYears?.[yr]?.active ? `${Number(regForm.freelancerYears?.[yr]?.withholdingTax3 || 0).toLocaleString()}원` : '-'}
                </td>
              ))}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', padding: '4px', backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>
                {targetYears.reduce((sum, yr) => sum + (regForm.freelancerYears?.[yr]?.active ? Number(regForm.freelancerYears?.[yr]?.withholdingTax3) || 0 : 0), 0).toLocaleString()}원
              </td>
            </tr>

            {/* Row 6: 기납부 지방소득세 (0.3%) */}
            <tr>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                기납부 지방소득세 (0.3%)
              </td>
              {targetYears.map(yr => (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', color: '#475569' }}>
                  {regForm.freelancerYears?.[yr]?.active ? `${Number(regForm.freelancerYears?.[yr]?.localTax03 || 0).toLocaleString()}원` : '-'}
                </td>
              ))}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', padding: '4px', backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>
                {targetYears.reduce((sum, yr) => sum + (regForm.freelancerYears?.[yr]?.active ? Number(regForm.freelancerYears?.[yr]?.localTax03) || 0 : 0), 0).toLocaleString()}원
              </td>
            </tr>

            {/* Row 7: 기납부 세액 총계 (3.3%) */}
            <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#334155' }}>
                기납부 세액 합계 (3.3%)
              </td>
              {targetYears.map(yr => (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', color: '#0f766e' }}>
                  {regForm.freelancerYears?.[yr]?.active ? `${Number(regForm.freelancerYears?.[yr]?.totalWithholding33 || 0).toLocaleString()}원` : '-'}
                </td>
              ))}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', padding: '4px', backgroundColor: '#e2e8f0', color: '#0f766e' }}>
                {targetYears.reduce((sum, yr) => sum + (regForm.freelancerYears?.[yr]?.active ? Number(regForm.freelancerYears?.[yr]?.totalWithholding33) || 0 : 0), 0).toLocaleString()}원
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

            {/* Row 8: 국세 환급예상금 (3.0%) */}
            <tr style={{ backgroundColor: '#fef9c3' }}>
              <td style={{ width: '100px', border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#fef08a', color: '#854d0e' }}>
                3.3% 환급예상
              </td>
              <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#854d0e', backgroundColor: '#fef08a' }}>
                국세 환급금 (3.0%)
              </td>
              {targetYears.map(yr => (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                  <input
                    type="number"
                    className="form-control"
                    style={{ height: '28px', fontSize: '12px', textAlign: 'right', backgroundColor: '#fffbeb' }}
                    value={regForm.freelancerYears?.[yr]?.active ? regForm.freelancerYears?.[yr]?.refundExpectNational || '0' : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nat = Number(val) || 0;
                      const loc = Number(regForm.freelancerYears?.[yr]?.refundExpectLocal) || 0;
                      const court = nat + loc;
                      const feeAmt = Math.round(court * (selectedFeeRate / 100));

                      setRegForm((prev: any) => ({
                        ...prev,
                        freelancerYears: {
                          ...prev.freelancerYears,
                          [yr]: {
                            ...prev.freelancerYears?.[yr],
                            refundExpectNational: val,
                            courtFee: String(court),
                            expectedFeeAmt: String(feeAmt),
                            active: true
                          }
                        }
                      }));
                    }}
                    placeholder="0"
                  />
                </td>
              ))}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#fef08a', color: '#854d0e' }}>
                {targetYears.reduce((sum, yr) => sum + (regForm.freelancerYears?.[yr]?.active ? Number(regForm.freelancerYears?.[yr]?.refundExpectNational) || 0 : 0), 0).toLocaleString()}원
              </td>
            </tr>

            {/* Row 9: 지방세 환급예상금 (0.3%) */}
            <tr style={{ backgroundColor: '#fef9c3' }}>
              <td style={{ width: '100px', border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#fef08a', color: '#854d0e' }}>
                3.3% 환급예상
              </td>
              <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', color: '#854d0e', backgroundColor: '#fef08a' }}>
                지방세 환급금 (0.3%)
              </td>
              {targetYears.map(yr => (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                  <input
                    type="number"
                    className="form-control"
                    style={{ height: '28px', fontSize: '12px', textAlign: 'right', backgroundColor: '#fffbeb' }}
                    value={regForm.freelancerYears?.[yr]?.active ? regForm.freelancerYears?.[yr]?.refundExpectLocal || '0' : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const loc = Number(val) || 0;
                      const nat = Number(regForm.freelancerYears?.[yr]?.refundExpectNational) || 0;
                      const court = nat + loc;
                      const feeAmt = Math.round(court * (selectedFeeRate / 100));

                      setRegForm((prev: any) => ({
                        ...prev,
                        freelancerYears: {
                          ...prev.freelancerYears,
                          [yr]: {
                            ...prev.freelancerYears?.[yr],
                            refundExpectLocal: val,
                            courtFee: String(court),
                            expectedFeeAmt: String(feeAmt),
                            active: true
                          }
                        }
                      }));
                    }}
                    placeholder="0"
                  />
                </td>
              ))}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#fef08a', color: '#854d0e' }}>
                {targetYears.reduce((sum, yr) => sum + (regForm.freelancerYears?.[yr]?.active ? Number(regForm.freelancerYears?.[yr]?.refundExpectLocal) || 0 : 0), 0).toLocaleString()}원
              </td>
            </tr>

            {/* Row 10: 3.3% 총 환급 예상금액 */}
            <tr style={{ backgroundColor: '#fef9c3' }}>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#854d0e', backgroundColor: '#fef08a' }}>
                3.3% 총 환급 합계금액
              </td>
              {targetYears.map(yr => (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', fontWeight: 'bold', color: '#854d0e' }}>
                  {regForm.freelancerYears?.[yr]?.active ? `${Number(regForm.freelancerYears?.[yr]?.courtFee || 0).toLocaleString()}원` : '-'}
                </td>
              ))}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '6px', backgroundColor: '#fef08a', color: '#854d0e', fontSize: '13px' }}>
                {targetYears.reduce((sum, yr) => sum + (regForm.freelancerYears?.[yr]?.active ? Number(regForm.freelancerYears?.[yr]?.courtFee) || 0 : 0), 0).toLocaleString()}원
              </td>
            </tr>

            {/* Row: 적용 부양가족 환급금 */}
            <tr style={{ backgroundColor: '#f0fdf4' }}>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', textAlign: 'center', color: '#0f766e', backgroundColor: '#ccfbf1' }}>
                적용 부양가족 환급금
              </td>
              {targetYears.map(yr => (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', color: '#0f766e' }}>
                  -
                </td>
              ))}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#ccfbf1', color: '#0f766e' }}>
                -
              </td>
            </tr>

            {/* Row 11: 3.3% 수수료 금액 */}
            <tr style={{ backgroundColor: '#fef9c3' }}>
              <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold', color: '#854d0e', backgroundColor: '#fef08a', textAlign: 'center' }}>
                3.3% 예상수수료금액 ({selectedFeeRate}%)
              </td>
              {targetYears.map(yr => (
                <td key={yr} style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'right', color: '#b45309', fontWeight: 'bold' }}>
                  {regForm.freelancerYears?.[yr]?.active ? `${Number(regForm.freelancerYears?.[yr]?.expectedFeeAmt || 0).toLocaleString()}원` : '-'}
                </td>
              ))}
              <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', padding: '4px', backgroundColor: '#fef08a', color: '#b45309' }}>
                {targetYears.reduce((sum, yr) => sum + (regForm.freelancerYears?.[yr]?.active ? Number(regForm.freelancerYears?.[yr]?.expectedFeeAmt) || 0 : 0), 0).toLocaleString()}원
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
