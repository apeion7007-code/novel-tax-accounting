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
  const handleDownloadFile = async (url: string, fileName: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast(`${fileName} 파일 다운로드가 완료되었습니다.`, 'success');
    } catch (err) {
      console.error('Download error:', err);
      window.open(url, '_blank');
    }
  };

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
            <div style={{ fontSize: '11px', color: '#64748b' }}>연도별 세액공제 차등 적용</div>
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

      {/* 자녀 세액공제 상세 안내 카드 */}
      <div style={{ 
        marginTop: '12px', 
        padding: '10px 14px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '6px', 
        border: '1px solid #cbd5e1',
        fontSize: '12px', 
        color: '#475569', 
        lineHeight: '1.6' 
      }}>
        <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>📢 자녀 세액공제 적용 기준 안내</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <strong style={{ color: '#0f766e' }}>📅 2021년 ~ 2023년 귀속:</strong>
            <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyleType: 'disc' }}>
              <li>자녀 1명 : 15만 원</li>
              <li>자녀 2명 : 30만 원</li>
              <li>자녀 3명 이상 : 30만 원 + (자녀수 - 2) × 30만 원</li>
            </ul>
          </div>
          <div>
            <strong style={{ color: '#0369a1' }}>📅 2024년 ~ 2025년 귀속 (세법 개정 적용):</strong>
            <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyleType: 'disc' }}>
              <li>자녀 1명 : 25만 원</li>
              <li>자녀 2명 : 55만 원</li>
              <li>자녀 3명 이상 : 55만 원 + (자녀수 - 2) × 40만 원</li>
            </ul>
          </div>
        </div>
      </div>

      {/* File Upload Row for Family Proof Documents */}
      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 1. 가족관계증명서 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap' }}>📁 가족관계증명서 (여러 개 가능):</span>
            <input
              type="file"
              accept=".pdf,.jpg,.png,.jpeg"
              multiple
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                if (files.length > 0) {
                  setRegForm((prev: any) => ({
                    ...prev,
                    familyDocFile: [...(prev.familyDocFile || []), ...files]
                  }));
                  showToast(`${files.length}개의 가족관계증명서 파일이 첨부되었습니다.`, 'info');
                }
              }}
              style={{ fontSize: '12px' }}
            />
          </div>
          
          {/* 업로드된 파일 & 대기 파일 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
            {/* 이미 저장된 URL 리스트 */}
            {Array.isArray(regForm.familyDocUrl) && regForm.familyDocUrl.map((url: string, index: number) => {
              if (!url) return null;
              const parts = decodeURIComponent(url.substring(url.lastIndexOf('/') + 1)).split('_');
              const fileName = parts.length > 3 ? parts.slice(3).join('_') : parts.join('_');
              return (
                <div key={`url-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#059669' }}>💾 {fileName}</span>
                  <a href={url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>[보기]</a>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(url, fileName)}
                    style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: '12px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    [다운로드]
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegForm((prev: any) => ({
                        ...prev,
                        familyDocUrl: prev.familyDocUrl.filter((_: any, idx: number) => idx !== index)
                      }));
                      showToast('가족관계증명서 파일이 삭제 목록에 추가되었습니다. (저장 시 적용)', 'info');
                    }}
                    style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                  >
                    지우기
                  </button>
                </div>
              );
            })}
            
            {/* 대기 중인 파일 객체 리스트 */}
            {Array.isArray(regForm.familyDocFile) && regForm.familyDocFile.map((file: File, index: number) => (
              <div key={`file-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
                <span>📎 {file.name} (대기)</span>
                <button
                  type="button"
                  onClick={() => {
                    setRegForm((prev: any) => ({
                      ...prev,
                      familyDocFile: prev.familyDocFile.filter((_: any, idx: number) => idx !== index)
                    }));
                  }}
                  style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                >
                  취소
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. 외화 송금영수증 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap' }}>💸 외화 송금영수증 (여러 개 가능):</span>
            <input
              type="file"
              accept=".pdf,.jpg,.png,.jpeg"
              multiple
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                if (files.length > 0) {
                  setRegForm((prev: any) => ({
                    ...prev,
                    remittanceDocFile: [...(prev.remittanceDocFile || []), ...files]
                  }));
                  showToast(`${files.length}개의 송금영수증 파일이 첨부되었습니다.`, 'info');
                }
              }}
              style={{ fontSize: '12px' }}
            />
          </div>
          
          {/* 업로드된 파일 & 대기 파일 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
            {/* 이미 저장된 URL 리스트 */}
            {Array.isArray(regForm.remittanceDocUrl) && regForm.remittanceDocUrl.map((url: string, index: number) => {
              if (!url) return null;
              const parts = decodeURIComponent(url.substring(url.lastIndexOf('/') + 1)).split('_');
              const fileName = parts.length > 3 ? parts.slice(3).join('_') : parts.join('_');
              return (
                <div key={`url-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#059669' }}>💾 {fileName}</span>
                  <a href={url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>[보기]</a>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(url, fileName)}
                    style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: '12px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    [다운로드]
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegForm((prev: any) => ({
                        ...prev,
                        remittanceDocUrl: prev.remittanceDocUrl.filter((_: any, idx: number) => idx !== index)
                      }));
                      showToast('송금영수증 파일이 삭제 목록에 추가되었습니다. (저장 시 적용)', 'info');
                    }}
                    style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                  >
                    지우기
                  </button>
                </div>
              );
            })}
            
            {/* 대기 중인 파일 객체 리스트 */}
            {Array.isArray(regForm.remittanceDocFile) && regForm.remittanceDocFile.map((file: File, index: number) => (
              <div key={`file-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
                <span>📎 {file.name} (대기)</span>
                <button
                  type="button"
                  onClick={() => {
                    setRegForm((prev: any) => ({
                      ...prev,
                      remittanceDocFile: prev.remittanceDocFile.filter((_: any, idx: number) => idx !== index)
                    }));
                  }}
                  style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                >
                  취소
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
