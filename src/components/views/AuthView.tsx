import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

interface AuthViewProps {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentManager: React.Dispatch<React.SetStateAction<any>>;
  setRegForm: React.Dispatch<React.SetStateAction<any>>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dbTeams: any[];
}

export const AuthView: React.FC<AuthViewProps> = ({
  setIsLoggedIn,
  setCurrentManager,
  setRegForm,
  showToast,
  dbTeams
}) => {
  // Local states for login & signup forms
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [loginId, setLoginId] = useState<string>('');
  const [loginPw, setLoginPw] = useState<string>('');
  
  const [signUpName, setSignUpName] = useState<string>('');
  const [signUpEmail, setSignUpEmail] = useState<string>('');
  const [signUpPassword, setSignUpPassword] = useState<string>('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState<string>('');
  const [signUpTeamId, setSignUpTeamId] = useState<number>(1);

  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!loginId || !loginPw) {
      const msg = '이메일과 비밀번호를 모두 입력해 주세요.';
      setAuthError(msg);
      showToast(msg, 'error');
      return;
    }

    const email = loginId.includes('@') ? loginId.trim() : `${loginId.trim()}@novel-tax.kr`;
    showToast('로그인을 진행 중입니다...', 'info');

    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password: loginPw
      });

      if (authErr) {
        throw authErr;
      }

      if (authData && authData.user) {
        const { data: managerData, error: managerErr } = await supabase
          .from('Manager')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (managerErr || !managerData) {
          const msg = '등록되지 않은 매니저 계정입니다.';
          setAuthError(msg);
          showToast(msg, 'error');
          await supabase.auth.signOut();
          return;
        }

        if (!managerData.isConfirmed) {
          const msg = '가입 승인 대기 중입니다. 관리자의 승인을 기다려주세요.';
          setAuthError(msg);
          showToast(msg, 'error');
          await supabase.auth.signOut();
          return;
        }

        setIsLoggedIn(true);
        setCurrentManager({
          ...managerData,
          email: authData.user.email
        });
        setRegForm((prev: any) => ({ ...prev, managerName: managerData.name || 'Boram' }));
        showToast(`${managerData.name || '관리자'} 님, 환영합니다!`, 'success');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message === 'Invalid login credentials') {
        const msg = '등록되지 않은 아이디(이메일)이거나 비밀번호가 틀렸습니다.';
        setAuthError(msg);
        showToast(msg, 'error');
      } else {
        const msg = '로그인 실패: ' + err.message;
        setAuthError(msg);
        showToast(msg, 'error');
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!signUpEmail || !signUpPassword || !signUpConfirmPassword || !signUpName) {
      const msg = '모든 가입 필드를 입력해 주세요.';
      setAuthError(msg);
      showToast(msg, 'error');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      const msg = '비밀번호가 일치하지 않습니다.';
      setAuthError(msg);
      showToast(msg, 'error');
      return;
    }

    const email = signUpEmail.includes('@') ? signUpEmail.trim() : `${signUpEmail.trim()}@novel-tax.kr`;
    showToast('회원가입 요청을 처리 중입니다...', 'info');

    try {
      const { count, error: countErr } = await supabase
        .from('Manager')
        .select('*', { count: 'exact', head: true });

      if (countErr) throw countErr;

      const isFirstUser = count === 0;

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password: signUpPassword,
        options: {
          data: {
            name: signUpName.trim(),
            teamId: signUpTeamId
          }
        }
      });

      if (authErr) {
        throw authErr;
      }

      if (authData && authData.user) {
        const { error: profileErr } = await supabase
          .from('Manager')
          .upsert([{
            id: authData.user.id,
            name: signUpName.trim(),
            teamId: signUpTeamId,
            isAdmin: isFirstUser,
            isConfirmed: isFirstUser
          }], { onConflict: 'id' });

        if (profileErr) {
          throw profileErr;
        }

        if (isFirstUser) {
          showToast('최초 관리자 계정으로 자동 가입 및 승인되었습니다! 즉시 로그인하실 수 있습니다.', 'success');
        } else {
          showToast('회원가입 신청이 정상 완료되었습니다. 기존 관리자의 승인 후 로그인할 수 있습니다.', 'success');
        }

        setSignUpEmail('');
        setSignUpName('');
        setSignUpPassword('');
        setSignUpConfirmPassword('');
        setIsSignUpMode(false);
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      const msg = '회원가입 실패: ' + err.message;
      setAuthError(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <img src="/logo_n.png" alt="Novel Tax Logo" style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }} />
          <div className="login-logo-text">
            <span className="login-logo-title">노벨 세무회계 연구</span>
            <span className="login-logo-subtitle">{isSignUpMode ? 'STAFF REGISTRATION' : 'ADMIN PORTAL'}</span>
          </div>
        </div>

        {!isSignUpMode ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>관리자 이메일 / 아이디</label>
              <input
                type="text"
                className="login-input"
                value={loginId}
                onChange={(e) => { setLoginId(e.target.value); setAuthError(null); }}
                placeholder="admin@novel-tax.kr"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>비밀번호</label>
              <input
                type="password"
                className="login-input"
                value={loginPw}
                onChange={(e) => { setLoginPw(e.target.value); setAuthError(null); }}
                placeholder="비밀번호 입력"
                required
              />
            </div>
            {authError && (
              <div style={{
                color: '#f87171',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12.5px',
                marginBottom: '16px',
                textAlign: 'center',
                fontWeight: 'bold',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {authError}
              </div>
            )}
            <button type="submit" className="btn-login">로그인</button>
            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
              <span style={{ color: '#94a3b8' }}>계정이 없으신가요? </span>
              <button type="button" onClick={() => { setIsSignUpMode(true); setAuthError(null); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>
                회원가입 신청
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <div className="form-group">
              <label>이름 (실명)</label>
              <input
                type="text"
                className="login-input"
                value={signUpName}
                onChange={(e) => { setSignUpName(e.target.value); setAuthError(null); }}
                placeholder="홍길동"
                required
              />
            </div>
            <div className="form-group">
              <label>소속 팀 / 담당 국가</label>
              <select
                className="login-input"
                value={signUpTeamId}
                onChange={(e) => setSignUpTeamId(Number(e.target.value))}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  height: '42px',
                  fontSize: '14px',
                  padding: '0 12px',
                  width: '100%',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                {dbTeams.length > 0 ? (
                  dbTeams.map(team => (
                    <option key={team.id} value={team.id} style={{ color: '#000000' }}>
                      {team.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value={1} style={{ color: '#000000' }}>관리자</option>
                    <option value={2} style={{ color: '#000000' }}>베트남팀</option>
                    <option value={3} style={{ color: '#000000' }}>미얀마팀</option>
                    <option value={4} style={{ color: '#000000' }}>몽골팀</option>
                    <option value={5} style={{ color: '#000000' }}>인도네시아팀</option>
                    <option value={6} style={{ color: '#000000' }}>우즈베키스탄팀</option>
                    <option value={7} style={{ color: '#000000' }}>캄보디아팀</option>
                    <option value={8} style={{ color: '#000000' }}>스리랑카팀</option>
                  </>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>이메일 주소</label>
              <input
                type="email"
                className="login-input"
                value={signUpEmail}
                onChange={(e) => { setSignUpEmail(e.target.value); setAuthError(null); }}
                placeholder="manager@novel-tax.kr"
                required
              />
            </div>
            <div className="form-group">
              <label>비밀번호</label>
              <input
                type="password"
                className="login-input"
                value={signUpPassword}
                onChange={(e) => { setSignUpPassword(e.target.value); setAuthError(null); }}
                placeholder="6자 이상 입력"
                minLength={6}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>비밀번호 확인</label>
              <input
                type="password"
                className="login-input"
                value={signUpConfirmPassword}
                onChange={(e) => { setSignUpConfirmPassword(e.target.value); setAuthError(null); }}
                placeholder="비밀번호 재입력"
                required
              />
            </div>
            {authError && (
              <div style={{
                color: '#f87171',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12.5px',
                marginBottom: '16px',
                textAlign: 'center',
                fontWeight: 'bold',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {authError}
              </div>
            )}
            <button type="submit" className="btn-login" style={{ backgroundColor: '#10b981' }}>회원가입 신청</button>
            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
              <span style={{ color: '#94a3b8' }}>이미 계정이 있으신가요? </span>
              <button type="button" onClick={() => { setIsSignUpMode(false); setAuthError(null); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>
                로그인으로 돌아가기
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
