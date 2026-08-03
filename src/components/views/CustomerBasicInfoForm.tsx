import React from 'react';
import { RentDeductionForm } from './RentDeductionForm';

interface CustomerBasicInfoFormProps {
  regForm: any;
  setRegForm: React.Dispatch<React.SetStateAction<any>>;
  nationalities: string[];
  visaTypes: string[];
  bankList: string[];
  refundStatuses: string[];
  submissionStatuses: string[];
  onChangeRentInfo: (key: string, value: any) => void;
  onChangeRentFile: (key: string, file: File | null) => void;
}

export const CustomerBasicInfoForm: React.FC<CustomerBasicInfoFormProps> = ({
  regForm,
  setRegForm,
  nationalities,
  visaTypes,
  bankList,
  refundStatuses,
  submissionStatuses,
  onChangeRentInfo,
  onChangeRentFile
}) => {
  return (
    <div style={{ overflowX: 'auto', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '1000px', backgroundColor: '#ffffff' }}>
        <tbody>
          {/* Row 1 Header */}
          <tr style={{ backgroundColor: '#bae6fd', color: '#0369a1', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '13%' }}>신청인</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '11%' }}>외국인 등록번호</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '8%' }}>국적</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '11%' }}>전화번호</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '7%' }}>비자 종류</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '9%' }}>
              {(() => {
                const activeYr = (regForm.years || []).find((y: any) => y.active && y.workPlace);
                return activeYr ? `${activeYr.workPlace} 취업일` : '취업일';
              })()}
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '9%' }}>비자만료일</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '7%' }}>월세여부</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '15%' }}>환급금 입금계좌</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px', width: '10%' }}>환급처리상태</td>
          </tr>
          {/* Row 1 Inputs */}
          <tr>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <input type="text" className="form-control" style={{ fontSize: '13px', height: '32px' }} value={regForm.name} onChange={(e) => setRegForm((prev: any) => ({ ...prev, name: e.target.value }))} placeholder="이름 입력" />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <input type="text" className="form-control" style={{ fontSize: '13px', height: '32px' }} value={regForm.foreignerNumber} onChange={(e) => setRegForm((prev: any) => ({ ...prev, foreignerNumber: e.target.value }))} placeholder="890528-5580013" />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <select className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.nationality} onChange={(e) => setRegForm((prev: any) => ({ ...prev, nationality: e.target.value }))}>
                {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <select
                  className="form-control"
                  style={{ fontSize: '13px', height: '32px', padding: '2px', width: '65px', flexShrink: 0 }}
                  value={regForm.telecom || 'SKT'}
                  onChange={(e) => setRegForm((prev: any) => ({ ...prev, telecom: e.target.value }))}
                >
                  <option value="SKT">SKT</option>
                  <option value="KT">KT</option>
                  <option value="LGU+">LGU+</option>
                  <option value="알뜰폰">알뜰폰</option>
                  <option value="기타">기타</option>
                </select>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '13px', height: '32px', flexGrow: 1 }}
                  value={regForm.phone}
                  onChange={(e) => setRegForm((prev: any) => ({ ...prev, phone: e.target.value }))}
                  placeholder="010-XXXX-XXXX"
                />
              </div>
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <select className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.visaType} onChange={(e) => setRegForm((prev: any) => ({ ...prev, visaType: e.target.value }))}>
                {visaTypes.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <input type="date" className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.residentAddress} onChange={(e) => setRegForm((prev: any) => ({ ...prev, residentAddress: e.target.value }))} />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <input type="date" className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.visaExpiry} onChange={(e) => setRegForm((prev: any) => ({ ...prev, visaExpiry: e.target.value }))} />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', fontSize: '13px', height: '32px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                  <input type="radio" name="isMonthlyRent" checked={regForm.isMonthlyRent === '가'} onChange={() => onChangeRentInfo('isMonthlyRent', '가')} /> 가
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                  <input type="radio" name="isMonthlyRent" checked={regForm.isMonthlyRent !== '가'} onChange={() => onChangeRentInfo('isMonthlyRent', '부')} /> 부
                </label>
              </div>
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <select
                  className="form-control"
                  style={{ fontSize: '13px', height: '32px', padding: '2px', width: '95px', flexShrink: 0 }}
                  value={regForm.refundBankName || 'KB국민은행'}
                  onChange={(e) => setRegForm((prev: any) => ({ ...prev, refundBankName: e.target.value }))}
                >
                  {bankList.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '13px', height: '32px', flexGrow: 1 }}
                  value={regForm.refundBank}
                  onChange={(e) => setRegForm((prev: any) => ({ ...prev, refundBank: e.target.value }))}
                  placeholder="계좌번호 입력"
                />
              </div>
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <select className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.refundStatus} onChange={(e) => setRegForm((prev: any) => ({ ...prev, refundStatus: e.target.value }))}>
                {refundStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </td>
          </tr>

          {/* Row 2 Header */}
          <tr style={{ backgroundColor: '#bae6fd', color: '#0369a1', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px' }}>주민등록상 주소지</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>감면명세서 제출상태</td>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '6px' }}>기존 감면명세서 적용기간</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>감면명세서 발송일</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>경정청구일</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>추가환급 여부</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>추가 신청예정일</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>수수료수납선택</td>
          </tr>
          {/* Row 2 Inputs */}
          <tr>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <input type="text" className="form-control" style={{ fontSize: '13px', height: '32px' }} value={regForm.residentRegisterAddress} onChange={(e) => setRegForm((prev: any) => ({ ...prev, residentRegisterAddress: e.target.value }))} placeholder="주소지 도로명 주소" />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <select className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.deductionSubmissionStatus} onChange={(e) => setRegForm((prev: any) => ({ ...prev, deductionSubmissionStatus: e.target.value }))}>
                {submissionStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </td>
            <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="date"
                  className="form-control"
                  style={{ fontSize: '12px', height: '32px', padding: '2px' }}
                  value={regForm.taxReductionApplyDateStart || ''}
                  onChange={(e) => setRegForm((prev: any) => ({ ...prev, taxReductionApplyDateStart: e.target.value }))}
                />
                <span style={{ fontSize: '12px' }}>~</span>
                <input
                  type="date"
                  className="form-control"
                  style={{ fontSize: '12px', height: '32px', padding: '2px' }}
                  value={regForm.taxReductionApplyDateEnd || ''}
                  onChange={(e) => setRegForm((prev: any) => ({ ...prev, taxReductionApplyDateEnd: e.target.value }))}
                />
              </div>
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <input type="date" className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.deductionSentDate} onChange={(e) => setRegForm((prev: any) => ({ ...prev, deductionSentDate: e.target.value }))} />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <input type="date" className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.claimCompleteDate} onChange={(e) => setRegForm((prev: any) => ({ ...prev, claimCompleteDate: e.target.value }))} />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', fontSize: '13px', height: '32px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                  <input type="radio" name="addRefund" checked={regForm.additionalApplyPerformance === '가'} onChange={() => setRegForm((prev: any) => ({ ...prev, additionalApplyPerformance: '가' }))} /> 가
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                  <input type="radio" name="addRefund" checked={regForm.additionalApplyPerformance !== '가'} onChange={() => setRegForm((prev: any) => ({ ...prev, additionalApplyPerformance: '부' }))} /> 부
                </label>
              </div>
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <input type="date" className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.claimRequestDate} onChange={(e) => setRegForm((prev: any) => ({ ...prev, claimRequestDate: e.target.value }))} />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <select className="form-control" style={{ fontSize: '13px', height: '32px', padding: '2px' }} value={regForm.feePaymentStatus} onChange={(e) => setRegForm((prev: any) => ({ ...prev, feePaymentStatus: e.target.value }))}>
                <option value="후불 22%">후불 22%</option>
                <option value="선불 17%">선불 17%</option>
                <option value="선불10%, 후불10%">선불10%, 후불10%</option>
              </select>
            </td>
          </tr>

          {/* Row 3 Header */}
          <tr style={{ backgroundColor: '#bae6fd', color: '#0369a1', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>홈택스 아이디</td>
            <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>홈택스 비밀번호</td>
            <td colSpan={8} style={{ border: '1px solid #cbd5e1', padding: '6px' }}></td>
          </tr>
          {/* Row 3 Inputs */}
          <tr>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <input 
                type="text" 
                className="form-control" 
                style={{ fontSize: '13px', height: '32px' }} 
                value={regForm.hometaxId || ''} 
                onChange={(e) => setRegForm((prev: any) => ({ ...prev, hometaxId: e.target.value }))} 
                placeholder="홈택스 ID" 
              />
            </td>
            <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
              <input 
                type="text" 
                className="form-control" 
                style={{ fontSize: '13px', height: '32px' }} 
                value={regForm.hometaxPw || ''} 
                onChange={(e) => setRegForm((prev: any) => ({ ...prev, hometaxPw: e.target.value }))} 
                placeholder="홈택스 비밀번호" 
              />
            </td>
            <td colSpan={8} style={{ border: '1px solid #cbd5e1', padding: '4px' }}></td>
          </tr>
        </tbody>
      </table>
      <RentDeductionForm 
        regForm={regForm} 
        onChangeRentInfo={onChangeRentInfo} 
        onChangeRentFile={onChangeRentFile} 
      />
    </div>
  );
};
