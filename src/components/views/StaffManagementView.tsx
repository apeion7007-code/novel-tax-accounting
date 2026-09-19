import React, { useState } from 'react';
import { X, UserCheck } from 'lucide-react';
import { ManagerSuccessionModal } from '../modals/ManagerSuccessionModal';
import { toggleManagerBlockStatus } from '../../services/managerAccountService';

interface Team {
  id: number;
  createdAt: string;
  name: string;
}

interface NewManagerData {
  name: string;
  teamId: string;
  phone: string;
  email: string;
  address: string;
  facebookMessenger: string;
}

interface StaffManagementViewProps {
  dbTeams: Team[];
  dbManagers: any[];
  managerPage: number;
  setManagerPage: React.Dispatch<React.SetStateAction<number>>;
  managerItemsPerPage: number;
  isAddManagerModalOpen: boolean;
  setIsAddManagerModalOpen: (open: boolean) => void;
  newManagerData: NewManagerData;
  setNewManagerData: React.Dispatch<React.SetStateAction<NewManagerData>>;
  handleCreateTeam: () => void;
  handleDeleteTeam: (id: number, name: string) => void;
  handleUpdateManagerTeam: (id: string, teamId: number) => void;
  handleApproveManager: (id: string, name: string) => void;
  handleDeleteManager: (id: string, name: string) => void;
  handleSaveNewManager: (e: React.FormEvent) => void;
  formatKoreanDateTime: (dtStr: string) => string;
  onManagerUpdated?: () => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  dbTeams,
  dbManagers,
  managerPage,
  setManagerPage,
  managerItemsPerPage,
  isAddManagerModalOpen,
  setIsAddManagerModalOpen,
  newManagerData,
  setNewManagerData,
  handleCreateTeam,
  handleDeleteTeam,
  handleUpdateManagerTeam,
  handleApproveManager,
  handleDeleteManager,
  handleSaveNewManager,
  formatKoreanDateTime,
  onManagerUpdated,
  showToast
}) => {
  const [selectedManagerForSuccession, setSelectedManagerForSuccession] = useState<any | null>(null);
  const [isSuccessionModalOpen, setIsSuccessionModalOpen] = useState(false);

  const handleToggleBlock = async (mgr: any) => {
    const isCurrentlyConfirmed = mgr.isConfirmed;
    const actionName = isCurrentlyConfirmed ? '접속 차단' : '가입 승인';
    if (!window.confirm(`'${mgr.name}' 매니저를 ${actionName}하시겠습니까?`)) return;

    if (!isCurrentlyConfirmed && handleApproveManager) {
      handleApproveManager(mgr.id, mgr.name);
      return;
    }

    const res = await toggleManagerBlockStatus(mgr.id, isCurrentlyConfirmed);
    if (res.success) {
      if (showToast) showToast(`'${mgr.name}' 매니저가 ${actionName}되었습니다.`, 'success');
      if (onManagerUpdated) onManagerUpdated();
    } else {
      if (showToast) showToast(`${actionName} 실패: ${res.error}`, 'error');
    }
  };
  return (
    <div className="view-container" style={{ backgroundColor: '#ffffff', padding: '24px' }}>
      
      {/* 1. 팀 관리 Section */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              팀 관리
              <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b' }}>팀을 조회 및 생성합니다.</span>
            </h2>
          </div>
          <button
            onClick={handleCreateTeam}
            style={{ padding: '8px 18px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
          >
            팀 생성
          </button>
        </div>

        <div className="table-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '800px', textAlign: 'center', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                <th style={{ padding: '10px' }}>번호</th>
                <th style={{ padding: '10px' }}>등록일</th>
                <th style={{ padding: '10px' }}>이름</th>
                <th style={{ padding: '10px' }}>팀원 수</th>
                <th style={{ padding: '10px' }}>팀삭제</th>
              </tr>
            </thead>
            <tbody>
              {dbTeams.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', color: '#94a3b8' }}>등록된 팀 정보가 없습니다.</td>
                </tr>
              ) : (
                dbTeams.map((team) => {
                  const memberCount = dbManagers.filter(m => m.teamId === team.id).length;
                  return (
                    <tr key={team.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td>{team.id}</td>
                      <td>{formatKoreanDateTime(team.createdAt)}</td>
                      <td style={{ fontWeight: 600 }}>{team.name}</td>
                      <td>{memberCount}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                          style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. 매니저 관리 Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            매니저 관리
            <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b' }}>매니저 회원가입 승인 및 매니저 정보를 관리합니다.</span>
          </h2>
          <button
            onClick={() => {
              setNewManagerData({ name: '', teamId: dbTeams[0]?.id ? String(dbTeams[0].id) : '', phone: '', email: '', address: '', facebookMessenger: '' });
              setIsAddManagerModalOpen(true);
            }}
            style={{ padding: '8px 18px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
          >
            매니저 생성
          </button>
        </div>

        <div className="table-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '1000px', textAlign: 'center', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                <th style={{ padding: '10px', width: '60px' }}>번호</th>
                <th style={{ padding: '10px', width: '120px' }}>등록일</th>
                <th style={{ padding: '10px', width: '130px' }}>팀</th>
                <th style={{ padding: '10px' }}>이름 (계정 이메일)</th>
                <th style={{ padding: '10px', width: '150px' }}>접속 상태/관리</th>
                <th style={{ padding: '10px', width: '170px' }}>계정 승계 (인수인계)</th>
                <th style={{ padding: '10px', width: '80px' }}>삭제</th>
              </tr>
            </thead>
            <tbody>
              {dbManagers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', color: '#94a3b8' }}>등록된 매니저 정보가 없습니다.</td>
                </tr>
              ) : (
                (() => {
                  const displayedMgrs = dbManagers.slice((managerPage - 1) * managerItemsPerPage, managerPage * managerItemsPerPage);
                  
                  return displayedMgrs.map((mgr, idx) => {
                    const displayIndex = (managerPage - 1) * managerItemsPerPage + idx;
                    return (
                      <tr key={mgr.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td>{displayIndex}</td>
                        <td>{formatKoreanDateTime(mgr.createdAt)}</td>
                        <td>
                          <select
                            value={mgr.teamId || ''}
                            onChange={(e) => handleUpdateManagerTeam(mgr.id, Number(e.target.value))}
                            style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', backgroundColor: '#fff' }}
                          >
                            {dbTeams.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ textAlign: 'left', paddingLeft: '16px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{mgr.name}</div>
                          {mgr.email && (
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{mgr.email}</div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {mgr.isConfirmed ? (
                              <>
                                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold' }}>정상</span>
                                <button
                                  onClick={() => handleToggleBlock(mgr)}
                                  title="퇴사 시 클릭하면 해당 매니저의 로그인이 즉시 차단됩니다"
                                  style={{ backgroundColor: '#ea580c', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  접속 차단
                                </button>
                              </>
                            ) : (
                              <>
                                <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold' }}>차단됨</span>
                                <button
                                  onClick={() => handleToggleBlock(mgr)}
                                  title="재입사 또는 차단 해제 시 클릭하면 해당 매니저의 로그인이 즉시 복구됩니다"
                                  style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  접속 복구
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedManagerForSuccession(mgr);
                              setIsSuccessionModalOpen(true);
                            }}
                            title="신규 매니저에게 기존 고객 및 상담 이력을 100% 인계하고 계정 정보를 변경합니다"
                            style={{
                              backgroundColor: '#4f46e5',
                              color: 'white',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <UserCheck size={14} />
                            계정 승계 / 비번 변경
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteManager(mgr.id, mgr.name)}
                            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()
              )}
            </tbody>
          </table>
        </div>

        {/* Manager Pagination Navigation Bar (< 이전 1 2 다음 >) */}
        {dbManagers.length > managerItemsPerPage && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
            <button
              disabled={managerPage === 1}
              onClick={() => setManagerPage(prev => Math.max(prev - 1, 1))}
              style={{ border: 'none', background: 'none', color: managerPage === 1 ? '#cbd5e1' : '#64748b', cursor: managerPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}
            >
              &lt; 이전
            </button>

            {Array.from({ length: Math.ceil(dbManagers.length / managerItemsPerPage) }).map((_, pIdx) => {
              const pageNum = pIdx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setManagerPage(pageNum)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: managerPage === pageNum ? '#0f172a' : 'transparent',
                    color: managerPage === pageNum ? '#ffffff' : '#475569',
                    fontWeight: managerPage === pageNum ? 'bold' : 'normal',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={managerPage >= Math.ceil(dbManagers.length / managerItemsPerPage)}
              onClick={() => setManagerPage(prev => Math.min(prev + 1, Math.ceil(dbManagers.length / managerItemsPerPage)))}
              style={{ border: 'none', background: 'none', color: managerPage >= Math.ceil(dbManagers.length / managerItemsPerPage) ? '#cbd5e1' : '#64748b', cursor: managerPage >= Math.ceil(dbManagers.length / managerItemsPerPage) ? 'not-allowed' : 'pointer', fontSize: '13px' }}
            >
              다음 &gt;
            </button>
          </div>
        )}
      </div>

      {/* Modal for Adding New Manager with Extended Details */}
      {isAddManagerModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddManagerModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '520px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>신규 매니저 직접 등록</h3>
              <button className="btn-close" style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => setIsAddManagerModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveNewManager}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>매니저 성명 <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="예: Boram, 홍길동"
                    value={newManagerData.name}
                    onChange={(e) => setNewManagerData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>소속 팀 <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    className="form-control"
                    value={newManagerData.teamId}
                    onChange={(e) => setNewManagerData(prev => ({ ...prev, teamId: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  >
                    <option value="">-- 팀 선택 --</option>
                    {dbTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>연락처 (핸드폰번호)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="010-XXXX-XXXX"
                    value={newManagerData.phone}
                    onChange={(e) => setNewManagerData(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>이메일 주소</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="manager@novel-tax.kr"
                    value={newManagerData.email}
                    onChange={(e) => setNewManagerData(prev => ({ ...prev, email: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>주소 (거주지)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="주소 입력"
                    value={newManagerData.address}
                    onChange={(e) => setNewManagerData(prev => ({ ...prev, address: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>페이스북 메신저 / SNS ID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Facebook ID 또는 메신저 링크"
                    value={newManagerData.facebookMessenger}
                    onChange={(e) => setNewManagerData(prev => ({ ...prev, facebookMessenger: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn-cancel" style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', cursor: 'pointer' }} onClick={() => setIsAddManagerModalOpen(false)}>취소</button>
                <button type="submit" className="btn-submit" style={{ padding: '8px 18px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>등록 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. 계정 승계 및 비밀번호/정보 변경 모달 */}
      <ManagerSuccessionModal
        isOpen={isSuccessionModalOpen}
        onClose={() => setIsSuccessionModalOpen(false)}
        manager={selectedManagerForSuccession}
        dbTeams={dbTeams}
        onSuccess={() => {
          if (onManagerUpdated) onManagerUpdated();
        }}
        showToast={showToast || ((msg) => alert(msg))}
      />

    </div>
  );
};
