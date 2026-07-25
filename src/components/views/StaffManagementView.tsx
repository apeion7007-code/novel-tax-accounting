import React from 'react';
import { X } from 'lucide-react';

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
  formatKoreanDateTime
}) => {
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
          <table className="data-table" style={{ width: '100%', minWidth: '900px', textAlign: 'center', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                <th style={{ padding: '10px', width: '80px' }}>번호</th>
                <th style={{ padding: '10px' }}>등록일</th>
                <th style={{ padding: '10px' }}>팀</th>
                <th style={{ padding: '10px' }}>이름</th>
                <th style={{ padding: '10px' }}>가입승인</th>
                <th style={{ padding: '10px' }}>매니저삭제</th>
              </tr>
            </thead>
            <tbody>
              {dbManagers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', color: '#94a3b8' }}>등록된 매니저 정보가 없습니다.</td>
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
                        <td style={{ fontWeight: 600 }}>{mgr.name}</td>
                        <td>
                          {mgr.isConfirmed ? (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>승인됨</span>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleApproveManager(mgr.id, mgr.name)}
                                style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                승인
                              </button>
                              <button
                                onClick={() => handleDeleteManager(mgr.id, mgr.name)}
                                style={{ backgroundColor: '#f97316', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                삭제
                              </button>
                            </div>
                          )}
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

    </div>
  );
};
