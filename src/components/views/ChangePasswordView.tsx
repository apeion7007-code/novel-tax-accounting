import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface ChangePasswordViewProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  setCurrentView: (view: any) => void;
}

export const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({
  showToast,
  setCurrentView
}) => {
  const [passwordChangeText, setPasswordChangeText] = useState({ current: '', new: '', confirm: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordChangeText.new || !passwordChangeText.confirm) {
      showToast('새 비밀번호와 확인 비밀번호를 모두 입력해 주세요.', 'error');
      return;
    }
    if (passwordChangeText.new !== passwordChangeText.confirm) {
      showToast('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.', 'error');
      return;
    }

    showToast('비밀번호를 업데이트하는 중입니다...', 'info');

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordChangeText.new
      });

      if (error) {
        throw error;
      }

      showToast('비밀번호가 성공적으로 변경되었습니다. 다음 로그인부터 적용됩니다.', 'success');
      setPasswordChangeText({ current: '', new: '', confirm: '' });
      setCurrentView('customer');
    } catch (err: any) {
      console.error('Password change error:', err);
      showToast('비밀번호 변경 실패: ' + err.message, 'error');
    }
  };

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
