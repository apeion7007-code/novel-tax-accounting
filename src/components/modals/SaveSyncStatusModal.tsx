import React, { useEffect } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight, Check } from 'lucide-react';

export type SyncStatus = 'syncing' | 'completed' | 'error';

export interface SaveSyncStatusModalProps {
  isOpen: boolean;
  status: SyncStatus;
  customerName: string;
  isUpdate: boolean;
  serial?: number;
  errorMessage?: string;
  onConfirm: () => void;
  onGoToList?: () => void;
}

export const SaveSyncStatusModal: React.FC<SaveSyncStatusModalProps> = ({
  isOpen,
  status,
  customerName,
  isUpdate,
  serial,
  errorMessage,
  onConfirm,
  onGoToList
}) => {
  // 1. 브라우저 창 닫기 및 새로고침 방지 (동기화 진행 중일 때만 작동)
  useEffect(() => {
    if (!isOpen || status !== 'syncing') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      const message = '고객 정보 및 첨부 서류가 클라우드에 동기화 중입니다. 페이지를 벗어나면 데이터가 유실될 수 있습니다.';
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isOpen, status]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        // 동기화 중에는 배경 클릭으로 닫히는 것을 원천 차단
        e.stopPropagation();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 28px 28px',
          textAlign: 'center',
          animation: 'syncModalFadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes syncModalFadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes syncSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* 1. 동기화 진행 중 상태 (SYNCING) */}
        {status === 'syncing' && (
          <>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                border: '3px solid #bfdbfe'
              }}
            >
              <Loader2
                size={40}
                color="#2563eb"
                style={{ animation: 'syncSpin 1s linear infinite' }}
              />
            </div>

            <div style={{ display: 'inline-block', padding: '3px 10px', backgroundColor: '#dbeafe', color: '#1d4ed8', fontSize: '12px', fontWeight: 'bold', borderRadius: '12px', marginBottom: '10px' }}>
              {isUpdate ? '고객 정보 업데이트' : '신규 고객 등록'}
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0' }}>
              클라우드 DB 및 서류 동기화 중...
            </h3>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              <strong style={{ color: '#1e293b' }}>{customerName || '고객'}</strong>님의 기본 정보, 연도별 정산 내역 및 첨부 서류(PDF/신분증)를 안전하게 저장하고 있습니다.
            </p>

            <div
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: '#fff7ed',
                border: '1px solid #fdba74',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#c2410c',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>⚠️ 데이터 유실 방지를 위해 창을 닫거나 새로고침하지 마세요.</span>
            </div>
          </>
        )}

        {/* 2. 동기화 완료 상태 (COMPLETED) */}
        {status === 'completed' && (
          <>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                border: '3px solid #bbf7d0'
              }}
            >
              <CheckCircle2 size={44} color="#16a34a" />
            </div>

            <div style={{ display: 'inline-block', padding: '3px 10px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 'bold', borderRadius: '12px', marginBottom: '10px' }}>
              {isUpdate ? '업데이트 완료' : '신규 등록 완료'}
            </div>

            <h3 style={{ fontSize: '21px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0' }}>
              동기화 및 저장이 완료되었습니다!
            </h3>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 16px 0' }}>
              <strong style={{ color: '#1e293b' }}>{customerName}</strong> 고객님의 인적사항, 정산 데이터 및 첨부 서류가 Supabase 클라우드에 안전하게 완벽히 저장되었습니다.
            </p>

            {serial && serial > 0 && (
              <div
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#334155',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ color: '#64748b' }}>고객 관리 번호</span>
                <span style={{ fontWeight: '800', color: '#2563eb', fontSize: '15px' }}>#{serial}</span>
              </div>
            )}

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={onConfirm}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '700',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              >
                <Check size={18} />
                <span>확인 (현재 상세 화면 유지)</span>
              </button>

              {onGoToList && (
                <button
                  type="button"
                  onClick={onGoToList}
                  style={{
                    width: '100%',
                    padding: '11px 20px',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: '600',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = '#1e293b';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#475569';
                  }}
                >
                  <span>고객 목록으로 돌아가기</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </>
        )}

        {/* 3. 에러 발생 상태 (ERROR) */}
        {status === 'error' && (
          <>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                border: '3px solid #fecaca'
              }}
            >
              <AlertTriangle size={44} color="#dc2626" />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#991b1b', margin: '0 0 10px 0' }}>
              동기화 저장 중 오류가 발생했습니다
            </h3>

            <div
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#7f1d1d',
                textAlign: 'left',
                lineHeight: '1.5',
                maxHeight: '160px',
                overflowY: 'auto',
                marginBottom: '20px',
                wordBreak: 'break-all'
              }}
            >
              {errorMessage || '알 수 없는 오류가 발생했습니다. 네트워크 연결을 확인해 주세요.'}
            </div>

            <button
              type="button"
              onClick={onConfirm}
              style={{
                width: '100%',
                padding: '12px 20px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              닫기
            </button>
          </>
        )}
      </div>
    </div>
  );
};
