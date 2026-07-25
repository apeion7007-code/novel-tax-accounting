import React from 'react';
import { Save } from 'lucide-react';

interface ChangePasswordViewProps {
  passwordChangeText: { current: string; new: string; confirm: string };
  setPasswordChangeText: React.Dispatch<React.SetStateAction<{ current: string; new: string; confirm: string }>>;
  handleChangePassword: (e: React.FormEvent) => void;
}

export const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({
  passwordChangeText,
  setPasswordChangeText,
  handleChangePassword
}) => {
  return (
    <div className="view-container">
      <div className="view-card form-narrow">
        <h2 className="view-title">보안 비밀번호 변경</h2>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>현재 비밀번호</label>
            <input
              type="password"
              className="form-control"
              value={passwordChangeText.current}
              onChange={(e) => setPasswordChangeText(prev => ({ ...prev, current: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>새 비밀번호</label>
            <input
              type="password"
              className="form-control"
              value={passwordChangeText.new}
              onChange={(e) => setPasswordChangeText(prev => ({ ...prev, new: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>새 비밀번호 확인</label>
            <input
              type="password"
              className="form-control"
              value={passwordChangeText.confirm}
              onChange={(e) => setPasswordChangeText(prev => ({ ...prev, confirm: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn-action btn-add" style={{ display: 'inline-flex', width: 'auto' }}>
            <Save size={16} />
            비밀번호 업데이트
          </button>
        </form>
      </div>
    </div>
  );
};
