import React, { useState, useEffect } from 'react';
import { X, UserCheck, CheckCircle2 } from 'lucide-react';
import { fetchManagerStats, updateManagerSuccession } from '../../services/managerAccountService';

interface Team {
  id: number;
  name: string;
}

interface ManagerSuccessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: any;
  dbTeams: Team[];
  onSuccess: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ManagerSuccessionModal: React.FC<ManagerSuccessionModalProps> = ({
  isOpen,
  onClose,
  manager,
  dbTeams,
  onSuccess,
  showToast
}) => {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTeamId, setNewTeamId] = useState<number>(1);
  const [stats, setStats] = useState<{ clientCount: number; memoCount: number }>({ clientCount: 0, memoCount: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (manager && isOpen) {
      setNewName(manager.name || '');
      setNewEmail(manager.email || '');
      setNewPassword('');
      setNewPhone(manager.phone || '');
      setNewTeamId(manager.teamId || 1);

      // Load assigned client count and memo count
      fetchManagerStats(manager.id).then(setStats);
    }
  }, [manager, isOpen]);

  if (!isOpen || !manager) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('새 담당자 이름을 입력해 주세요.', 'error');
      return;
    }
    if (!newEmail.trim()) {
      showToast('새 로그인 이메일을 입력해 주세요.', 'error');
      return;
    }

    const confirmMsg = newPassword.trim()
      ? `'${manager.name}' 매니저의 계정을 '${newName}'(으)로 승계하고 비밀번호를 변경하시겠습니까?\n기존 고객 ${stats.clientCount}명 및 상담 메모 ${stats.memoCount}건이 모두 인계됩니다.`
      : `'${manager.name}' 매니저의 계정 정보를 '${newName}'(으)로 변경하시겠습니까?\n기존 고객 ${stats.clientCount}명 및 상담 메모 ${stats.memoCount}건이 모두 인계됩니다.`;

    if (!window.confirm(confirmMsg)) return;

    setIsLoading(true);
    showToast('계정 승계 및 정보 변경 중입니다...', 'info');

    const res = await updateManagerSuccession({
      managerId: manager.id,
      newName: newName.trim(),
      newEmail: newEmail.trim(),
      newPassword: newPassword.trim() || undefined,
      newPhone: newPhone.trim() || undefined,
      newTeamId: Number(newTeamId)
    });

    setIsLoading(false);

    if (res.success) {
      if (res.warning) {
        showToast(res.warning, 'info');
      } else {
        showToast(`'${newName}' 매니저로 계정 승계가 완료되었습니다.`, 'success');
      }
      onSuccess();
      onClose();
    } else {
      showToast(`계정 승계 실패: ${res.error}`, 'error');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            backgroundColor: '#0f172a',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={22} style={{ color: '#38bdf8' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>
                매니저 계정 승계 및 정보 변경
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                퇴사자 인수인계 및 신규 매니저 계정 전환
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Data Inheritance Notice Box */}
        <div style={{ padding: '20px 24px 0 24px' }}>
          <div
            style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <CheckCircle2 size={20} style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '13px', color: '#0369a1', lineHeight: '1.5' }}>
              <strong>100% 무결성 인수인계 안내:</strong><br />
              현재 <strong>[{manager.name}]</strong> 매니저의 담당 고객 <strong>{stats.clientCount}명</strong>과 상담 메모 <strong>{stats.memoCount}건</strong>이 새 매니저에게 유실 없이 자동 승계됩니다.
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* New Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                새 담당자 이름 (필수)
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 신규 매니저 이름"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* New Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                새 로그인 이메일 (필수)
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="예: manager@novel-tax.kr"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                새 비밀번호 설정 (선택)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="비워둘 시 기존 비밀번호가 유지됩니다"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                * 퇴사자 접속 차단 시 새로운 비밀번호를 입력해 주시면 즉시 적용됩니다.
              </span>
            </div>

            {/* Team and Phone row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  소속 팀
                </label>
                <select
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box'
                  }}
                >
                  {dbTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  연락처 (전화번호)
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '9px 18px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '9px 22px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? '처리 중...' : '계정 승계 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
