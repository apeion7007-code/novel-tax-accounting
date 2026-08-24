import React from 'react';
import { Filter, RotateCcw, Search, Plus, Trash2, FileSpreadsheet, Download, X, AlertTriangle, Clock, ChevronDown } from 'lucide-react';
import type { Customer } from '../../App';



interface CustomerListViewProps {
  // Navigation & View controllers
  setCurrentView: (view: 'customer' | 'registration' | 'dashboard' | 'staff' | 'password' | 'consent' | 'validator') => void;
  
  // Search & Filter state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isFilterModalOpen: boolean;
  setIsFilterModalOpen: (open: boolean) => void;
  
  // Filter Fields
  selectedNationality: string;
  setSelectedNationality: (val: string) => void;
  selectedRefundStatus: string;
  setSelectedRefundStatus: (val: string) => void;
  selectedManager: string;
  setSelectedManager: (val: string) => void;
  filterVisaType: string;
  setFilterVisaType: (val: string) => void;
  filterCompanyName: string;
  setFilterCompanyName: (val: string) => void;
  filterBirthDate: string;
  setFilterBirthDate: (val: string) => void;
  filterForeignerNumber: string;
  setFilterForeignerNumber: (val: string) => void;
  filterRegDate: string;
  setFilterRegDate: (val: string) => void;
  filterBeforeDate: string;
  setFilterBeforeDate: (val: string) => void;
  filterMonthlyRent: string;
  setFilterMonthlyRent: (val: string) => void;
  
  // Modals state
  isHometaxExcelSyncModalOpen: boolean;
  setIsHometaxExcelSyncModalOpen: (open: boolean) => void;
  isHometaxModalOpen: boolean;
  setIsHometaxModalOpen: (open: boolean) => void;
  
  // Lists
  filteredCustomers: Customer[];
  displayedCustomers: Customer[];
  totalPages: number;
  availableTeamList: string[];
  availableManagerList: string[];
  nationalities: string[];
  refundStatuses: string[];
  
  // Selection
  selectedIds: number[];
  
  // Pagination
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  
  // Actions
  handleResetFilters: () => void;
  handleResetAll: () => void;
  handleDeleteCustomers: () => void;
  handleExportExcel: () => void;
  handleDownloadHometaxFile: () => void;
  handleOpenCustomerRegistration: (client: Customer) => void;
  handleSelectAll: (checked: boolean) => void;
  handleSelectRow: (id: number, checked: boolean) => void;
  handleInlineCountryChange: (id: number, val: string) => void;
  handleInlineManagerChange: (id: number, val: string) => void;
  handleSaveRow: (id: number) => void;
  tempInlineEdits?: Record<number, { nationality?: string; managerName?: string; managerCountry?: string }>;

  // Tab controls
  selectedTab: 'all' | 'inProgress' | 'feeCompleted' | 'nextYear';
  setSelectedTab: (tab: 'all' | 'inProgress' | 'feeCompleted' | 'nextYear') => void;
  countAll: number;
  countInProgress: number;
  countFeeCompleted: number;
  countNextYear: number;
  isSuperAdmin?: boolean;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  setCurrentView,
  searchQuery,
  setSearchQuery,
  isFilterModalOpen,
  setIsFilterModalOpen,
  selectedNationality,
  setSelectedNationality,
  selectedRefundStatus,
  setSelectedRefundStatus,
  selectedManager,
  setSelectedManager,
  filterVisaType,
  setFilterVisaType,
  filterCompanyName,
  setFilterCompanyName,
  filterBirthDate,
  setFilterBirthDate,
  filterForeignerNumber,
  setFilterForeignerNumber,
  filterRegDate,
  setFilterRegDate,
  filterBeforeDate,
  setFilterBeforeDate,
  filterMonthlyRent,
  setFilterMonthlyRent,
  isHometaxExcelSyncModalOpen: _isHometaxExcelSyncModalOpen,
  setIsHometaxExcelSyncModalOpen,
  isHometaxModalOpen: _isHometaxModalOpen,
  setIsHometaxModalOpen,
  filteredCustomers,
  displayedCustomers,
  totalPages,
  availableTeamList,
  availableManagerList,
  nationalities,
  refundStatuses,
  selectedIds,
  currentPage,
  setCurrentPage,
  handleResetFilters,
  handleResetAll,
  handleDeleteCustomers,
  handleExportExcel,
  handleDownloadHometaxFile,
  handleOpenCustomerRegistration,
  handleSelectAll,
  handleSelectRow,
  handleInlineCountryChange,
  handleInlineManagerChange,
  handleSaveRow,
  tempInlineEdits = {},
  selectedTab,
  setSelectedTab,
  countAll,
  countInProgress,
  countFeeCompleted,
  countNextYear,
  isSuperAdmin = false
}) => {
  const [isVisaWidgetExpanded, setIsVisaWidgetExpanded] = React.useState<boolean>(false);
  const [isConsentOpen, setIsConsentOpen] = React.useState<boolean>(false);
  const [isHometaxOpen, setIsHometaxOpen] = React.useState<boolean>(false);

  const visaAlerts = React.useMemo(() => {
    const today = new Date();
    const urgent: any[] = [];
    const warning: any[] = [];

    filteredCustomers.forEach(c => {
      // Filter out completed, ineligible, or cancelled refund statuses (미 환급자만 추출)
      const excludedStatuses = [
        '♥경정청구완료', 
        '♡국세수수료수납완료', 
        '◆지방세수수료수납완료', 
        '♠지방세수수료수납완료', 
        '자격안됨', 
        '◎자격안됨(확인완료)', 
        '고객취소', 
        '홈택스가입불가', 
        '▲경정청구기각'
      ];
      if (excludedStatuses.includes(c.refundStatus)) return;

      if (!c.visaExpireDate) return;
      const expire = new Date(c.visaExpireDate);
      if (isNaN(expire.getTime())) return;
      
      const diffTime = expire.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const alertItem = {
        customer: c,
        days: diffDays,
        dateStr: c.visaExpireDate.split('T')[0]
      };

      if (diffDays >= 0 && diffDays <= 30) {
        urgent.push(alertItem);
      } else if (diffDays > 30 && diffDays <= 90) {
        warning.push(alertItem);
      }
    });

    urgent.sort((a, b) => a.days - b.days);
    warning.sort((a, b) => a.days - b.days);

    return { urgent, warning };
  }, [filteredCustomers]);

  return (
    <>
      <header className="top-bar">
        <div className="filter-controls">
          <button className="btn-filter" onClick={() => setIsFilterModalOpen(true)}>
            <Filter size={16} />
            필터추가
          </button>
          <button className="btn-filter-reset" title="필터 초기화" onClick={handleResetFilters}>
            <RotateCcw size={16} />
          </button>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '34px', width: '220px', height: '38px' }}
              placeholder="이름 또는 회사명 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="action-controls">
          <button className="btn-action btn-add" onClick={() => { handleResetAll(); setCurrentView('registration'); }}>
            <Plus size={16} />
            신규등록
          </button>
          {isSuperAdmin && (
            <button className="btn-action btn-delete" onClick={handleDeleteCustomers}>
              <Trash2 size={16} />
              삭제
            </button>
          )}
          <button className="btn-action btn-excel" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} />
            Excel로 내보내기
          </button>

          {/* 📋 수임동의 업무 대분류 드롭다운 */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button 
              className="btn-action" 
              style={{ backgroundColor: '#0284c7', color: '#ffffff', borderColor: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => { setIsConsentOpen(!isConsentOpen); setIsHometaxOpen(false); }}
            >
              <Download size={16} />
              수임동의 업무
              <ChevronDown size={14} style={{ marginLeft: '2px', transform: isConsentOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {isConsentOpen && (
              <>
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setIsConsentOpen(false)} />
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', minWidth: '185px', zIndex: 999, padding: '4px 0', overflow: 'hidden' }}>
                  <button 
                    style={{ width: '100%', padding: '10px 16px', fontSize: '13px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', transition: 'background-color 0.15s' }}
                    onClick={() => { handleDownloadHometaxFile(); setIsConsentOpen(false); }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Download size={14} />
                    수임동의 파일 다운로드
                  </button>
                  <button 
                    style={{ width: '100%', padding: '10px 16px', fontSize: '13px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', transition: 'background-color 0.15s' }}
                    onClick={() => { setIsHometaxExcelSyncModalOpen(true); setIsConsentOpen(false); }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <FileSpreadsheet size={14} />
                    수임 대행 관리
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 🏛️ 국세청 홈택스 전산매체 대량 등록 대분류 드롭다운 */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button 
              className="btn-action" 
              style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => { setIsHometaxOpen(!isHometaxOpen); setIsConsentOpen(false); }}
            >
              <Download size={16} />
              전산매체 대량등록
              <ChevronDown size={14} style={{ marginLeft: '2px', transform: isHometaxOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {isHometaxOpen && (
              <>
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setIsHometaxOpen(false)} />
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', minWidth: '220px', zIndex: 999, padding: '4px 0', overflow: 'hidden' }}>
                  <button 
                    style={{ width: '100%', padding: '10px 16px', fontSize: '13px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', transition: 'background-color 0.15s' }}
                    onClick={() => { setIsHometaxModalOpen(true); setIsHometaxOpen(false); }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Download size={14} />
                    국세청 홈택스 파일 생성
                  </button>
                  <button 
                    style={{ width: '100%', padding: '10px 16px', fontSize: '13px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', transition: 'background-color 0.15s' }}
                    onClick={() => { setCurrentView('validator'); setIsHometaxOpen(false); }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Search size={14} />
                    전산매체 파일 검증기
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="record-count">
            총 <span>{filteredCustomers.length}</span>건
          </div>
        </div>
      </header>

      {/* 📂 상태 그룹 탭 */}
      <div className="status-tabs-container" style={{ 
        display: 'flex', 
        gap: '6px', 
        padding: '0 24px', 
        marginTop: '16px',
        borderBottom: '2px solid #e2e8f0',
        backgroundColor: '#ffffff'
      }}>
        {[
          { id: 'all', label: '전체', count: countAll },
          { id: 'inProgress', label: '⏳ 진행 중', count: countInProgress },
          { id: 'feeCompleted', label: '💵 수납 완료', count: countFeeCompleted },
          { id: 'nextYear', label: `📅 ${new Date().getFullYear() + 1}년 접수대상`, count: countNextYear }
        ].map(tab => {
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#0084ff' : '#64748b',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? '3px solid #0084ff' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease-in-out',
                marginBottom: '-2px',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = '#1e293b';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = '#64748b';
              }}
            >
              <span>{tab.label}</span>
              <span style={{ 
                fontSize: '11px', 
                backgroundColor: isActive ? '#e0f2fe' : '#f1f5f9', 
                color: isActive ? '#0369a1' : '#475569', 
                padding: '2px 8px', 
                borderRadius: '10px',
                fontWeight: '600',
                transition: 'all 0.15s ease-in-out'
              }}>
                {tab.count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      {/* ⚠️ 비자 만료 경고 대시보드 위젯 */}
      {(visaAlerts.urgent.length > 0 || visaAlerts.warning.length > 0) && (
        <div style={{ margin: '0 0 20px 0', border: '1px solid #fed7d7', borderRadius: '12px', backgroundColor: '#fff5f5', overflow: 'hidden', boxShadow: '0 4px 15px -3px rgba(239, 68, 68, 0.1)' }}>
          <div 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', userSelect: 'none', backgroundColor: '#fff0f0' }}
            onClick={() => setIsVisaWidgetExpanded(!isVisaWidgetExpanded)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '18px' }}>🚨</span>
              <span style={{ fontWeight: 700, color: '#991b1b', fontSize: '14px' }}>비자 만료 경보 대시보드 (미환급자 대상)</span>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {visaAlerts.urgent.length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '20px', border: '1px solid #fca5a5' }}>
                    <AlertTriangle size={12} color="#dc2626" />
                    미환급 임박 (30일 이내) {visaAlerts.urgent.length}건
                  </span>
                )}
                {visaAlerts.warning.length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '20px', border: '1px solid #fde68a' }}>
                    <Clock size={12} color="#d97706" />
                    미환급 예정 (90일 이내) {visaAlerts.warning.length}건
                  </span>
                )}
              </div>
            </div>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 'bold', fontSize: '13px' }}>
              {isVisaWidgetExpanded ? '접기 ▲' : '자세히 보기 ▼'}
            </button>
          </div>

          {isVisaWidgetExpanded && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', backgroundColor: '#ffffff', borderTop: '1px solid #fed7d7' }}>
              {/* 왼쪽: 임박 (30일 이내) */}
              <div style={{ border: '1px solid #fee2e2', borderRadius: '8px', padding: '14px', backgroundColor: '#fffafb' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>
                  미환급 임박 고객 리스트 (30일 이내)
                </h4>
                {visaAlerts.urgent.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>임박한 미환급 고객이 없습니다.</p>
                ) : (
                  <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {visaAlerts.urgent.map(item => (
                      <div key={item.customer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#ffffff', border: '1px solid #fecaca', borderRadius: '6px' }}>
                        <div>
                          <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>{item.customer.name}</span>
                          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{item.customer.visa}</span>
                          <span style={{ fontSize: '11px', color: '#ef4444', marginLeft: '8px', fontWeight: 'bold' }}>({item.customer.nationality})</span>
                          <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '6px', padding: '1px 4px', border: '1px dashed #cbd5e1', borderRadius: '3px' }}>{item.customer.refundStatus}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700 }}>D-{item.days} ({item.dateStr})</span>
                          <button 
                            className="btn-filter"
                            style={{ padding: '3px 8px', fontSize: '11px', height: '24px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}
                            onClick={() => handleOpenCustomerRegistration(item.customer)}
                          >
                            바로가기
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 오른쪽: 예정 (90일 이내) */}
              <div style={{ border: '1px solid #fef3c7', borderRadius: '8px', padding: '14px', backgroundColor: '#fffdf9' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#f59e0b', borderRadius: '50%' }}></span>
                  미환급 만료 예정 고객 리스트 (90일 이내)
                </h4>
                {visaAlerts.warning.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>만료 예정인 미환급 고객이 없습니다.</p>
                ) : (
                  <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {visaAlerts.warning.map(item => (
                      <div key={item.customer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#ffffff', border: '1px solid #fde68a', borderRadius: '6px' }}>
                        <div>
                          <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>{item.customer.name}</span>
                          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{item.customer.visa}</span>
                          <span style={{ fontSize: '11px', color: '#d97706', marginLeft: '8px', fontWeight: 'bold' }}>({item.customer.nationality})</span>
                          <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '6px', padding: '1px 4px', border: '1px dashed #cbd5e1', borderRadius: '3px' }}>{item.customer.refundStatus}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 700 }}>D-{item.days} ({item.dateStr})</span>
                          <button 
                            className="btn-filter"
                            style={{ padding: '3px 8px', fontSize: '11px', height: '24px', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
                            onClick={() => handleOpenCustomerRegistration(item.customer)}
                          >
                            바로가기
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="table-wrapper">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>
                  <label className="checkbox-container" style={{ paddingLeft: 0 }}>
                    <input
                      type="checkbox"
                      checked={filteredCustomers.length > 0 && selectedIds.length === filteredCustomers.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                  </label>
                </th>
                <th>등록일</th>
                <th>국적</th>
                <th>이름</th>
                <th>생년월일</th>
                <th>비자</th>
                <th>회사명</th>
                <th>환급처리상태</th>
                <th>감면명세서 제출상태</th>
                <th>월세여부</th>
                <th style={{ minWidth: '110px' }}>경정청구일</th>
                <th style={{ minWidth: '110px' }}>추가 신청일</th>
                <th style={{ minWidth: '90px' }}>실적</th>
                <th style={{ minWidth: '190px', textAlign: 'center', position: 'sticky', right: 0, backgroundColor: '#0e1834', zIndex: 10, boxShadow: '-3px 0 6px rgba(0, 0, 0, 0.15)' }}>
                  담당자 변경 / 저장
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={15} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    조건에 맞는 고객 정보가 존재하지 않습니다.
                  </td>
                </tr>
              ) : (
                displayedCustomers.map((customer) => {
                  return (
                    <tr key={customer.id} onDoubleClick={() => handleOpenCustomerRegistration(customer)} style={{ cursor: 'pointer' }}>
                      <td>{customer.id}</td>
                      <td>
                        <label className="checkbox-container" style={{ paddingLeft: 0 }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(customer.id)}
                            onChange={(e) => handleSelectRow(customer.id, e.target.checked)}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </td>
                      <td>{customer.registeredDate}</td>
                      <td>{customer.nationality}</td>
                      <td 
                        style={{ fontWeight: 600, color: '#0284c7', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => handleOpenCustomerRegistration(customer)}
                        title="클릭하여 고객등록 관리 화면 열기"
                      >
                        {customer.isNextYearApply && <span style={{ color: '#eab308', marginRight: '4px' }} title={`${new Date().getFullYear() + 1}년 접수대상`}>⭐</span>}
                        {customer.name}
                      </td>
                      <td>{customer.birthDate}</td>
                      <td>{customer.visa}</td>
                      <td>{customer.companyName}</td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          {customer.refundStatus || '-'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          {customer.submissionStatus && customer.submissionStatus !== '-' ? customer.submissionStatus : '-'}
                        </span>
                      </td>
                      <td>{customer.monthlyRent}</td>
                      <td>{customer.claimDate}</td>
                      <td>{customer.additionalApplyDate || '-'}</td>
                      <td>{customer.additionalPerformance ? customer.additionalPerformance.toLocaleString('ko-KR') : '0'}</td>
                      <td style={{ textAlign: 'center', position: 'sticky', right: 0, backgroundColor: '#ffffff', zIndex: 5, boxShadow: '-3px 0 6px rgba(0, 0, 0, 0.08)' }}>
                        <div className="inline-edit" style={{ display: 'flex', gap: '3px', alignItems: 'center', justifyContent: 'center' }}>
                          <select
                            className="select-sm"
                            style={{ fontSize: '11px', padding: '2px 2px', height: '26px', maxWidth: '75px' }}
                            value={tempInlineEdits[customer.id]?.nationality || customer.nationality}
                            onChange={(e) => handleInlineCountryChange(customer.id, e.target.value)}
                          >
                            {availableTeamList.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                          <select
                            className="select-sm"
                            style={{ fontSize: '11px', padding: '2px 2px', height: '26px', maxWidth: '70px' }}
                            value={tempInlineEdits[customer.id]?.managerName || customer.managerName}
                            onChange={(e) => handleInlineManagerChange(customer.id, e.target.value)}
                          >
                            {availableManagerList.map(mName => <option key={mName} value={mName}>{mName}</option>)}
                          </select>
                          <button 
                            className="btn-save" 
                            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}
                            onClick={() => handleSaveRow(customer.id)}
                          >
                            저장
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smooth Pagination Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px 24px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', marginTop: '12px', borderRadius: '8px' }}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: currentPage === 1 ? '#f8fafc' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#0284c7', fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
        >
          ◀ 이전 페이지
        </button>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>
          <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '16px' }}>{currentPage}</span> / {totalPages} 페이지 (총 {filteredCustomers.length.toLocaleString()}건 중 50건씩 표시)
        </span>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: currentPage >= totalPages ? '#f8fafc' : '#fff', color: currentPage >= totalPages ? '#94a3b8' : '#0284c7', fontWeight: 600, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
        >
          다음 페이지 ▶
        </button>
      </div>

      {isFilterModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsFilterModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>상세 필터 검색</h3>
              <button className="btn-close" onClick={() => setIsFilterModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>국적 선택</label>
                <select className="form-control" style={{ height: '36px', fontSize: '13px' }} value={selectedNationality} onChange={(e) => setSelectedNationality(e.target.value)}>
                  <option value="">전체 국적</option>
                  {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>환급처리상태</label>
                <select className="form-control" style={{ height: '36px', fontSize: '13px' }} value={selectedRefundStatus} onChange={(e) => setSelectedRefundStatus(e.target.value)}>
                  <option value="">전체 상태</option>
                  {refundStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>담당 매니저</label>
                <select className="form-control" style={{ height: '36px', fontSize: '13px' }} value={selectedManager} onChange={(e) => setSelectedManager(e.target.value)}>
                  <option value="">전체 매니저</option>
                  {availableManagerList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>비자종류</label>
                <input type="text" className="form-control" style={{ height: '36px', fontSize: '13px' }} placeholder="예: E9, E10" value={filterVisaType} onChange={(e) => setFilterVisaType(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>회사명</label>
                <input type="text" className="form-control" style={{ height: '36px', fontSize: '13px' }} placeholder="회사명 검색" value={filterCompanyName} onChange={(e) => setFilterCompanyName(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>생년월일</label>
                <input type="text" className="form-control" style={{ height: '36px', fontSize: '13px' }} placeholder="생년월일 (YYMMDD)" value={filterBirthDate} onChange={(e) => setFilterBirthDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>외국인등록번호</label>
                <input type="text" className="form-control" style={{ height: '36px', fontSize: '13px' }} placeholder="외국인등록번호" value={filterForeignerNumber} onChange={(e) => setFilterForeignerNumber(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>등록일</label>
                <input type="date" className="form-control" style={{ height: '36px', fontSize: '13px' }} value={filterRegDate} onChange={(e) => setFilterRegDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>특정일 이전 등록</label>
                <input type="date" className="form-control" style={{ height: '36px', fontSize: '13px' }} value={filterBeforeDate} onChange={(e) => setFilterBeforeDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>월세거주 여부</label>
                <select className="form-control" style={{ height: '36px', fontSize: '13px' }} value={filterMonthlyRent} onChange={(e) => setFilterMonthlyRent(e.target.value)}>
                  <option value="">전체</option>
                  <option value="예">예</option>
                  <option value="아니오">아니오</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleResetFilters}>필터 초기화</button>
              <button className="btn-submit" onClick={() => setIsFilterModalOpen(false)}>필터 적용</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
