import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { FileSpreadsheet, Edit3 } from 'lucide-react';
import { calculateCombinedRefund } from '../../utils/combinedTaxCalculator';
import { CONTRACT_TRANSLATIONS, CONTRACT_LANG_CODES } from '../ContractPage';
import { ContractTemplateModal } from '../modals/ContractTemplateModal';

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
  contractLanguage: string;
  setContractLanguage: React.Dispatch<React.SetStateAction<string>>;
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
  contractLanguage,
  setContractLanguage,
  triggerKoreanInvoiceDownload
}) => {
  const [selectedMemoDetail, setSelectedMemoDetail] = React.useState<{ date: string; manager: string; content: string } | null>(null);
  const [showContractSignature, setShowContractSignature] = React.useState<boolean>(false);
  const [isContractTemplateModalOpen, setIsContractTemplateModalOpen] = useState<boolean>(false);
  const [showFullContractModal, setShowFullContractModal] = React.useState<boolean>(false);
  const [selectedContractLang, setSelectedContractLang] = React.useState<string>('한국어');
  const memoScrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (showFullContractModal) {
      setSelectedContractLang(contractLanguage || '한국어');
    }
  }, [showFullContractModal, contractLanguage]);

  React.useEffect(() => {
    if (memoScrollRef.current) {
      memoScrollRef.current.scrollTop = memoScrollRef.current.scrollHeight;
    }
  }, [consultMemos]);

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
        setConsultMemos((prev: any[]) => [...prev, data]);
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
      
      {/* Left Column: 계약서 관리 + 고객 상담 정보 관리 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* 📋 세무 경정 청구 표준계약서 관리 위젯 */}
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>📋 세무 경정 청구 표준계약서 관리</span>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>
              * 비대면 모바일 전자계약 수집
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>계약서 상태</label>
              <select
                className="form-control"
                style={{ fontSize: '13px', height: '32px', padding: '2px 8px' }}
                value={regForm.contractStatus || '대기'}
                onChange={async (e) => {
                  const newStatus = e.target.value;
                  setRegForm((prev: any) => ({ ...prev, contractStatus: newStatus }));
                  if (regForm.clientId) {
                    try {
                      const { error } = await supabase
                        .from('Client')
                        .update({ contractStatus: newStatus, updatedAt: new Date().toISOString() })
                        .eq('id', regForm.clientId);
                      if (error) throw error;
                      showToast('계약서 상태가 변경되었습니다.', 'success');
                      setCustomers((prevCustomers: any[]) => prevCustomers.map(c => 
                        c.uuid === regForm.clientId ? { ...c, contractStatus: newStatus } : c
                      ));
                    } catch (err: any) {
                      showToast(`계약서 상태 업데이트 실패: ${err.message}`, 'error');
                    }
                  }
                }}
              >
                <option value="대기">대기</option>
                <option value="계약완료">계약완료</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>서명 확인</label>
              {regForm.contractSignatureUrl ? (
                <button
                  type="button"
                  style={{
                    width: '100%',
                    height: '32px',
                    fontSize: '12px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                  onClick={() => setShowContractSignature(true)}
                >
                  ✍️ 서명 보기
                </button>
              ) : (
                <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                  등록된 서명 없음
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>계약서 발급 언어</label>
            <select
              className="form-control"
              style={{ fontSize: '13px', height: '32px', padding: '2px 8px', width: '100%' }}
              value={contractLanguage}
              onChange={(e) => setContractLanguage(e.target.value)}
            >
              <option value="한국어">🇰🇷 한국어 (Korean)</option>
              <option value="베트남어">🇻🇳 베트남어 (Vietnamese)</option>
              <option value="인도네시아어">🇮🇩 인도네시아어 (Indonesian)</option>
              <option value="몽골어">🇲🇳 몽골어 (Mongolian)</option>
              <option value="미얀마어">🇲🇲 미얀마어 (Burmese)</option>
              <option value="캄보디아어">🇰🇭 캄보디아어 (Khmer)</option>
              <option value="네팔어">🇳🇵 네팔어 (Nepali)</option>
              <option value="방글라데시어">🇧🇩 방글라데시어 (Bengali)</option>
              <option value="우즈베크어">🇺🇿 우즈베크어 (Uzbek)</option>
              <option value="파키스탄어">🇵🇰 파키스탄어 (Urdu)</option>
              <option value="태국어">🇹🇭 태국어 (Thai)</option>
              <option value="필리핀어">🇵🇭 필리핀어 (Tagalog)</option>
              <option value="스리랑카어">🇱🇰 스리랑카어 (Sinhala)</option>
              <option value="영어">🇺🇸 영어 (English)</option>
            </select>
          </div>

          {/* ✏️ 표준 계약서 양식 수정 버튼 */}
          <button
            type="button"
            onClick={() => setIsContractTemplateModalOpen(true)}
            style={{
              width: '100%',
              height: '34px',
              fontSize: '12px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #93c5fd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <Edit3 size={14} />
            표준 계약서 양식/문구 수정 (A4)
          </button>

          <button
            type="button"
            style={{
              width: '100%',
              height: '34px',
              fontSize: '12px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => {
              if (!regForm.clientId) {
                showToast('고객을 먼저 저장해 주세요.', 'error');
                return;
              }

              // Check if any year has a negative refund (tax payment due)
              const years = regForm.years || [];
              const targetYears = Array.from(new Set(years.filter((y: any) => y.active).map((y: any) => String(y.year))));
              
              const hasNegativeRefund = targetYears.some((yr: any) => {
                const res = calculateCombinedRefund(regForm, yr, selectedFeeRate);
                return res.finalRefund < 0;
              });

              if (hasNegativeRefund) {
                const confirmProceed = window.confirm('⚠️ [경고] 합산 세액 계산 결과, 세금 납부(마이너스 환급)가 발생하는 연도가 존재합니다. 그래도 계약서 링크를 복사하시겠습니까?');
                if (!confirmProceed) return;
              }

              const contractLink = `${window.location.origin}${window.location.pathname}?view=contract&id=${regForm.clientId}&lang=${contractLanguage}&feeRate=${selectedFeeRate}`;
              navigator.clipboard.writeText(contractLink);
              showToast(`${regForm.name || '고객'}의 표준계약서 링크가 복사되었습니다. (수수료율 ${selectedFeeRate}% 반영)`, 'success');
            }}
          >
            🔗 경정청구 표준계약서 공유 링크 복사
          </button>

          {regForm.contractSignatureUrl && (
            <button
              type="button"
              style={{
                width: '100%',
                height: '34px',
                fontSize: '12px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '8px'
              }}
              onClick={() => setShowFullContractModal(true)}
            >
              📄 서명된 계약서 보기 및 인쇄 (PDF)
            </button>
          )}
        </div>

        {/* 고객 상담 정보 관리 */}
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>고객 상담 정보 관리</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn-cancel" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => { setRegForm((prev: any) => ({ ...prev, snsName: '', snsAddress: '', hometaxId: '', hometaxPw: '', consultMemo: '' })); setConsultMemos([]); }}>초기화</button>
            <button className="btn-submit" style={{ padding: '4px 12px', fontSize: '12px', backgroundColor: '#2563eb' }} onClick={handleSaveConsultInfo}>저장</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
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
            <textarea className="form-control" style={{ height: '350px', fontSize: '13px', padding: '8px', lineHeight: '1.5' }} value={regForm.consultMemo || ''} onChange={(e) => setRegForm((prev: any) => ({ ...prev, consultMemo: e.target.value }))} placeholder="상담 세부 정보를 기입하세요" />
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
    </div>

      {/* Right Column: 상담처리 로그 + 수임동의 + 청구서 */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
          상담처리 로그
        </div>
        <div style={{ flex: 1, minHeight: '480px', display: 'flex', flexDirection: 'column' }}>
          {consultMemos.length > 0 ? (
            <div ref={memoScrollRef} style={{ width: '100%', flex: 1, height: '100%', overflowY: 'auto', minHeight: '480px', maxHeight: '750px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
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
                          setSelectedMemoDetail({ date: formattedDate, manager: resolvedManager, content: memo.content });
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
                <option value="방글라데시어">🇧🇩 방글라데시어 (Bengali)</option>
                <option value="우즈베크어">🇺🇿 우즈베크어 (Uzbek)</option>
                <option value="파키스탄어">🇵🇰 파키스탄어 (Urdu)</option>
                <option value="태국어">🇹🇭 태국어 (Thai)</option>
                <option value="필리핀어">🇵🇭 필리핀어 (Tagalog)</option>
                <option value="스리랑카어">🇱🇰 스리랑카어 (Sinhala)</option>
                <option value="영어">🇺🇸 영어 (English)</option>
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
      
      {selectedMemoDetail && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
          onClick={() => setSelectedMemoDetail(null)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              width: '500px',
              maxWidth: '90%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              style={{
                backgroundColor: '#1e293b',
                color: '#ffffff',
                padding: '14px 16px',
                fontSize: '15px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>상담 메모 상세 보기</span>
              <button 
                onClick={() => setSelectedMemoDetail(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
              <div style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '12px', marginBottom: '12px', fontSize: '13px', color: '#64748b' }}>
                <div style={{ marginBottom: '4px' }}>• <strong>작성일시:</strong> {selectedMemoDetail.date}</div>
                <div>• <strong>담당 매니저:</strong> {selectedMemoDetail.manager}</div>
              </div>
              <div 
                style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-all', 
                  maxHeight: '300px', 
                  overflowY: 'auto',
                  backgroundColor: '#f8fafc',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  userSelect: 'text'
                }}
              >
                {selectedMemoDetail.content}
              </div>
            </div>
            <div 
              style={{
                padding: '12px 16px',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}
            >
              <button 
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(selectedMemoDetail.content);
                    showToast('메모 내용이 클립보드에 복사되었습니다.', 'success');
                  } catch (err) {
                    showToast('복사에 실패했습니다.', 'error');
                  }
                }}
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                메모 복사
              </button>
              <button 
                onClick={() => setSelectedMemoDetail(null)}
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✍️ 계약서 서명 이미지 보기 모달 */}
      {showContractSignature && regForm.contractSignatureUrl && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: '16px'
          }}
          onClick={() => setShowContractSignature(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '380px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>경정청구 표준계약서 서명</span>
              <button 
                onClick={() => setShowContractSignature(false)}
                style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <img 
                src={regForm.contractSignatureUrl} 
                alt="Client Signature" 
                style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff' }}
              />
            </div>
            {regForm.contractConsentDate && (
              <div style={{ padding: '8px 16px', fontSize: '11px', color: '#64748b', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
                체결 일시: {new Date(regForm.contractConsentDate).toLocaleString('ko-KR')}
              </div>
            )}
            <div style={{ padding: '12px 16px', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowContractSignature(false)}
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📄 서명된 계약서 전체 보기 및 인쇄 모달 */}
      {showFullContractModal && regForm.contractSignatureUrl && (() => {
        const t = CONTRACT_TRANSLATIONS[selectedContractLang] || CONTRACT_TRANSLATIONS['한국어'];
        
        // Fee Calculations
        const feeMethod = regForm.feePaymentStatus || '후불 22%';
        const numericFeeRate = selectedFeeRate || 22;
        
        let prepaidRate = 0;
        let postpaidRate = 0;
        
        const hybridMatch = feeMethod.match(/선불\s*(\d+)%?,\s*후불\s*(\d+)%?/);
        if (hybridMatch) {
          prepaidRate = Number(hybridMatch[1]);
          postpaidRate = Number(hybridMatch[2]);
        } else if (feeMethod.includes('선불')) {
          const prepaidMatch = feeMethod.match(/선불\s*(\d+)%?/);
          prepaidRate = prepaidMatch ? Number(prepaidMatch[1]) : numericFeeRate;
          postpaidRate = 0;
        } else {
          prepaidRate = 0;
          const postpaidMatch = feeMethod.match(/후불\s*(\d+)%?/);
          postpaidRate = postpaidMatch ? Number(postpaidMatch[1]) : numericFeeRate;
        }

        const totalFeeRate = prepaidRate + postpaidRate;

        // Calculate expected refund
        const years = regForm.years || [];
        const targetYears = ['2021', '2022', '2023', '2024', '2025'];
        let expectedRefund = 0;
        targetYears.forEach(yr => {
          const hasWage = years.some((y: any) => String(y.year) === yr && y.active);
          const hasFreelancer = regForm.freelancerYears?.[yr]?.active;
          if (hasWage || hasFreelancer) {
            const res = calculateCombinedRefund(regForm, yr, selectedFeeRate);
            expectedRefund += res.finalRefund;
          }
        });

        const calculatedFee = Math.round(expectedRefund * (totalFeeRate / 100));
        const prepaidAmt = Math.round(expectedRefund * (prepaidRate / 100));
        const postpaidAmt = Math.round(expectedRefund * (postpaidRate / 100));

        // Clauses
        const getDynamicFeeText = (lang: string, prepRate: number, postRate: number) => {
          if (prepRate > 0 && postRate > 0) {
            if (lang === '한국어') return '본 경정청구 용역의 대가는 선불 및 성공보수 후불 혼합 방식으로 하며, 신청 시의 선불 수수료와 국세청으로부터 환급(결정)이 확정된 총 환급금액(지방세 포함)에 대한 후불 성공보수를 각각 합산한 금액으로 한다.';
            return 'The fee for this service shall be a hybrid of a prepaid fee and a success postpaid fee, calculated as the sum of the prepaid portion and the postpaid success portion based on the final refund amount.';
          } else if (prepRate > 0) {
            if (lang === '한국어') return '본 경정청구 용역의 대가는 선불 방식으로 하며, 예상 환급금액에 약정 수수료율을 곱하여 산정된 금액을 경정청구 진행 전에 납부하는 것으로 한다.';
            return 'The fee for this service shall be paid upfront (prepaid), calculated by multiplying the expected refund amount by the agreed fee rate before the filing process begins.';
          } else {
            if (lang === '한국어') return '본 경정청구 용역의 대가는 성공보수 후불 방식으로 하며, 국세청으로부터 환급(결정)이 확정된 총 환급금액(지방세 포함)에 약정 수수료율을 곱한 금액으로 한다.';
            return 'The fee for this service shall be on a success-fee basis (postpaid), calculated by multiplying the total refund amount (including local tax) confirmed by the tax authorities by the agreed fee rate.';
          }
        };

        const getDynamicPaymentText = (lang: string, prepRate: number, postRate: number) => {
          const bankDetails = lang === '영어' 
            ? '\n• Bank: IBK (Industrial Bank of Korea) 540-049052-04-010\n• Depositor: Hangyeol Financial Consulting'
            : '\n• 입금 계좌: 기업은행 540-049052-04-010\n• 예금주: 한결금융컨설팅';

          if (prepRate > 0 && postRate > 0) {
            if (lang === '한국어') return `의뢰인(갑)은 세무 경정청구 신청 접수 전에 약정된 선불 수수료(${prepRate}%)에 해당하는 금액을 송금하고, 국세청 및 지자체로부터 환급금을 본인 계좌로 수령한 날로부터 3영업일 이내에 약정된 후불 수수료(${postRate}%)를 아래 입금 계좌로 송금해야 한다.${bankDetails}`;
            return `Party A shall transfer the prepaid portion (${prepRate}%) before the claim is filed, and the postpaid portion (${postRate}%) within 3 business days after receiving the tax refund from the authorities, to Party B's designated bank account below.${bankDetails}`;
          } else if (prepRate > 0) {
            if (lang === '한국어') return `의뢰인(갑)은 세무 경정청구 신청 접수 전에 약정된 선불 수수료(${prepRate}%)에 해당하는 금액을 수임인(을)이 지정한 아래 입금 계좌로 송금해야 한다.${bankDetails}`;
            return `Party A shall transfer the prepaid fee (${prepRate}%) to Party B's designated bank account below before the tax rectification claim is filed.${bankDetails}`;
          } else {
            if (lang === '한국어') return `의뢰인(갑)은 국세청 및 지자체로부터 세금 환급금을 본인 계좌로 수령한 날로부터 3영업일 이내에 수임인(을)이 지정한 아래 입금 계좌로 수수료를 송금해야 한다.${bankDetails}`;
            return `Party A shall transfer the fee to Party B's designated bank account below within 3 business days from the date Party A receives the tax refund from the tax office or local government.${bankDetails}`;
          }
        };

        const feeDescriptionText = getDynamicFeeText(selectedContractLang, prepaidRate, postpaidRate);
        const paymentText = getDynamicPaymentText(selectedContractLang, prepaidRate, postpaidRate);

        return (
          <div 
            id="printable-contract-modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'center',
              zIndex: 10000,
              padding: '24px 16px',
              overflowY: 'auto'
            }}
            onClick={() => setShowFullContractModal(false)}
          >
            {/* Print styling tag */}
            <style>{`
              @media print {
                body > * {
                  display: none !important;
                }
                #printable-contract-modal-overlay {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  background: white !important;
                  display: block !important;
                  z-index: 99999 !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  overflow: visible !important;
                }
                #printable-contract-modal-content {
                  border: none !important;
                  box-shadow: none !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>

            <div 
              id="printable-contract-modal-content"
              style={{
                width: '100%',
                maxWidth: '650px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                margin: '0 auto 40px',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Control Bar (Hidden on print) */}
              <div 
                className="no-print"
                style={{ 
                  padding: '12px 16px', 
                  borderBottom: '1px solid #e2e8f0', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: '#f8fafc',
                  borderTopLeftRadius: '12px',
                  borderTopRightRadius: '12px'
                }}
              >
                {/* Language Selector */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {Object.keys(CONTRACT_TRANSLATIONS).map(lang => (
                    <button 
                      key={lang}
                      onClick={() => setSelectedContractLang(lang)}
                      style={{ 
                        border: '1px solid #cbd5e1', 
                        background: selectedContractLang === lang ? '#3b82f6' : '#ffffff', 
                        color: selectedContractLang === lang ? '#ffffff' : '#475569',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {CONTRACT_LANG_CODES[lang] || lang}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => window.print()}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    🖨️ 인쇄 / PDF 저장
                  </button>
                  <button 
                    onClick={() => setShowFullContractModal(false)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    닫기
                  </button>
                </div>
              </div>

              {/* Printable Contract Body */}
              <div style={{ padding: '40px 30px', boxSizing: 'border-box', backgroundColor: '#ffffff', borderRadius: '12px' }}>
                
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#0f172a' }}>{t.title}</h2>
                  <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: '1.5' }}>{t.subtitle}</p>
                </div>

                {/* Parties Info Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  
                  {/* 甲: 의뢰인 */}
                  <div style={{ fontSize: '13px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', color: '#2563eb', marginBottom: '6px', fontSize: '14px' }}>{t.clientLabel}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '6px 12px', color: '#334155' }}>
                      <span>• {t.nameLabel}:</span> <span style={{ fontWeight: 'bold' }}>{regForm.name || '-'}</span>
                      <span>• {t.nationalityLabel}:</span> <span>{regForm.nationality || '-'}</span>
                      <span>• {t.regNumLabel}:</span> <span>{regForm.foreignerNumber || '-'}</span>
                      <span>• {t.addressLabel}:</span> <span>{regForm.residentRegisterAddress || '-'}</span>
                      <span>• {t.phoneLabel}:</span> <span>{regForm.phone || '-'}</span>
                      <span>• {t.companyLabel}:</span> <span>{[...(regForm.years || [])].sort((a: any, b: any) => (Number(b.year) || 0) - (Number(a.year) || 0)).find((y: any) => y.workPlace || y.companyName)?.workPlace || regForm.companyName || '-'}</span>
                      <span>• {t.visaLabel}:</span> <span>{regForm.visaType || '-'}</span>
                    </div>
                  </div>

                  {/* 乙: 수임인 */}
                  <div style={{ fontSize: '13px', paddingTop: '6px' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '6px', fontSize: '14px' }}>{t.agentLabel}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '6px 12px', color: '#334155', position: 'relative' }}>
                      <span>• {t.firmNameLabel}:</span> <span>{t.firmNameVal}</span>
                      <span>• {t.firmRepresentativeLabel}:</span> 
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {t.representativeVal}
                        
                        {/* Red Seal */}
                        <div style={{ 
                          width: '45px', 
                          height: '45px', 
                          borderRadius: '50%', 
                          border: '2px dashed #ef4444', 
                          color: '#ef4444', 
                          fontSize: '8px', 
                          display: 'flex', 
                          flexDirection: 'column',
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          transform: 'rotate(-10deg)',
                          fontWeight: 'bold',
                          lineHeight: '1.1',
                          padding: '2px',
                          boxSizing: 'border-box',
                          backgroundColor: 'rgba(239, 68, 68, 0.05)',
                          userSelect: 'none'
                        }}>
                          <span>노벨세무</span>
                          <span style={{ fontSize: '7px' }}>{t.sealPlaceholder}</span>
                        </div>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contract Terms Details */}
                <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', marginBottom: '24px', backgroundColor: '#fafafa' }}>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>{t.purposeTitle}</h4>
                    <p style={{ margin: 0, color: '#475569', wordBreak: 'keep-all' }}>{t.purposeText}</p>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>{t.scopeTitle}</h4>
                    <p style={{ margin: 0, color: '#475569', whiteSpace: 'pre-line' }}>{t.scopeText}</p>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>{t.feeTitle}</h4>
                    <p style={{ margin: '0 0 6px 0', color: '#475569', wordBreak: 'keep-all' }}>{feeDescriptionText}</p>
                    <div style={{ backgroundColor: '#f1f5f9', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: '#0f172a', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>{t.feeText2} <strong>{totalFeeRate}% ({feeMethod})</strong></div>
                      {prepaidRate > 0 && <div>• {selectedContractLang === '영어' ? 'Prepaid portion' : '선불금액'} ({prepaidRate}%): <strong>{prepaidAmt.toLocaleString()} {t.won}</strong></div>}
                      {postpaidRate > 0 && <div>• {selectedContractLang === '영어' ? 'Postpaid portion' : '후불금액'} ({postpaidRate}%): <strong>{postpaidAmt.toLocaleString()} {t.won}</strong></div>}
                      <div>{t.feeText3} <strong>{expectedRefund.toLocaleString()} {t.won}</strong></div>
                      <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginTop: '6px' }}>{t.feeText4} <strong style={{ color: '#2563eb', fontSize: '14px' }}>{calculatedFee.toLocaleString()} {t.won}</strong></div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>{t.paymentTitle}</h4>
                    <p style={{ margin: 0, color: '#475569', whiteSpace: 'pre-line' }}>{paymentText}</p>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>{t.dutiesTitle}</h4>
                    <p style={{ margin: 0, color: '#475569', whiteSpace: 'pre-line' }}>{t.dutiesText}</p>
                  </div>

                </div>

                {/* Agreement & Signature Details */}
                <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>{t.completionTitle}</h4>
                  <p style={{ margin: '0 0 20px 0', color: '#475569' }}>{t.completionText}</p>
                  
                  {/* Signature display board */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '10px', width: '100%', textAlign: 'left' }}>
                      ✍️ {t.sigLabel}
                    </div>
                    <img 
                      src={regForm.contractSignatureUrl} 
                      alt="Client Signature" 
                      style={{ maxWidth: '100%', maxHeight: '120px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff', padding: '10px' }}
                    />
                    {regForm.contractConsentDate && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '10px' }}>
                        서명 일시 / Signature Date: {new Date(regForm.contractConsentDate).toLocaleString('ko-KR')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '20px', fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>
                  NOVEL TAX LAW FIRM
                </div>

              </div>
            </div>
          </div>
        );
      })()}
      {/* Contract Template Editor Modal */}
      <ContractTemplateModal
        isOpen={isContractTemplateModalOpen}
        onClose={() => setIsContractTemplateModalOpen(false)}
        initialLanguage={contractLanguage}
        showToast={showToast}
        clientData={{
          name: regForm.name,
          nationality: regForm.nationality,
          regNum: regForm.cleanRegNum || regForm.birthDate,
          companyName: regForm.companyName,
          visa: regForm.visa,
          feeRate: selectedFeeRate
        }}
      />
    </div>
  );
};
