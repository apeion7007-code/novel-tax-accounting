import React from 'react';
import { UserCheck, BarChart3, Users, Lock, LogOut } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentManager: any;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  currentManager,
  onLogout
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo_n.png" alt="Novel Tax Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
        <div className="sidebar-logo-text">
          <span className="logo-title">노벨 세무회계 연구</span>
          <span className="logo-subtitle">TAX & ACCOUNTING</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        <button
          className={`sidebar-item ${currentView === 'customer' || currentView === 'registration' ? 'active' : ''}`}
          onClick={() => setCurrentView('customer')}
        >
          <UserCheck size={18} />
          고객등록 관리
        </button>
        <button
          className={`sidebar-item ${currentView === 'rentSupport' ? 'active' : ''}`}
          onClick={() => setCurrentView('rentSupport')}
        >
          <span style={{ fontSize: '18px', marginRight: '6px' }}>💵</span>
          청년월세 한시 특별지원 (정부 복지)
        </button>
        {currentManager?.email === 'admin@novel.com' && (
          <button
            className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <BarChart3 size={18} />
            통계 및 실적 대시보드
          </button>
        )}
        <button
          className={`sidebar-item ${currentView === 'staff' ? 'active' : ''}`}
          onClick={() => setCurrentView('staff')}
        >
          <Users size={18} />
          직원 관리
        </button>
        <button
          className={`sidebar-item ${currentView === 'password' ? 'active' : ''}`}
          onClick={() => setCurrentView('password')}
        >
          <Lock size={18} />
          비밀번호 변경
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={onLogout}>
          <LogOut size={18} />
          로그아웃
        </button>
      </div>
    </aside>
  );
};
