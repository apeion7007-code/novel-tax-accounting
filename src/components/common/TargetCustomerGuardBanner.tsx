import React from 'react';
import { UserCheck, AlertTriangle } from 'lucide-react';

interface TargetCustomerGuardBannerProps {
  clientId?: string | null;
  serial?: number | null;
  name?: string | null;
  nationality?: string | null;
}

/**
 * 🛡️ [상담 메모 오기입 원천 차단 가드 배너]
 * 매니저가 현재 어느 고객의 차트에 메모를 작성 중인지 시각적으로 즉시 인지하도록 돕고,
 * 미등록 신규 고객 상태에서는 메모 등록 실수를 원천 방지합니다.
 */
export const TargetCustomerGuardBanner: React.FC<TargetCustomerGuardBannerProps> = ({
  clientId,
  serial,
  name,
  nationality
}) => {
  const isRegisteredCustomer = Boolean(clientId && clientId.trim() !== '');

  if (isRegisteredCustomer) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          backgroundColor: '#eff6ff',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          marginBottom: '10px',
          fontSize: '13px',
          color: '#1e40af',
          boxShadow: '0 2px 6px rgba(59, 130, 246, 0.12)'
        }}
      >
        <UserCheck size={20} style={{ color: '#2563eb', flexShrink: 0 }} />
        <div style={{ lineHeight: '1.5' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: '#1e3a8a' }}>
            📌 [고객 정보 수정 모드] 대상 고객: [ {serial && serial > 0 ? `#${serial} ` : ''}{name ? name.toUpperCase() : '선택된 고객'}{nationality ? ` · ${nationality}` : ''} ]
          </div>
          <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '2px' }}>
            현재 위 고객님의 정보를 수정 중입니다. 다른 고객을 등록하시려면 상단 <strong>[전체 초기화]</strong> 또는 <strong>[➕ 신규 건으로 전환 (새 UID)]</strong>을 누르세요.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        backgroundColor: '#fffbeb',
        border: '2px solid #f59e0b',
        borderRadius: '8px',
        marginBottom: '10px',
        fontSize: '13px',
        color: '#b45309',
        boxShadow: '0 2px 6px rgba(245, 158, 11, 0.12)'
      }}
    >
      <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0 }} />
      <div style={{ lineHeight: '1.5' }}>
        <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: '#92400e' }}>
          ⚠️ 아직 저장되지 않은 [신규 고객 등록] 상태입니다. (꼭 상단 [신규저장]을 누르셔야 저장이 됩니다.)
        </div>
        <div style={{ fontSize: '12px', color: '#b45309', marginTop: '2px' }}>
          상담 메모 및 계약 업무는 상단 <strong>[신규저장]</strong>을 먼저 누른 후 작성하실 수 있습니다.
        </div>
      </div>
    </div>
  );
};
