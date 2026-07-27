import React from 'react';

export const RentSupportView: React.FC = () => {
  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', margin: '20px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>
        💵 청년월세 한시 특별지원 (정부 복지)
      </h2>
      <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: 'bold', marginBottom: '12px', fontSize: '15px' }}>
          📢 정부 청년 주거 복지 혜택 안내 (준비 중)
        </div>
        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 16px 0' }}>
          본 화면은 일을 하지 않아 소득세 납부 내역이 없는 무소득 청년들을 위해 <b>국토교통부 청년월세 한시 특별지원 요건 자가진단 및 신청 방법</b>을 안내하는 전용 대시보드입니다. 현재 세무 경정청구 월세 기능이 먼저 개발되었으며, 지자체 복지 매칭 기능은 추후 서비스 고도화 시 연동될 예정입니다.
        </p>
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '13px', color: '#166534', fontWeight: '500', lineHeight: '1.5' }}>
          💡 <b>알림:</b> 일을 하거나 프리랜서 소득세 납부 내역이 있으신 수임 고객님의 월세 환급은 <b>'고객등록 관리' ➡️ '상세 정보 입력' ➡️ '월세 세액공제 경정청구'</b> 메뉴를 통해 이미 완벽하게 작동 및 청구 전자파일 생성이 가능합니다.
        </div>
      </div>
    </div>
  );
};
