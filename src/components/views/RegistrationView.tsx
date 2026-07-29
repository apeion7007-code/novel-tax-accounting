import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CustomerBasicInfoForm } from './CustomerBasicInfoForm';
import { DependentsDeductionPanel } from './DependentsDeductionPanel';
import { SmeVerification } from '../SmeVerification';
import { WageSettlementTable } from '../WageSettlementTable';
import { FreelancerSettlementTable } from '../FreelancerSettlementTable';
import { CombinedSummaryTable } from '../CombinedSummaryTable';
import { CustomerConsultationForm } from './CustomerConsultationForm';

interface RegistrationViewProps {
  regForm: any;
  setRegForm: React.Dispatch<React.SetStateAction<any>>;
  selectedFeeRate: number;
  invoiceLanguage: string;
  setInvoiceLanguage: React.Dispatch<React.SetStateAction<string>>;
  nationalities: string[];
  visaTypes: string[];
  bankList: string[];
  refundStatuses: string[];
  submissionStatuses: string[];
  dbManagers: any[];
  availableManagerList: string[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  setCurrentView: (view: any) => void;
  handleResetAll: () => void;
  handleSaveRegistration: () => Promise<void>;
  updateDependentsCount: (key: any, delta: number) => void;
  
  // PDF Handlers
  handleSingleYearPdfUpload: (e: React.ChangeEvent<HTMLInputElement>, targetId?: string) => Promise<void>;
  handleFreelancerSingleYearPdfUpload: (e: React.ChangeEvent<HTMLInputElement>, fallbackYr?: string) => Promise<void>;
  handleBulkPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleReanalyzeYearPdf: (targetId: string, yrLabel: string) => Promise<void>;
  handleDownloadPdf: (fileUrl: string, fileName: string) => Promise<void>;
  
  // Excel Generation Handlers
  triggerExcelDownload: () => Promise<void>;
  triggerConsolidatedExcelDownload: () => Promise<void>;
  triggerKoreanInvoiceDownload: () => Promise<void>;
  
  // Rent / Dependent file handlers
  onChangeRentInfo: (key: string, value: any) => void;
  onChangeRentFile: (year: string, file: File | null) => void;
  
  // Consultation Log properties
  consultMemos: any[];
  setConsultMemos: React.Dispatch<React.SetStateAction<any[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  handleSaveConsultInfo: () => Promise<void>;

  // Dependent Lists
  targetYears: string[];
  handleAddYear: () => void;
  handleRemoveYear: (idToRemove: string, yearLabel: string) => void;
  handleFeeRateChange: (rate: number) => void;
  handleRemoveFreelancerYear: (year: string) => void;
  getCombinedRefund: (yrData: any) => any;

  // Youth Age Info
  youthTaxReductionInfo: any;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  regForm,
  setRegForm,
  selectedFeeRate,
  invoiceLanguage,
  setInvoiceLanguage,
  nationalities,
  visaTypes,
  bankList,
  refundStatuses,
  submissionStatuses,
  dbManagers,
  availableManagerList,
  showToast,
  setCurrentView,
  handleResetAll,
  handleSaveRegistration,
  updateDependentsCount,
  handleSingleYearPdfUpload,
  handleFreelancerSingleYearPdfUpload,
  handleBulkPdfUpload,
  handleReanalyzeYearPdf,
  handleDownloadPdf,
  triggerExcelDownload,
  triggerConsolidatedExcelDownload,
  triggerKoreanInvoiceDownload,
  onChangeRentInfo,
  onChangeRentFile,
  consultMemos,
  setConsultMemos,
  setCustomers,
  handleSaveConsultInfo,
  targetYears,
  handleAddYear,
  handleRemoveYear,
  handleFeeRateChange,
  handleRemoveFreelancerYear,
  getCombinedRefund,
  youthTaxReductionInfo
}) => {
  // Modal Local States
  const [isManagerModalOpen, setIsManagerModalOpen] = useState<boolean>(false);
  const [tempModalTeam, setTempModalTeam] = useState<string>('');
  const [tempModalManager, setTempModalManager] = useState<string>('');
  const [smeModalOpen, setSmeModalOpen] = useState<boolean>(false);
  const [consolidatedModalOpen, setConsolidatedModalOpen] = useState<boolean>(false);

  const handleApplyManagerChange = () => {
    setRegForm((prev: any) => ({
      ...prev,
      nationality: tempModalTeam,
      managerName: tempModalManager
    }));
    setIsManagerModalOpen(false);
    showToast(`담당 정보가 ${tempModalTeam}팀 ${tempModalManager} 매니저로 변경되었습니다.`, 'success');
  };

  const handleDownloadSmeSpecification = () => {
    if (!regForm.name) {
      showToast('고객을 먼저 로드하거나 등록해 주세요.', 'error');
      return;
    }
    setSmeModalOpen(true);
  };

  const handleDownloadConsolidatedSpecification = () => {
    if (!regForm.name) {
      showToast('고객을 먼저 로드하거나 등록해 주세요.', 'error');
      return;
    }
    setConsolidatedModalOpen(true);
  };

  return (
    <div className="view-container" style={{ backgroundColor: '#ffffff', padding: '20px' }}>
      {/* Registration Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', margin: 0 }}>
            고객등록 관리
            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#ef4444' }}>고객정보 및 근로소득 원천징수영수증을 등록, 관리하고 환급 가능한 세액을 계산합니다.</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span 
              onClick={() => {
                setTempModalTeam(regForm.nationality || '미얀마');
                setTempModalManager(regForm.managerName || 'Boram');
                setIsManagerModalOpen(true);
              }}
              title="클릭하여 담당 팀 및 매니저 변경"
              style={{ 
                backgroundColor: '#2563eb', 
                color: '#ffffff', 
                padding: '3px 10px', 
                borderRadius: '4px', 
                fontSize: '13px', 
                fontWeight: 'bold', 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(37,99,235,0.3)',
                userSelect: 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              {regForm.nationality || '미얀마'}팀 {regForm.managerName || 'Boram'}
              <span style={{ fontSize: '11px', opacity: 0.9 }}>✏️</span>
            </span>

            {isManagerModalOpen && (
              <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' }} onClick={() => setIsManagerModalOpen(false)}>
                <div className="modal-content" style={{ width: '380px', borderRadius: '12px', padding: '24px', backgroundColor: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>👥</span> 담당 팀 및 매니저 변경
                    </h3>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }} onClick={() => setIsManagerModalOpen(false)}><X size={20} /></button>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>담당 팀 (국적)</label>
                    <select 
                      className="form-control" 
                      style={{ width: '100%', height: '38px', fontSize: '14px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px' }} 
                      value={tempModalTeam} 
                      onChange={(e) => setTempModalTeam(e.target.value)}
                    >
                      {nationalities.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>담당 매니저</label>
                    <select 
                      className="form-control" 
                      style={{ width: '100%', height: '38px', fontSize: '14px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px' }} 
                      value={tempModalManager} 
                      onChange={(e) => setTempModalManager(e.target.value)}
                    >
                      {availableManagerList.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button className="btn-cancel" style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setIsManagerModalOpen(false)}>취소</button>
                    <button className="btn-submit" style={{ padding: '8px 20px', fontSize: '13px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleApplyManagerChange}>변경 적용</button>
                  </div>
                </div>
              </div>
            )}
            <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>|</span>
            <span style={{ backgroundColor: '#1e293b', color: '#ffffff', padding: '3px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', display: 'inline-block' }}>
              최종업데이트 : {(() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth() + 1;
                const date = now.getDate();
                let hours = now.getHours();
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const ampm = hours >= 12 ? '오후' : '오전';
                hours = hours % 12;
                hours = hours ? hours : 12;
                return `${year}년 ${month}월 ${date}일 ${ampm} ${hours}:${minutes}`;
              })()}
            </span>
          </div>
        </div>
        
        {/* Real-time Youth Tax Reduction Age Calculator */}
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '2px solid #22c55e',
          borderRadius: '8px',
          padding: '8px 16px',
          marginLeft: 'auto',
          marginRight: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          minWidth: '380px',
          minHeight: '52px'
        }}>
          {youthTaxReductionInfo.hasEmpDate ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>
                📅 취업일 기준 청년 감면 대상 범위
              </div>
              <div style={{ fontSize: '13px', color: '#14532d', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {youthTaxReductionInfo.eligibleBirthRangeStr}
              </div>
              {youthTaxReductionInfo.hasRrn ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  marginTop: '2px', 
                  fontSize: '12px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: youthTaxReductionInfo.isEligible ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${youthTaxReductionInfo.isEligible ? '#10b981' : '#f87171'}`,
                  color: youthTaxReductionInfo.isEligible ? '#065f46' : '#991b1b',
                  fontWeight: 'bold'
                }}>
                  {youthTaxReductionInfo.isEligible ? '✅ 청년 소득세 감면: 적용 가능' : '❌ 청년 소득세 감면: 대상 아님'}
                  <span style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.9 }}>
                    (취업 당시 만 {youthTaxReductionInfo.ageAtEmployment}세)
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
                  ✍️ 등록번호 입력 시 대상 여부를 실시간 판정합니다.
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: '12px', color: '#166534', fontWeight: '500', textAlign: 'center' }}>
              💡 <b>취업일</b>과 <b>외국인 등록번호</b>를 입력하면<br/>
              청년 감면 대상 여부가 실시간 계산됩니다.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setRegForm((prev: any) => ({ ...prev, isNextYearApply: !prev.isNextYearApply }))}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              backgroundColor: regForm.isNextYearApply ? '#eab308' : '#ffffff',
              color: regForm.isNextYearApply ? '#ffffff' : '#475569',
              border: regForm.isNextYearApply ? '1px solid #ca8a04' : '1px solid #cbd5e1',
              fontWeight: 'bold',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: regForm.isNextYearApply ? '0 2px 6px rgba(234,179,8,0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{regForm.isNextYearApply ? `⭐ ${new Date().getFullYear() + 1}년 접수대상 (지정됨)` : `☆ ${new Date().getFullYear() + 1}년 접수대상 지정`}</span>
          </button>
          <button className="btn-cancel" style={{ padding: '6px 14px', fontSize: '13px', backgroundColor: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }} onClick={handleResetAll}>전체 초기화</button>
          <button className="btn-submit" style={{ padding: '6px 16px', fontSize: '13px', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }} onClick={handleSaveRegistration}>{regForm.serial && regForm.serial > 0 ? '고객 업데이트' : '신규저장'}</button>
          <button className="btn-cancel" style={{ padding: '6px 14px', fontSize: '13px', backgroundColor: '#ef4444', color: 'white', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setCurrentView('customer')}>삭제</button>
          <button className="btn-cancel" style={{ padding: '6px 14px', fontSize: '13px', backgroundColor: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setCurrentView('customer')}>목록</button>
        </div>
      </div>

      {/* Form Group 1: Basic Information Input Grid */}
      <CustomerBasicInfoForm
        regForm={regForm}
        setRegForm={setRegForm}
        nationalities={nationalities}
        visaTypes={visaTypes}
        bankList={bankList}
        refundStatuses={refundStatuses}
        submissionStatuses={submissionStatuses}
        onChangeRentInfo={onChangeRentInfo}
        onChangeRentFile={onChangeRentFile}
      />

      {/* Dependents & Additional Deductions Setting Panel */}
      <DependentsDeductionPanel
        regForm={regForm}
        setRegForm={setRegForm}
        updateDependentsCount={updateDependentsCount}
        showToast={showToast}
      />

      {/* 중소기업 판별기 영역 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', marginBottom: '14px' }}>
        <SmeVerification years={regForm.years} />
      </div>

      {/* Yearly Detailed Calculation Grid */}
      <WageSettlementTable
        regForm={regForm}
        setRegForm={setRegForm}
        selectedFeeRate={selectedFeeRate}
        handleSingleYearPdfUpload={handleSingleYearPdfUpload}
        handleBulkPdfUpload={handleBulkPdfUpload}
        handleReanalyzeYearPdf={handleReanalyzeYearPdf}
        handleDownloadPdf={handleDownloadPdf}
        handleAddYear={handleAddYear}
        handleRemoveYear={handleRemoveYear}
        handleFeeRateChange={handleFeeRateChange}
      />

      {/* 3.3% Freelancer Business Income Settlement Table */}
      <FreelancerSettlementTable
        regForm={regForm}
        setRegForm={setRegForm}
        targetYears={targetYears}
        selectedFeeRate={selectedFeeRate}
        handleFreelancerSingleYearPdfUpload={handleFreelancerSingleYearPdfUpload}
        handleBulkPdfUpload={handleBulkPdfUpload}
        handleFeeRateChange={handleFeeRateChange}
        handleRemoveFreelancerYear={handleRemoveFreelancerYear}
      />

      {/* Combined Summary Table */}
      <CombinedSummaryTable
        regForm={regForm}
        targetYears={targetYears}
        selectedFeeRate={selectedFeeRate}
        handleFeeRateChange={handleFeeRateChange}
        getCombinedRefund={getCombinedRefund}
      />

      {/* Excel Download Buttons (Single SME & Consolidated) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', marginBottom: '8px' }}>
        <button
          type="button"
          onClick={handleDownloadSmeSpecification}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#ffffff',
            backgroundColor: '#10b981',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#059669'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(5, 150, 105, 0.35)'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#10b981'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.25)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          📄 중소기업 감면명세서 다운로드 (Excel)
        </button>

        <button
          type="button"
          onClick={handleDownloadConsolidatedSpecification}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#ffffff',
            backgroundColor: '#0d9488',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(13, 148, 136, 0.25)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#0f766e'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(15, 118, 110, 0.35)'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(13, 148, 136, 0.25)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          📄 통합 경정청구(사업소득,월세,부양가족 포함) 명세서 다운로드 (Excel)
        </button>
      </div>

      {/* Bottom Row: Customer consultation form & log memos */}
      <CustomerConsultationForm
        regForm={regForm}
        setRegForm={setRegForm}
        consultMemos={consultMemos}
        setConsultMemos={setConsultMemos}
        dbManagers={dbManagers}
        showToast={showToast}
        handleSaveConsultInfo={handleSaveConsultInfo}
        setCustomers={setCustomers}
        selectedFeeRate={selectedFeeRate}
        invoiceLanguage={invoiceLanguage}
        setInvoiceLanguage={setInvoiceLanguage}
        triggerKoreanInvoiceDownload={triggerKoreanInvoiceDownload}
      />

      {/* SME Modal */}
      {smeModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '450px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid #cbd5e1'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
              📄 감면명세서 추가 정보 입력
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
              원천징수의무자(회사)의 세부 정보를 입력하세요. 이 정보는 브라우저에 자동 저장되어 다음 출력 시 자동으로 불러옵니다.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>회사 주소</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '36px', fontSize: '13px' }}
                  value={regForm.companyAddress}
                  onChange={(e) => setRegForm((prev: any) => ({ ...prev, companyAddress: e.target.value }))}
                  placeholder="예: 충청북도 음성군 금왕읍 대금로..."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>회사 전화번호</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '36px', fontSize: '13px' }}
                  value={regForm.companyPhone}
                  onChange={(e) => setRegForm((prev: any) => ({ ...prev, companyPhone: e.target.value }))}
                  placeholder="예: 010-3285-0337"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>주업종코드</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '36px', fontSize: '13px' }}
                  value={regForm.companyIndustry}
                  onChange={(e) => setRegForm((prev: any) => ({ ...prev, companyIndustry: e.target.value }))}
                  placeholder="예: 172902"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn-cancel"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setSmeModalOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn-submit"
                style={{ padding: '8px 18px', fontSize: '13px', backgroundColor: '#10b981' }}
                onClick={async () => {
                  await triggerExcelDownload();
                  setSmeModalOpen(false);
                }}
              >
                엑셀 다운로드
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consolidated Modal */}
      {consolidatedModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '450px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid #cbd5e1'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
              📄 통합 경정청구 명세서 정보 입력
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
              통합 경정청구 세무서식 파일(경정청구서, 중소기업 감면, 월세액 공제)을 작성하기 위해 필요한 회사 기본 정보를 입력해 주세요.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>회사 주소</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '36px', fontSize: '13px' }}
                  value={regForm.companyAddress}
                  onChange={(e) => setRegForm((prev: any) => ({ ...prev, companyAddress: e.target.value }))}
                  placeholder="예: 충청북도 음성군 금왕읍 대금로..."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>회사 전화번호</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '36px', fontSize: '13px' }}
                  value={regForm.companyPhone}
                  onChange={(e) => setRegForm((prev: any) => ({ ...prev, companyPhone: e.target.value }))}
                  placeholder="예: 010-3285-0337"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>주업종코드</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: '36px', fontSize: '13px' }}
                  value={regForm.companyIndustry}
                  onChange={(e) => setRegForm((prev: any) => ({ ...prev, companyIndustry: e.target.value }))}
                  placeholder="예: 172902"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn-cancel"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setConsolidatedModalOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn-submit"
                style={{ padding: '8px 18px', fontSize: '13px', backgroundColor: '#10b981' }}
                onClick={async () => {
                  await triggerConsolidatedExcelDownload();
                  setConsolidatedModalOpen(false);
                }}
              >
                통합 엑셀 다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
