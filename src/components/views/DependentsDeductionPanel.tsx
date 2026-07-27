import React from 'react';

interface DependentsDeductionPanelProps {
  regForm: any;
  setRegForm: React.Dispatch<React.SetStateAction<any>>;
  updateDependentsCount: (key: 'dependentsCount' | 'seniorCount' | 'disabledCount' | 'childCount', delta: number) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DependentsDeductionPanel: React.FC<DependentsDeductionPanelProps> = ({
  regForm,
  setRegForm,
  updateDependentsCount,
  showToast
}) => {
  return (
    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '14px 18px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>👨‍👩‍👧‍👦</span>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>
            부양가족 공제 및 세액 감면 설정
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>
            부양가족 등록 시 소득공제(인당 150만 원) 및 세액공제가 추가 적용되어 환급금이 자동 증가합니다.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            총 소득공제: +{((regForm.dependentsCount * 150) + (regForm.seniorCount * 100) + (regForm.disabledCount * 200)).toLocaleString()}만 원
          </span>
          <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            총 세액공제: +{(regForm.childCount * 15).toLocaleString()}만 원
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* 1. 기본 부양가족 */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>기본 부양가족</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>인당 150만 원 공제</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => updateDependentsCount('dependentsCount', -1)}
              style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
            >-</button>
            <span style={{ fontWeight: 'bold', fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{regForm.dependentsCount}명</span>
            <button
              type="button"
              onClick={() => updateDependentsCount('dependentsCount', 1)}
              style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
            >+</button>
          </div>
        </div>

        {/* 2. 만 70세 이상 경로우대 */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>경로우대 (70세 이상)</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>인당 +100만 원 추가</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => updateDependentsCount('seniorCount', -1)}
              style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
            >-</button>
            <span style={{ fontWeight: 'bold', fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{regForm.seniorCount}명</span>
            <button
              type="button"
              onClick={() => updateDependentsCount('seniorCount', 1)}
              style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
            >+</button>
          </div>
        </div>

        {/* 3. 장애인 부양가족 */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>장애인 부양가족</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>인당 +200만 원 추가</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => updateDependentsCount('disabledCount', -1)}
              style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
            >-</button>
            <span style={{ fontWeight: 'bold', fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{regForm.disabledCount}명</span>
            <button
              type="button"
              onClick={() => updateDependentsCount('disabledCount', 1)}
              style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
            >+</button>
          </div>
        </div>

        {/* 4. 자녀 세액공제 */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>공제 대상 자녀</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>인당 15만 원 세액공제</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => updateDependentsCount('childCount', -1)}
              style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
            >-</button>
            <span style={{ fontWeight: 'bold', fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{regForm.childCount}명</span>
            <button
              type="button"
              onClick={() => updateDependentsCount('childCount', 1)}
              style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}
            >+</button>
          </div>
        </div>
      </div>

      {/* File Upload Row for Family Proof Documents */}
      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', display: 'flex', gap: '20px', alignItems: 'center' }}>
        {/* 1. 가족관계증명서 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap' }}>📁 가족관계증명서:</span>
          <input
            type="file"
            accept=".pdf,.jpg,.png,.jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setRegForm((prev: any) => ({ ...prev, familyDocFile: file }));
              if (file) showToast(`가족관계증명서 (${file.name}) 파일이 첨부되었습니다.`, 'info');
            }}
            style={{ fontSize: '12px' }}
          />
          {regForm.familyDocUrl && (
            <a
              href={regForm.familyDocUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '12px', color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}
            >
              [저장된 파일 보기]
            </a>
          )}
        </div>

        {/* 2. 외화 송금영수증 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap' }}>💸 외화 송금영수증:</span>
          <input
            type="file"
            accept=".pdf,.jpg,.png,.jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setRegForm((prev: any) => ({ ...prev, remittanceDocFile: file }));
              if (file) showToast(`송금영수증 (${file.name}) 파일이 첨부되었습니다.`, 'info');
            }}
            style={{ fontSize: '12px' }}
          />
          {regForm.remittanceDocUrl && (
            <a
              href={regForm.remittanceDocUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '12px', color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}
            >
              [저장된 파일 보기]
            </a>
          )}
        </div>
      </div>

    </div>
  );
};
