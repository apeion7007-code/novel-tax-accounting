import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  Download,
  Upload,
  Printer,
  Edit3,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  getStoredContractTranslations,
  saveContractTranslations,
  resetContractTranslations,
  CONTRACT_LANG_CODES,
  DEFAULT_CONTRACT_TRANSLATIONS
} from '../../utils/contractTemplateStorage';
import { A4ContractDocument, type ContractData } from '../A4ContractDocument';

interface ContractTemplateManagerViewProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ContractTemplateManagerView: React.FC<ContractTemplateManagerViewProps> = ({ showToast }) => {
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>(getStoredContractTranslations);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('한국어');
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Sample dummy contract data for previewing how real numbers/names look
  const [sampleClient, setSampleClient] = useState<ContractData>({
    name: 'HOSEN LOKMAN',
    country: '방글라데시',
    regNum: '940202-5880054',
    company: '(주)노벨산업',
    visa: 'E-9',
    totalRefund: 2450000,
    feeRate: 22,
    prepaidRate: 0,
    postpaidRate: 22,
    signedDate: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  });

  const currentTranslation = translations[selectedLanguage] || DEFAULT_CONTRACT_TRANSLATIONS[selectedLanguage] || DEFAULT_CONTRACT_TRANSLATIONS['한국어'];

  // Handle live translation change in A4 document
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

  // Save all custom translations
  const handleSave = () => {
    setIsSaving(true);
    const success = saveContractTranslations(translations);
    setTimeout(() => {
      setIsSaving(false);
      if (success) {
        setHasUnsavedChanges(false);
        showToast(`[${selectedLanguage}] 표준 계약서 템플릿이 성공적으로 저장되었습니다!`, 'success');
      } else {
        showToast('계약서 저장에 실패했습니다. 다시 시도해 주세요.', 'error');
      }
    }, 300);
  };

  // Reset to original template
  const handleReset = () => {
    if (window.confirm(`'${selectedLanguage}' 표준 계약서 문구를 초기 기본값으로 되돌리시겠습니까?`)) {
      const updated = resetContractTranslations(selectedLanguage);
      setTranslations(updated);
      setHasUnsavedChanges(false);
      showToast(`'${selectedLanguage}' 문구가 기본값으로 복원되었습니다.`, 'info');
    }
  };

  // Export JSON file
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

  // Import JSON file
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === 'object') {
          saveContractTranslations(parsed);
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

  // Print / PDF preview
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f1f5f9', minHeight: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Header & Title Bar */}
      <div className="no-print" style={{ backgroundColor: '#ffffff', padding: '18px 24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <FileText size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  표준 계약서 양식 관리 (A4 규격 2페이지)
                </h1>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                  A4 앞면(1~5조 본문)과 뒷면(서명란)의 14개국어 문구를 화면에서 직접 클릭하여 워드처럼 수정하고 즉시 저장할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            
            {/* Mode Switch Toggle */}
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '700',
                border: isEditMode ? '1px solid #2563eb' : '1px solid #cbd5e1',
                backgroundColor: isEditMode ? '#eff6ff' : '#ffffff',
                color: isEditMode ? '#2563eb' : '#475569',
                cursor: 'pointer'
              }}
            >
              {isEditMode ? <Edit3 size={15} /> : <Eye size={15} />}
              {isEditMode ? 'A4 직접 수정 모드 ON' : '미리보기 모드'}
            </button>

            {/* Save Button */}
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '800',
                backgroundColor: hasUnsavedChanges ? '#2563eb' : '#0f172a',
                color: '#ffffff',
                border: 'none',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow: hasUnsavedChanges ? '0 4px 10px rgba(37,99,235,0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Save size={15} />
              {isSaving ? '저장 중...' : hasUnsavedChanges ? '💾 변경사항 저장하기 *' : '저장 완료'}
            </button>

            {/* Print / PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <Printer size={15} />
              A4 인쇄 / PDF
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: '#ffffff',
                border: '1px solid #fecaca',
                color: '#dc2626',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={15} />
              기본값 복원
            </button>

            {/* JSON Export */}
            <button
              type="button"
              onClick={handleExportJson}
              title="14개국어 번역 파일 JSON 다운로드"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <Download size={15} />
              JSON 내보내기
            </button>

            {/* JSON Import */}
            <label
              title="14개국어 번역 파일 JSON 불러오기"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <Upload size={15} />
              JSON 불러오기
              <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
            </label>

          </div>
        </div>

        {/* 14 Language Tabs Bar */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🌐 편집할 국가 언어 선택 (총 14개국어):</span>
            {hasUnsavedChanges && (
              <span style={{ color: '#d97706', fontSize: '11px', fontWeight: '600' }}>
                ⚠️ 현재 수정 중인 내용이 있습니다. 상단 [저장하기]를 눌러 반영하세요.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: isSelected ? '800' : '600',
                    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    color: isSelected ? '#1d4ed8' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '10px', backgroundColor: isSelected ? '#2563eb' : '#e2e8f0', color: isSelected ? '#ffffff' : '#475569', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                    {langCode}
                  </span>
                  <span>{lang}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Notice Banner */}
      {isEditMode && (
        <div className="no-print" style={{ maxWidth: '794px', margin: '0 auto 16px auto', padding: '10px 16px', backgroundColor: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#0369a1' }}>
          <span>💡</span>
          <span><strong>직접 수정 안내:</strong> 아래 A4 용지 안의 파란색 텍스트 상자를 클릭하여 글자를 직접 타이핑해 수정하세요. 수정 후 상단 <strong>[저장하기]</strong>를 누르면 고객용 실제 계약서 링크에 1초 만에 자동 반영됩니다.</span>
        </div>
      )}

      {/* Live A4 Contract Document Preview & Editor */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <A4ContractDocument
          language={selectedLanguage}
          translations={currentTranslation}
          onLanguageChange={setSelectedLanguage}
          contractData={sampleClient}
          isEditable={isEditMode}
          onTranslationChange={handleFieldChange}
          showLanguageSelector={true}
          showSignaturePad={false}
        />
      </div>

    </div>
  );
};
