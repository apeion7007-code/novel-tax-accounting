import React from 'react';
import { supabase } from '../../utils/supabaseClient';
import { FileSpreadsheet } from 'lucide-react';

interface CustomerConsultationFormProps {
  regForm: any;
  setRegForm: React.Dispatch<React.SetStateAction<any>>;
  consultMemos: any[];
  setConsultMemos: React.Dispatch<React.SetStateAction<any[]>>;
  dbManagers: any[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  handleSaveConsultInfo: () => Promise<void>;
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  selectedFeeRate: number;
  invoiceLanguage: string;
  setInvoiceLanguage: React.Dispatch<React.SetStateAction<string>>;
  triggerKoreanInvoiceDownload: () => Promise<void>;
}

export const CustomerConsultationForm: React.FC<CustomerConsultationFormProps> = ({
  regForm,
  setRegForm,
  consultMemos,
  setConsultMemos,
  dbManagers,
  showToast,
  handleSaveConsultInfo,
  setCustomers,
  selectedFeeRate,
  invoiceLanguage,
  setInvoiceLanguage,
  triggerKoreanInvoiceDownload
}) => {
  const handleRegisterConsultMemo = async () => {
    if (!regForm.clientId) {
      showToast('상담 메모를 등록할 고객이 선택되지 않았습니다. 고객을 먼저 등록하거나 상세 정보를 불러와주세요.', 'error');
      return;
    }
    if (!regForm.consultMemo || regForm.consultMemo.trim() === '') {
      showToast('등록할 상담 메모를 입력해 주세요.', 'error');
      return;
    }

    showToast('상담 메모를 등록하는 중...', 'info');

    const currentMgr = dbManagers.find(m => m.name === regForm.managerName);
    const managerId = currentMgr?.id || 'a6f8d012-d555-414a-b78f-9110864dae3a'; // fallback to 관리자

    try {
      const { data, error } = await supabase
        .from('ConsultMemo')
        .insert([{
          clientId: regForm.clientId,
          content: regForm.consultMemo.trim(),
          managerId: managerId,
          createdAt: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setConsultMemos((prev: any[]) => [data, ...prev]);
        setRegForm((prev: any) => ({ ...prev, consultMemo: '' }));
        showToast('상담 내용 및 메모가 상담처리 로그에 등록되었습니다.', 'success');
      }
    } catch (err: any) {
      console.error('Error inserting ConsultMemo:', err);
      showToast('상담 메모 등록 실패: ' + err.message, 'error');
    }
  };

  const handleDeleteConsultMemo = async (memoId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent modal detail popup on clicking delete button
    const ok = window.confirm('이 상담 메모를 삭제하시겠습니까?');
    if (!ok) return;

    showToast('상담 메모를 삭제하는 중...', 'info');

    try {
      const { error } = await supabase
        .from('ConsultMemo')
        .delete()
        .eq('id', memoId);

      if (error) {
        throw error;
      }

      setConsultMemos((prev: any[]) => prev.filter(m => m.id !== memoId));
      showToast('상담 메모가 성공적으로 삭제되었습니다.', 'success');
    } catch (err: any) {
      console.error('Error deleting ConsultMemo:', err);
      showToast('상담 메모 삭제 실패: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '20px' }}>
      
      {/* Left Column: 고객 상담 정보 관리 */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>고객 상담 정보 관리</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn-cancel" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setRegForm((prev: any) => ({ ...prev, snsName: '', snsAddress: '', hometaxId: '', hometaxPw: '', consultMemo: '' }))}>초기화</button>
            <button className="btn-submit" style={{ padding: '4px 12px', fontSize: '12px', backgroundColor: '#2563eb' }} onClick={handleSaveConsultInfo}>저장</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>페이스북명</label>
            <input type="text" className="form-control" style={{ height: '32px', fontSize: '13px' }} value={regForm.snsName || ''} onChange={(e) => setRegForm((prev: any) => ({ ...prev, snsName: e.target.value }))} placeholder="SNS 닉네임" />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>페이스북주소</label>
            <input type="text" className="form-control" style={{ height: '32px', fontSize: '13px' }} value={regForm.snsAddress || ''} onChange={(e) => setRegForm((prev: any) => ({ ...prev, snsAddress: e.target.value }))} placeholder="프로필 주소 URL" />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>홈택스 아이디</label>
            <input type="text" className="form-control" style={{ height: '32px', fontSize: '13px' }} value={regForm.hometaxId || ''} onChange={(e) => setRegForm((prev: any) => ({ ...prev, hometaxId: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>홈택스 비밀번호</label>
            <input type="text" className="form-control" style={{ height: '32px', fontSize: '13px' }} value={regForm.hometaxPw || ''} onChange={(e) => setRegForm((prev: any) => ({ ...prev, hometaxPw: e.target.value }))} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>고객 관리등급</label>
            <select className="form-control" style={{ height: '32px', fontSize: '13px', padding: '2px' }} value={regForm.customerGrade || ''} onChange={(e) => setRegForm((prev: any) => ({ ...prev, customerGrade: e.target.value }))}>
              <option value="">선택하세요</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>녹취계약 일자</label>
            <input type="date" className="form-control" style={{ height: '32px', fontSize: '13px', padding: '2px' }} value={regForm.greenContractDate || ''} onChange={(e) => setRegForm((prev: any) => ({ ...prev, greenContractDate: e.target.value }))} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>상담처리 메모</label>
            <textarea className="form-control" style={{ height: '70px', fontSize: '13px', padding: '6px' }} value={regForm.consultMemo || ''} onChange={(e) => setRegForm((prev: any) => ({ ...prev, consultMemo: e.target.value }))} placeholder="상담 세부 정보를 기입하세요" />
          </div>
          
          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', margin: '4px 0' }}>
            <button type="button" className="btn-submit" style={{ backgroundColor: '#10b981', fontSize: '13px', padding: '8px 16px' }} onClick={handleRegisterConsultMemo}>상담처리 등록</button>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>세금환급 실적</label>
            <input type="number" className="form-control" style={{ height: '32px', fontSize: '13px' }} value={regForm.refundPerformance || ''} onChange={(e) => setRegForm((prev: any) => ({ ...prev, refundPerformance: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>환급일자</label>
            <input type="date" className="form-control" style={{ height: '32px', fontSize: '13px', padding: '2px' }} value={regForm.refundPerformanceDate || ''} onChange={(e) => setRegForm((prev: any) => ({ ...prev, refundPerformanceDate: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>수수료 수납 실적</label>
            <input type="number" className="form-control" style={{ height: '32px', fontSize: '13px' }} value={regForm.feeReceivedPerformance || ''} onChange={(e) => setRegForm((prev: any) => ({ ...prev, feeReceivedPerformance: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>수납일자</label>
            <input type="date" className="form-control" style={{ height: '32px', fontSize: '13px', padding: '2px' }} value={regForm.feeReceivedDate || ''} onChange={(e) => setRegForm((prev: any) => ({ ...prev, feeReceivedDate: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Right Column: 상담처리 로그 + 수임동의 + 청구서 */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
          상담처리 로그
        </div>
        <div style={{ flex: 1, minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
          {consultMemos.length > 0 ? (
            <div style={{ width: '100%', overflowY: 'auto', maxHeight: '180px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569', width: '65%', borderBottom: '1px solid #e2e8f0' }}>상담처리 메모</th>
                    <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569', width: '25%', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>처리일시/담당자</th>
                    <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569', width: '10%', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {consultMemos.map((memo) => {
                    const resolvedManager = dbManagers.find(m => m.id === memo.managerId)?.name || memo.managerId || '관리자';
                    const rawDate = memo.createdAt;
                    const utcString = (rawDate && !rawDate.endsWith('Z') && !rawDate.includes('+') && !/-\d{2}:\d{2}$/.test(rawDate)) 
                      ? rawDate + 'Z' 
                      : rawDate;
                    const formattedDate = utcString
                      ? new Date(utcString).toLocaleString('ko-KR', { 
                          year: '2-digit', 
                          month: 'numeric', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                          timeZone: 'Asia/Seoul'
                        })
                      : '-';
                    return (
                      <tr 
                        key={memo.id} 
                        className="clickable-log-row"
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                        onClick={() => {
                          alert(`[상담 메모 상세 보기]\n\n• 작성일시: ${formattedDate}\n• 담당 매니저: ${resolvedManager}\n\n-------------------------------\n\n${memo.content}`);
                        }}
                      >
                        <td style={{ padding: '10px 12px', whiteSpace: 'normal', wordBreak: 'break-all', verticalAlign: 'top' }}>
                          {memo.content}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#64748b', verticalAlign: 'top' }}>
                          <div>{formattedDate}</div>
                          <div style={{ fontWeight: 'bold', color: '#475569' }}>{resolvedManager}</div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'top' }}>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteConsultMemo(memo.id, e)}
                            style={{
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '6px', fontSize: '13px', padding: '20px', minHeight: '120px' }}>
              등록된 상담 로그가 없습니다.
            </div>
          )}
        </div>

        {/* 수임동의 관리 영역 */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>📁 국세청 수임대리 관리 (비대면 동의 수집)</span>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>
              * 신분증 및 서명 첨부 확인
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>수임동의 상태</label>
              <select
                className="form-control"
                style={{ fontSize: '13px', height: '32px', padding: '2px 8px' }}
                value={regForm.consentStatus || '대기'}
                onChange={async (e) => {
                  const newStatus = e.target.value;
                  setRegForm((prev: any) => ({ ...prev, consentStatus: newStatus }));
                  if (regForm.clientId) {
                    try {
                      const { error } = await supabase
                        .from('Client')
                        .update({ consentStatus: newStatus, updatedAt: new Date().toISOString() })
                        .eq('id', regForm.clientId);
                      if (error) throw error;
                      showToast('수임동의 상태가 변경되었습니다.', 'success');
                      setCustomers((prevCustomers: any[]) => prevCustomers.map(c => 
                        c.uuid === regForm.clientId ? { ...c, consentStatus: newStatus } : c
                      ));
                    } catch (err: any) {
                      showToast(`상태 업데이트 실패: ${err.message}`, 'error');
                    }
                  }
                }}
              >
                <option value="대기">◎ 대기</option>
                <option value="제출완료">● 제출완료</option>
                <option value="수임완료">★ 수임완료</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>제출 서류 확인</label>
              <div style={{ display: 'flex', gap: '8px', height: '32px', alignItems: 'center' }}>
                {regForm.arcImageUrl ? (
                  <button
                    type="button"
                    className="btn-action"
                    style={{ flex: 1, padding: '4px 8px', fontSize: '11px', height: '32px', backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                    onClick={() => window.open(regForm.arcImageUrl, '_blank')}
                  >
                    📷 신분증 보기
                  </button>
                ) : (
                  <span style={{ fontSize: '11px', color: '#94a3b8', flex: 1, textAlign: 'center' }}>신분증 없음</span>
                )}
                {regForm.signatureImageUrl ? (
                  <button
                    type="button"
                    className="btn-action"
                    style={{ flex: 1, padding: '4px 8px', fontSize: '11px', height: '32px', backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                    onClick={() => window.open(regForm.signatureImageUrl, '_blank')}
                  >
                    ✍️ 서명 보기
                  </button>
                ) : (
                  <span style={{ fontSize: '11px', color: '#94a3b8', flex: 1, textAlign: 'center' }}>서명 없음</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-action"
            style={{
              width: '100%',
              height: '34px',
              fontSize: '12px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '8px'
            }}
            onClick={() => {
              if (!regForm.clientId) {
                showToast('고객을 먼저 저장해 주세요.', 'error');
                return;
              }
              const consentLink = `${window.location.origin}${window.location.pathname}?view=consent&id=${regForm.clientId}`;
              navigator.clipboard.writeText(consentLink);
              showToast(`${regForm.name || '고객'}의 수임동의 링크가 복사되었습니다.`, 'success');
            }}
          >
            🔗 수임동의 카톡/메신저 공유 링크 복사
          </button>
        </div>

        {/* 청구서 및 수수료 발급 영역 */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b', marginBottom: '8px' }}>
            📋 청구서 발급 관리 (실시간 반영)
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>발급 언어 선택</label>
              <select
                className="form-control"
                style={{ fontSize: '13px', height: '32px', padding: '2px 8px' }}
                value={invoiceLanguage}
                onChange={(e) => setInvoiceLanguage(e.target.value)}
              >
                <option value="한국어">🇰🇷 한국어 (Korean)</option>
                <option value="베트남어">🇻🇳 베트남어 (Vietnamese)</option>
                <option value="인도네시아어">🇮🇩 인도네시아어 (Indonesian)</option>
                <option value="몽골어">🇲🇳 몽골어 (Mongolian)</option>
                <option value="미얀마어">🇲🇲 미얀마어 (Burmese)</option>
                <option value="캄보디아어">🇰🇭 캄보디아어 (Khmer)</option>
                <option value="네팔어">🇳🇵 네팔어 (Nepali)</option>
              </select>
            </div>
            <div style={{ width: '85px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>수수료율</label>
              <div style={{ height: '32px', lineHeight: '32px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#334155' }}>
                {selectedFeeRate}%
              </div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', lineHeight: '1.4' }}>
            현재 설정된 수수료율(<strong>{selectedFeeRate}%</strong>)과 예상 환급금을 기반으로 <strong>{invoiceLanguage}</strong> 청구서 엑셀 파일을 다운로드합니다.
          </div>
          <button
            type="button"
            onClick={triggerKoreanInvoiceDownload}
            style={{
              width: '100%',
              height: '38px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
          >
            <FileSpreadsheet size={16} />
            {invoiceLanguage} 청구서 다운로드 (.xlsx)
          </button>
        </div>
      </div>
      
    </div>
  );
};
