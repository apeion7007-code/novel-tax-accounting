import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Database, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Loader2, 
  Phone, 
  Calendar, 
  Building2, 
  Globe2,
  ArrowRight
} from 'lucide-react';
import { 
  searchCustomersGlobally, 
  claimCustomerToManager, 
  type GlobalSearchCustomerResult 
} from '../../services/globalCustomerSearchService';

interface GlobalCustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentManagerId?: string;
  currentManagerName?: string;
  currentManagerCountry?: string;
  isSuperAdmin?: boolean;
  initialKeyword?: string;
  onCustomerClaimed?: (serial: number, newManagerName: string, targetCountry: string) => void;
}

export const GlobalCustomerSearchModal: React.FC<GlobalCustomerSearchModalProps> = ({
  isOpen,
  onClose,
  currentManagerId,
  currentManagerName = '매니저',
  currentManagerCountry = '베트남',
  isSuperAdmin = false,
  initialKeyword = '',
  onCustomerClaimed
}) => {
  const [keyword, setKeyword] = useState<string>(initialKeyword);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [results, setResults] = useState<GlobalSearchCustomerResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [claimingSerial, setClaimingSerial] = useState<number | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (initialKeyword && initialKeyword.trim() !== '') {
        setKeyword(initialKeyword);
        performSearch(initialKeyword);
      } else {
        setResults([]);
        setHasSearched(false);
        setSearchError(null);
        setActionSuccessMsg(null);
      }
    }
  }, [isOpen, initialKeyword]);

  if (!isOpen) return null;

  const performSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSearchError('검색어(고객명, 전화번호, 생년월일 또는 번호)를 입력해 주세요.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setActionSuccessMsg(null);

    try {
      const res = await searchCustomersGlobally(
        trimmed,
        currentManagerId,
        currentManagerName,
        isSuperAdmin
      );

      if (res.success) {
        setResults(res.data);
      } else {
        setSearchError(res.error || '검색에 실패했습니다.');
        setResults([]);
      }
    } catch (err: any) {
      setSearchError(err?.message || '검색 중 예기치 않은 오류가 발생했습니다.');
      setResults([]);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(keyword);
  };

  const handleClaimCustomer = async (item: GlobalSearchCustomerResult) => {
    const confirmText = `[${item.name}] 고객님을 본인(${currentManagerName}) 담당으로 배정하시겠습니까?\n배정 즉시 본인의 고객 목록에 나타납니다.`;
    if (!window.confirm(confirmText)) return;

    setClaimingSerial(item.serial);
    try {
      const targetCountry = currentManagerCountry || item.country || '베트남';
      const res = await claimCustomerToManager(item.serial, currentManagerName, targetCountry);

      if (res.success) {
        // 로컬 결과 업데이트
        setResults(prev =>
          prev.map(r =>
            r.serial === item.serial
              ? {
                  ...r,
                  managerName: currentManagerName,
                  visibilityReason: 'VISIBLE',
                  visibilityMessage: `✅ 본인(${currentManagerName}) 담당으로 성공적으로 배정되었습니다!`
                }
              : r
          )
        );

        setActionSuccessMsg(`[${item.name}] 고객님이 ${currentManagerName} 매니저님 담당으로 배정되었습니다!`);

        // 부모 컴포넌트에 통보하여 목록 자동 새로고침
        if (onCustomerClaimed) {
          onCustomerClaimed(item.serial, currentManagerName, targetCountry);
        }
      } else {
        alert(`담당자 배정 실패: ${res.error || '오류가 발생했습니다.'}`);
      }
    } catch (e: any) {
      alert(`담당자 배정 중 오류: ${e.message}`);
    } finally {
      setClaimingSerial(null);
    }
  };

  const renderBadge = (reason: GlobalSearchCustomerResult['visibilityReason'], mgrName: string) => {
    switch (reason) {
      case 'UNASSIGNED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#fef3c7',
            color: '#b45309',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            <AlertTriangle size={14} />
            담당자 미배정 (관리자)
          </span>
        );
      case 'OTHER_MANAGER':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            <AlertTriangle size={14} />
            타 매니저 배정 ({mgrName})
          </span>
        );
      case 'COMPLETED_TAB':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#e0f2fe',
            color: '#0369a1',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            <Info size={14} />
            완료/종결 보관 중 (현재 탭 제외)
          </span>
        );
      case 'VISIBLE':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            <CheckCircle2 size={14} />
            내 담당 고객 (진행중)
          </span>
        );
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
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10500,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          width: '840px',
          maxWidth: '100%',
          maxHeight: '90vh',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#1e293b',
            color: '#ffffff',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)'
            }}>
              <Database size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>
                슈퍼베이스 고객 전수 찾기
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                내 목록이나 진행중 탭에 보이지 않는 고객을 슈퍼베이스 전체 DB에서 실시간 검색합니다.
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
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar Area */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b'
                }}
              />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="고객 이름, 전화번호(-없이 가능), 주민/외국인번호, 고유번호 입력"
                style={{
                  width: '100%',
                  height: '44px',
                  paddingLeft: '42px',
                  paddingRight: '14px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              style={{
                height: '44px',
                padding: '0 24px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: isSearching ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
                transition: 'background-color 0.15s'
              }}
            >
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              전수 검색
            </button>
          </form>

          {searchError && (
            <div style={{
              marginTop: '10px',
              padding: '8px 12px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              fontSize: '13px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertTriangle size={15} />
              {searchError}
            </div>
          )}

          {actionSuccessMsg && (
            <div style={{
              marginTop: '10px',
              padding: '8px 12px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              fontSize: '13px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={15} />
              {actionSuccessMsg}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {!hasSearched && !isSearching && (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: '#64748b'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#eef2ff',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Search size={26} />
              </div>
              <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                슈퍼베이스 24,000+ 전체 고객 DB 즉시 검색
              </h4>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', maxWidth: '440px', marginInline: 'auto' }}>
                목록에서 사라졌다고 느껴지거나 담당자가 미지정된 고객을 고객명이나 전화번호로 찾아보세요.
                발견 즉시 <strong>[내 담당으로 가져오기]</strong>가 가능합니다.
              </p>
            </div>
          )}

          {isSearching && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <Loader2 size={32} color="#4f46e5" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
                슈퍼베이스 DB에서 전수 조회 중입니다...
              </p>
            </div>
          )}

          {hasSearched && !isSearching && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#94a3b8'
              }}>
                <Info size={26} />
              </div>
              <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                검색된 고객이 없습니다.
              </h4>
              <p style={{ margin: 0, fontSize: '13px' }}>
                입력하신 검색어(<strong>"{keyword}"</strong>)와 일치하는 고객이 전체 DB에 존재하지 않습니다.<br />
                외국인등록번호, 전화번호 뒷자리, 또는 영문 스펠링을 다시 한 번 확인해 주세요.
              </p>
            </div>
          )}

          {hasSearched && !isSearching && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>검색 결과: <strong style={{ color: '#4f46e5' }}>{results.length}건</strong> 발견</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>* 번호순 또는 매칭도 순 정렬</span>
              </div>

              {results.map(item => {
                const isClaiming = claimingSerial === item.serial;
                const canClaim = !isSuperAdmin && item.visibilityReason !== 'VISIBLE';

                return (
                  <div
                    key={item.id || item.serial}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '16px',
                      backgroundColor: item.visibilityReason === 'VISIBLE' ? '#ffffff' : '#fcfcfd',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'border-color 0.15s, box-shadow 0.15s'
                    }}
                  >
                    {/* Top Row: Name, Serial, Status Badge */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#0f172a'
                        }}>
                          {item.name}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: '#64748b',
                          backgroundColor: '#f1f5f9',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: '500'
                        }}>
                          #{item.serial}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: '#0284c7',
                          backgroundColor: '#e0f2fe',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          {item.paybackProgress}
                        </span>
                      </div>
                      <div>
                        {renderBadge(item.visibilityReason, item.managerName)}
                      </div>
                    </div>

                    {/* Visibility Reason Box */}
                    <div style={{
                      backgroundColor: item.visibilityReason === 'VISIBLE' ? '#f0fdf4' : (item.visibilityReason === 'COMPLETED_TAB' ? '#f0f9ff' : '#fffbeb'),
                      border: `1px solid ${item.visibilityReason === 'VISIBLE' ? '#bbf7d0' : (item.visibilityReason === 'COMPLETED_TAB' ? '#bae6fd' : '#fde68a')}`,
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '12.5px',
                      color: item.visibilityReason === 'VISIBLE' ? '#166534' : (item.visibilityReason === 'COMPLETED_TAB' ? '#075985' : '#92400e'),
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Info size={15} style={{ flexShrink: 0 }} />
                      <span>{item.visibilityMessage}</span>
                    </div>

                    {/* Details Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '8px',
                      fontSize: '12.5px',
                      color: '#475569',
                      marginBottom: '12px',
                      backgroundColor: '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: '6px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Globe2 size={14} color="#64748b" />
                        <span>국적/팀: <strong>{item.country} ({item.teamName || '팀미정'})</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} color="#64748b" />
                        <span>연락처: <strong>{item.phone}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="#64748b" />
                        <span>생년월일/외국인번호: <strong>{item.regNum}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={14} color="#64748b" />
                        <span>근무처/비자: <strong>{item.company} ({item.visa})</strong></span>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        현재 담당자: <strong style={{ color: '#1e293b' }}>{item.managerName}</strong>
                      </span>

                      {canClaim && (
                        <button
                          onClick={() => handleClaimCustomer(item)}
                          disabled={isClaiming}
                          style={{
                            backgroundColor: '#4f46e5',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            cursor: isClaiming ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                          }}
                        >
                          {isClaiming ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              배정 처리 중...
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} />
                              내 담당으로 가져오기
                              <ArrowRight size={13} />
                            </>
                          )}
                        </button>
                      )}

                      {isSuperAdmin && (
                        <button
                          onClick={() => handleClaimCustomer(item)}
                          disabled={isClaiming}
                          style={{
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            cursor: isClaiming ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <UserCheck size={14} />
                          {currentManagerName} 담당으로 배정
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            💡 <strong>TIP:</strong> 완료된 환급건은 상단 탭에서 <strong>[전체]</strong> 또는 <strong>[수수료입금완료]</strong>를 누르시면 조회됩니다.
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              backgroundColor: '#e2e8f0',
              color: '#334155',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
