import React, { useState, useEffect } from 'react';

interface ConsultMemoEditModalProps {
  isOpen: boolean;
  memoId: number | null;
  initialContent: string;
  createdAtStr: string;
  managerName: string;
  onClose: () => void;
  onSave: (memoId: number, updatedContent: string) => Promise<void>;
}

export const ConsultMemoEditModal: React.FC<ConsultMemoEditModalProps> = ({
  isOpen,
  memoId,
  initialContent,
  createdAtStr,
  managerName,
  onClose,
  onSave
}) => {
  const [content, setContent] = useState<string>(initialContent);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent, isOpen]);

  if (!isOpen || memoId === null) return null;

  const handleSave = async () => {
    if (!content.trim()) {
      alert('상담 메모 내용을 입력해 주세요.');
      return;
    }
    try {
      setIsSaving(true);
      await onSave(memoId, content.trim());
      onClose();
    } catch (err) {
      // Error notification handled by onSave
    } finally {
      setIsSaving(false);
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          width: '520px',
          maxWidth: '100%',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{
            backgroundColor: '#1e293b',
            color: '#ffffff',
            padding: '14px 18px',
            fontSize: '15px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✏️</span>
            <span>상담 메모 수정</span>
          </span>
          <button 
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px' }}>
            <span>• <strong>작성일시:</strong> {createdAtStr}</span>
            <span>• <strong>작성 매니저:</strong> {managerName}</span>
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '6px' }}>
              상담 메모 내용
            </label>
            <textarea
              rows={7}
              className="form-control"
              style={{
                width: '100%',
                fontSize: '13px',
                padding: '10px 12px',
                lineHeight: '1.5',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="수정할 상담 메모 내용을 입력하세요..."
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div 
          style={{
            padding: '12px 18px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px'
          }}
        >
          <button 
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: '7px 16px',
              fontSize: '13px',
              backgroundColor: '#ffffff',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            취소
          </button>
          <button 
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '7px 18px',
              fontSize: '13px',
              backgroundColor: isSaving ? '#93c5fd' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{isSaving ? '⏳' : '💾'}</span>
            <span>{isSaving ? '저장 중...' : '수정 내용 저장'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
