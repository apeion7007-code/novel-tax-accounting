import React, { useState } from 'react';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { bulkUpdateConsentStatusByRegNums } from '../../utils/supabaseClient';
import { X, FileSpreadsheet, Upload } from 'lucide-react';

interface HometaxExcelSyncModalProps {
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onSyncCompleted: () => void;
}

export function HometaxExcelSyncModal({ onClose, showToast, onSyncCompleted }: HometaxExcelSyncModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  const parseAndSyncExcel = async (file: File) => {
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        throw new Error('시트 정보를 찾을 수 없습니다.');
      }

      const regNums: string[] = [];

      worksheet.eachRow((row: any) => {
        // Hometax suim list has headers. We scan cells for 13-digit identification numbers
        row.eachCell((cell: any) => {
          const value = String(cell.value || '').trim();
          // Cleanup all non-numeric characters to check for 13-digit registration pattern
          const cleaned = value.replace(/[^0-9]/g, '');
          // In Korea, resident/foreign registration numbers are exactly 13 digits
          if (cleaned.length === 13) {
            regNums.push(value);
          }
        });
      });

      // Filter duplicates
      const uniqueRegNums = Array.from(new Set(regNums));

      if (uniqueRegNums.length === 0) {
        showToast('엑셀 파일에서 13자리 주민/외국인 등록번호를 찾지 못했습니다.', 'error');
        setLoading(false);
        return;
      }

      showToast(`총 ${uniqueRegNums.length}개의 등록번호를 감지했습니다. 데이터 동기화 중...`, 'info');

      const res = await bulkUpdateConsentStatusByRegNums(uniqueRegNums);

      if (res.success) {
        showToast(`홈택스 수임 상태 동기화 완료! 총 ${res.count}명의 수임 완료 처리되었습니다.`, 'success');
        onSyncCompleted();
        onClose();
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      console.error(e);
      showToast(`엑셀 처리 중 오류 발생: ${e.message || '알 수 없는 오류'}`, 'error');
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      parseAndSyncExcel(file);
    }
  };

  return (
    <div className="modal-backdrop" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(15, 23, 42, 0.6)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      zIndex: 9999, 
      backdropFilter: 'blur(3px)' 
    }} onClick={onClose}>
      <div className="modal-content" style={{ 
        width: '450px', 
        borderRadius: '12px', 
        padding: '24px', 
        backgroundColor: '#ffffff', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', 
        border: '1px solid #cbd5e1' 
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} color="#10b981" /> 국세청 수임 승인 명단 동기화
          </h3>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Instructions */}
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
          국세청 홈택스에서 다운로드한 <strong>[세무대리인 수임동의 완료인 명단] 엑셀 파일</strong>을 등록해 주세요. 
          주민등록번호(외국인번호)를 대조하여 해당하는 모든 고객들을 일괄 <strong>"수임완료"</strong> 상태로 자동 갱신합니다.
        </p>

        {/* Drag and Drop Zone */}
        <label style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '140px', 
          border: '2px dashed #cbd5e1', 
          borderRadius: '8px', 
          backgroundColor: '#f8fafc',
          cursor: loading ? 'not-allowed' : 'pointer',
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          {loading ? (
            <>
              <div style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>동기화 처리 중... 잠시만 기다려 주세요.</div>
            </>
          ) : (
            <>
              <Upload size={32} color="#64748b" style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}>
                {fileName ? fileName : '수임 완료 엑셀 파일 선택'}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>xlsx, xls, csv 파일 지원</span>
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                style={{ display: 'none' }} 
                disabled={loading}
                onChange={handleFileChange}
              />
            </>
          )}
        </label>

        {/* Footer Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
          <button
            type="button"
            className="btn-cancel"
            style={{ padding: '8px 16px', fontSize: '13px' }}
            disabled={loading}
            onClick={onClose}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
