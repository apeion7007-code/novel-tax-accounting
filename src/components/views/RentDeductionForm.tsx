import React from 'react';

interface RentDeductionFormProps {
  regForm: any;
  onChangeRentInfo: (key: string, value: any) => void;
  onChangeRentFile: (key: string, file: File | null) => void;
}

export const RentDeductionForm: React.FC<RentDeductionFormProps> = ({
  regForm,
  onChangeRentInfo,
  onChangeRentFile
}) => {
  if (regForm.isMonthlyRent !== '가') return null;

  return (
    <div style={{
      marginTop: '16px',
      padding: '20px',
      backgroundColor: '#f8fafc',
      border: '1.5px dashed #0284c7',
      borderRadius: '8px',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      animation: 'fadeIn 0.2s ease-in-out'
    }}>
      {/* Title */}
      <h4 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '14px', 
        color: '#0369a1', 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        🏠 월세 세액공제(환급) 경정청구 세부 정보 입력
      </h4>
      
      {/* 4-Column Grid for Input fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        
        {/* 임대인 정보 */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>임대인 성명</label>
          <input 
            type="text" 
            className="form-control" 
            style={{ fontSize: '13px', height: '32px' }} 
            value={regForm.landlordName || ''} 
            onChange={(e) => onChangeRentInfo('landlordName', e.target.value)}
            placeholder="임대인 이름"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>임대인 주민등록번호</label>
          <input 
            type="text" 
            className="form-control" 
            style={{ fontSize: '13px', height: '32px' }} 
            value={regForm.landlordRegNum || ''} 
            onChange={(e) => onChangeRentInfo('landlordRegNum', e.target.value)}
            placeholder="예: 700101-1234567"
          />
        </div>
        
        {/* 주택 정보 */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>주택 유형</label>
          <select 
            className="form-control" 
            style={{ fontSize: '13px', height: '32px', padding: '2px' }} 
            value={regForm.rentHousingType || '오피스텔'} 
            onChange={(e) => onChangeRentInfo('rentHousingType', e.target.value)}
          >
            <option value="단독주택">단독주택</option>
            <option value="다세대주택">다세대주택</option>
            <option value="아파트">아파트</option>
            <option value="오피스텔">주거용 오피스텔</option>
            <option value="고시원">고시원/원룸</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>전용 면적 (㎡)</label>
          <input 
            type="number" 
            className="form-control" 
            style={{ fontSize: '13px', height: '32px' }} 
            value={regForm.rentHousingSize || ''} 
            onChange={(e) => onChangeRentInfo('rentHousingSize', e.target.value)}
            placeholder="예: 59.9"
            step="0.1"
          />
        </div>

        {/* 임대차 계약 명의자 (부양가족 연계) */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>임대차 계약 명의</label>
          <select 
            className="form-control" 
            style={{ fontSize: '13px', height: '32px', padding: '2px' }} 
            value={regForm.rentContractor || '본인'} 
            onChange={(e) => onChangeRentInfo('rentContractor', e.target.value)}
          >
            <option value="본인">근로자 본인 명의</option>
            <option value="부양가족">부양가족(기본공제대상자) 명의</option>
          </select>
        </div>

        {/* 세대주 여부 */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>세대주 구분</label>
          <select 
            className="form-control" 
            style={{ fontSize: '13px', height: '32px', padding: '2px' }} 
            value={regForm.rentHouseholder || '세대주'} 
            onChange={(e) => onChangeRentInfo('rentHouseholder', e.target.value)}
          >
            <option value="세대주">무주택 세대주</option>
            <option value="세대원">무주택 세대원</option>
          </select>
        </div>

        {/* 세대원 전원 무주택 확인 */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>세대원 전원 무주택 여부</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', height: '32px', fontSize: '13px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="rentAllHouseholdsNoHouse" 
                checked={regForm.rentAllHouseholdsNoHouse === '가'} 
                onChange={() => onChangeRentInfo('rentAllHouseholdsNoHouse', '가')}
              /> 확인 (가)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="rentAllHouseholdsNoHouse" 
                checked={regForm.rentAllHouseholdsNoHouse !== '가'} 
                onChange={() => onChangeRentInfo('rentAllHouseholdsNoHouse', '부')}
              /> 부적격 (부)
            </label>
          </div>
        </div>

        {/* 월 임대료 */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>월 임대료 (원)</label>
          <input 
            type="text" 
            className="form-control" 
            style={{ fontSize: '13px', height: '32px' }} 
            value={regForm.monthlyRentFee || ''} 
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              onChangeRentInfo('monthlyRentFee', val);
            }}
            placeholder="숫자만 입력"
          />
        </div>

        {/* 임대차 계약 기간 */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>임대차 계약 기간</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input 
              type="date" 
              className="form-control" 
              style={{ fontSize: '13px', height: '32px' }} 
              value={regForm.rentLeaseStart || ''} 
              onChange={(e) => onChangeRentInfo('rentLeaseStart', e.target.value)}
            />
            <span style={{ fontSize: '13px', color: '#64748b' }}>~</span>
            <input 
              type="date" 
              className="form-control" 
              style={{ fontSize: '13px', height: '32px' }} 
              value={regForm.rentLeaseEnd || ''} 
              onChange={(e) => onChangeRentInfo('rentLeaseEnd', e.target.value)}
            />
          </div>
        </div>

        {/* 연간 월세액 자동 합산 표기 */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>연간 환산액 (자동)</label>
          <div style={{ 
            fontSize: '13px', 
            height: '32px', 
            lineHeight: '32px', 
            padding: '0 10px', 
            backgroundColor: '#e2e8f0', 
            borderRadius: '4px', 
            color: '#334155',
            fontWeight: 'bold'
          }}>
            {regForm.monthlyRentFee ? `${(Number(regForm.monthlyRentFee) * 12).toLocaleString()} 원` : '0 원'}
          </div>
        </div>

        {/* 임대차 계약서 첨부 */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>임대차계약서 사본 첨부</label>
          <input 
            type="file" 
            className="form-control" 
            style={{ fontSize: '13px', height: 'auto', padding: '4px' }} 
            onChange={(e) => onChangeRentFile('rentContractDocFile', e.target.files?.[0] || null)}
          />
          {regForm.rentContractDocUrl && (
            <a href={regForm.rentContractDocUrl} download target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#0284c7', display: 'block', marginTop: '4px', textDecoration: 'underline' }}>
              📄 업로드된 임대차계약서 보기/다운로드
            </a>
          )}
        </div>

        {/* 월세 납부 영수증 첨부 */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>월세 이체 영수증 첨부</label>
          <input 
            type="file" 
            className="form-control" 
            style={{ fontSize: '13px', height: 'auto', padding: '4px' }} 
            onChange={(e) => onChangeRentFile('rentReceiptDocFile', e.target.files?.[0] || null)}
          />
          {regForm.rentReceiptDocUrl && (
            <a href={regForm.rentReceiptDocUrl} download target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#0284c7', display: 'block', marginTop: '4px', textDecoration: 'underline' }}>
              📄 업로드된 이체영수증 보기/다운로드
            </a>
          )}
        </div>

        {/* 도움말 박스 */}
        <div style={{ 
          gridColumn: 'span 4', 
          backgroundColor: '#eff6ff', 
          border: '1px solid #bfdbfe', 
          borderRadius: '6px', 
          padding: '10px 14px', 
          fontSize: '11px',
          color: '#1e40af',
          lineHeight: '1.5'
        }}>
          💡 <b>부양가족 연계 및 세무 팁:</b><br />
          - <b>계약 명의</b>: 기본공제대상자(부양가족) 명의로 체결된 월세 계약도 소득세를 내는 근로자 본인이 월세를 냈다면 환급 공제 가능합니다.<br />
          - <b>무주택 조건</b>: 주민등록표 등본에 함께 등재된 <b>부양가족 세대원 전원이 무주택</b>이어야 세액공제(환급) 자격이 유지됩니다.
        </div>
      </div>
    </div>
  );
};
