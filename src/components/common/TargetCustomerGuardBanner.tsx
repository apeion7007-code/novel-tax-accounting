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
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: '#eff6ff',
          border: '1.5px solid #3b82f6',
          borderRadius: '6px',
          marginBottom: '8px',
          fontSize: '12.5px',
          color: '#1e40af'
        }}
      >
        <UserCheck size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
        <div style={{ lineHeight: '1.4' }}>
          <span style={{ fontWeight: 'bold' }}>
            📌 대상 고객: [ {serial && serial > 0 ? `#${serial} ` : ''}{name ? name.toUpperCase() : '선택된 고객'}{nationality ? ` · ${nationality}` : ''} ]
          </span>
          <span style={{ display: 'block', fontSize: '11px', color: '#3b82f6', marginTop: '1px' }}>
            작성하신 상담 메모는 위 고객님의 고유 차트에 안전하게 저장됩니다.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: '#fffbeb',
        border: '1.5px solid #f59e0b',
        borderRadius: '6px',
        marginBottom: '8px',
        fontSize: '12.5px',
        color: '#b45309'
      }}
    >
      <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
      <div style={{ lineHeight: '1.4' }}>
        <span style={{ fontWeight: 'bold' }}>
          ⚠️ 아직 저장되지 않은 [신규 고객 등록] 상태입니다
        </span>
        <span style={{ display: 'block', fontSize: '11px', color: '#d97706', marginTop: '1px' }}>
          상담 메모는 상단 [고객 등록 완료]를 먼저 누른 후 작성하실 수 있습니다.
        </span>
      </div>
    </div>
  );
};
