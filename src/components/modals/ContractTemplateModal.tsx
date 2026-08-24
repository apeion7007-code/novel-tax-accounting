import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  RotateCcw,
  Download,
  Upload,
  Printer,
  Edit3,
  Eye,
  FileText
} from 'lucide-react';
import {
  getStoredContractTranslations,
  saveContractTranslationsAsync,
  fetchContractTranslationsFromSupabase,
  resetContractTranslations,
  CONTRACT_LANG_CODES,
  DEFAULT_CONTRACT_TRANSLATIONS
} from '../../utils/contractTemplateStorage';
import { A4ContractDocument, type ContractData } from '../A4ContractDocument';

interface ContractTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLanguage?: string;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  clientData?: {
    name?: string;
    nationality?: string;
    regNum?: string;
    companyName?: string;
    visa?: string;
    totalRefund?: number;
    feeRate?: number;
  };
}

export const ContractTemplateModal: React.FC<ContractTemplateModalProps> = ({
  isOpen,
  onClose,
  initialLanguage = '한국어',
  showToast,
  clientData
}) => {
  if (!isOpen) return null;

  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>(getStoredContractTranslations);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLanguage || '한국어');
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Sync latest from Supabase on mount
  useEffect(() => {
    fetchContractTranslationsFromSupabase().then((latest) => {
      setTranslations(latest);
    });
  }, []);

  const sampleClient: ContractData = {
    name: clientData?.name || 'HOSEN LOKMAN',
    country: clientData?.nationality || '방글라데시',
    regNum: clientData?.regNum || '940202-5880054',
    company: clientData?.companyName || '(주)노벨산업',
    visa: clientData?.visa || 'E-9',
    totalRefund: clientData?.totalRefund || 2450000,
    feeRate: clientData?.feeRate || 22,
    prepaidRate: 0,
    postpaidRate: clientData?.feeRate || 22,
    signedDate: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  };

  const currentTranslation = translations[selectedLanguage] || DEFAULT_CONTRACT_TRANSLATIONS[selectedLanguage] || DEFAULT_CONTRACT_TRANSLATIONS['한국어'];

  const handleFieldChange = (key: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [selectedLanguage]: {
        ...(prev[selectedLanguage] || {}),
        [key]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveContractTranslationsAsync(translations);
      setIsSaving(false);
      if (res.success) {
        setHasUnsavedChanges(false);
        if (res.cloudSuccess) {
          showToast(`[${selectedLanguage}] 표준 계약서 템플릿이 슈퍼베이스 클라우드 및 로컬에 안전하게 저장되었습니다!`, 'success');
        } else {
          showToast(`[${selectedLanguage}] 로컬에 저장되었습니다. (클라우드 동기화 중)`, 'info');
        }
      } else {
        showToast('계약서 저장에 실패했습니다. 다시 시도해 주세요.', 'error');
      }
    } catch (err) {
      setIsSaving(false);
      showToast('저장 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleReset = async () => {
    if (window.confirm(`'${selectedLanguage}' 표준 계약서 문구를 초기 기본값으로 되돌리시겠습니까?`)) {
      setIsSaving(true);
      const updated = await resetContractTranslations(selectedLanguage);
      setTranslations(updated);
      setHasUnsavedChanges(false);
      setIsSaving(false);
      showToast(`'${selectedLanguage}' 문구가 기본값으로 복원되었습니다.`, 'info');
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(translations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `novel_contract_templates_14languages_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('14개국어 계약서 번역 파일이 다운로드되었습니다.', 'success');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === 'object') {
          saveContractTranslationsAsync(parsed);
          setTranslations(parsed);
          setHasUnsavedChanges(false);
          showToast('14개국어 계약서 번역 파일이 정상적으로 적용되었습니다!', 'success');
        }
      } catch (err) {
        showToast('올바르지 않은 JSON 파일 형식입니다.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        backdropFilter: 'blur(4px)',
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (hasUnsavedChanges) {
            if (window.confirm('저장하지 않은 변경사항이 있습니다. 닫으시겠습니까?')) {
              onClose();
            }
          } else {
            onClose();
          }
        }
      }}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '920px',
          height: '92vh',
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #cbd5e1'
        }}
      >
        {/* Modal Top Sticky Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#38bdf8', color: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
              <FileText size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>
                표준 계약서 양식 수정 및 편집 (A4 규격 2페이지)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
                A4 화면의 파란색 텍스트 상자를 직접 클릭하여 글자를 수정하세요.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Mode Switch Toggle */}
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                backgroundColor: isEditMode ? '#38bdf8' : 'rgba(255,255,255,0.15)',
                color: isEditMode ? '#0f172a' : '#ffffff',
                cursor: 'pointer'
              }}
            >
              {isEditMode ? <Edit3 size={14} /> : <Eye size={14} />}
              {isEditMode ? '직접 수정 모드' : '미리보기 모드'}
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <Printer size={14} />
              A4 인쇄/PDF
            </button>

            {/* Close [X] Button */}
            <button
              type="button"
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (window.confirm('저장하지 않은 변경사항이 있습니다. 닫으시겠습니까?')) {
                    onClose();
                  }
                } else {
                  onClose();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={16} />
              닫기
            </button>
          </div>
        </div>

        {/* 14 Language Tabs Bar */}
        <div style={{ backgroundColor: '#ffffff', padding: '10px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#64748b', whiteSpace: 'nowrap', marginRight: '6px' }}>
            언어 선택:
          </span>
          {Object.keys(DEFAULT_CONTRACT_TRANSLATIONS).map((lang) => {
            const isSelected = selectedLanguage === lang;
            const langCode = CONTRACT_LANG_CODES[lang] || lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLanguage(lang)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: isSelected ? '800' : '600',
                  border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                  color: isSelected ? '#1d4ed8' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{ fontSize: '9.5px', backgroundColor: isSelected ? '#2563eb' : '#e2e8f0', color: isSelected ? '#ffffff' : '#475569', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold' }}>
                  {langCode}
                </span>
                <span>{lang}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Body with Live A4 Page */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {isEditMode && (
            <div style={{ width: '100%', maxWidth: '794px', marginBottom: '16px', padding: '10px 16px', backgroundColor: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#0369a1' }}>
              <span>💡</span>
              <span><strong>수정 방법:</strong> 아래 A4 용지 안의 파란색 입력 상자를 클릭하여 글자를 타이핑해 수정하세요. 수정 후 하단 <strong>[💾 저장하기]</strong>를 누르면 실제 고객 계약서 링크에 1초 만에 자동 반영됩니다.</span>
            </div>
          )}

          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <A4ContractDocument
              language={selectedLanguage}
              translations={currentTranslation}
              onLanguageChange={setSelectedLanguage}
              contractData={sampleClient}
              isEditable={isEditMode}
              onTranslationChange={handleFieldChange}
              showLanguageSelector={false}
              showSignaturePad={false}
            />
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: '#ffffff',
                border: '1px solid #fecaca',
                color: '#dc2626',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} />
              기본값 복원
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              <Download size={13} />
              JSON 내보내기
            </button>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              <Upload size={13} />
              JSON 불러오기
              <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (window.confirm('저장하지 않은 변경사항이 있습니다. 닫으시겠습니까?')) {
                    onClose();
                  }
                } else {
                  onClose();
                }
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              닫기
            </button>
            
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 22px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '800',
                backgroundColor: hasUnsavedChanges ? '#2563eb' : '#0f172a',
                color: '#ffffff',
                border: 'none',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow: hasUnsavedChanges ? '0 4px 12px rgba(37,99,235,0.3)' : 'none'
              }}
            >
              <Save size={15} />
              {isSaving ? '저장 중...' : hasUnsavedChanges ? '💾 변경사항 저장하기 *' : '저장 완료'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
