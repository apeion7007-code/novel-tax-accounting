import React, { useRef } from 'react';
import { CONTRACT_LANG_CODES, BANK_DETAILS_MAP } from '../utils/contractTemplateStorage';

/**
 * Dedicated isolated print utility for 2-page A4 Contract
 * Guarantees Sheet 1 on Page 1, Sheet 2 on Page 2, and 0 background UI bleed
 */
export function printA4ContractDocument(targetSelector: string = '.a4-document-container') {
  if (typeof window === 'undefined') return;

  const container = document.querySelector(targetSelector) as HTMLElement | null;
  if (!container) {
    window.print();
    return;
  }

  const sheets = container.querySelectorAll('.a4-page-sheet');
  if (sheets.length === 0) {
    window.print();
    return;
  }

  // Remove existing print iframe if any
  const existingIframe = document.getElementById('novel-contract-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'novel-contract-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  const sheetsHtml = Array.from(sheets).map(s => s.outerHTML).join('');

  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>세무 경정 청구 표준계약서</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
      @page {
        size: A4 portrait;
        margin: 0;
      }
      * {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        font-family: 'Noto Sans KR', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        width: 210mm !important;
      }
      .a4-page-sheet {
        width: 210mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        min-height: 297mm !important;
        padding: 14mm 16mm 12mm 16mm !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        background: #ffffff !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .a4-page-front {
        page-break-after: always !important;
        break-after: page !important;
      }
      .a4-page-back {
        page-break-before: always !important;
        break-before: page !important;
        page-break-after: auto !important;
        break-after: auto !important;
      }
      .no-print {
        display: none !important;
        visibility: hidden !important;
      }
    </style>
  </head>
  <body>
    ${sheetsHtml}
  </body>
</html>`);
  iframeDoc.close();

  // Print once the iframe is loaded and images are rendered
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print iframe error:', e);
      window.print();
    }
  }, 350);
}

export interface ContractData {
  name: string;
  country: string;
  regNum: string;
  company: string;
  visa: string;
  totalRefund: number;
  feeRate: number;
  prepaidRate?: number;
  postpaidRate?: number;
  signatureUrl?: string;
  signedDate?: string;
}

interface A4ContractDocumentProps {
  language: string;
  translations: Record<string, string>;
  onLanguageChange?: (lang: string) => void;
  contractData?: ContractData;
  isEditable?: boolean;
  onTranslationChange?: (key: string, value: string) => void;
  showLanguageSelector?: boolean;
  showSignaturePad?: boolean;
  onSignatureSubmit?: (signatureBase64: string) => void;
  submitting?: boolean;
  isCompleted?: boolean;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  clearCanvas?: () => void;
  startDrawing?: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
  draw?: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
  stopDrawing?: () => void;
}

export const A4ContractDocument: React.FC<A4ContractDocumentProps> = ({
  language,
  translations: t,
  onLanguageChange,
  contractData,
  isEditable = false,
  onTranslationChange,
  showLanguageSelector = true,
  showSignaturePad = true,
  onSignatureSubmit,
  submitting = false,
  isCompleted = false,
  canvasRef,
  clearCanvas,
  startDrawing,
  draw,
  stopDrawing,
}) => {
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeCanvasRef = canvasRef || localCanvasRef;

  const client = contractData || {
    name: 'HOSEN LOKMAN',
    country: '방글라데시',
    regNum: '940202-5880054',
    company: '(주)노벨산업',
    visa: 'E-9',
    totalRefund: 1850000,
    feeRate: 22,
    prepaidRate: 0,
    postpaidRate: 22,
    signatureUrl: '',
    signedDate: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  };

  const totalFeeRate = client.feeRate || 22;
  const prepaidRate = client.prepaidRate || 0;
  const postpaidRate = client.postpaidRate || totalFeeRate;

  // Dynamic fee text calculation
  const getDynamicFeeText = () => {
    if (prepaidRate > 0 && postpaidRate > 0) {
      if (language === '한국어') {
        return '본 경정청구 용역의 대가는 선불 및 성공보수 후불 혼합 방식으로 하며, 신청 시의 선불 수수료와 국세청으로부터 환급(결정)이 확정된 총 환급금액(지방세 포함)에 대한 후불 성공보수를 각각 합산한 금액으로 한다.';
      } else {
        return 'The fee for this service shall be a hybrid of a prepaid fee and a success postpaid fee, calculated as the sum of the prepaid portion and the postpaid success portion based on the final refund amount.';
      }
    } else if (prepaidRate > 0) {
      if (language === '한국어') {
        return '본 경정청구 용역의 대가는 선불 방식으로 하며, 예상 환급금액에 약정 수수료율을 곱하여 산정된 금액을 경정청구 진행 전에 납부하는 것으로 한다.';
      } else {
        return 'The fee for this service shall be paid upfront (prepaid), calculated by multiplying the expected refund amount by the agreed fee rate before the filing process begins.';
      }
    } else {
      return t.feeText1 || '본 경정청구 용역의 대가는 성공보수 후불 방식으로 하며, 국세청으로부터 환급(결정)이 확정된 총 환급금액(지방세 포함)에 약정 수수료율을 곱한 금액으로 한다.';
    }
  };

  const getDynamicPaymentText = () => {
    const bankInfo = BANK_DETAILS_MAP[language] || BANK_DETAILS_MAP['한국어'] || { bank: '• 입금 계좌: 기업은행 540-049052-04-010', depositor: '• 예금주: 한결금융컨설팅' };
    const bankDetails = `\n${bankInfo.bank}\n${bankInfo.depositor}`;

    if (prepaidRate > 0 && postpaidRate > 0) {
      if (language === '한국어') {
        return `의뢰인(갑)은 세무 경정청구 신청 접수 전에 약정된 선불 수수료(${prepaidRate}%)에 해당하는 금액을 송금하고, 국세청 및 지자체로부터 환급금을 본인 계좌로 수령한 날로부터 3영업일 이내에 약정된 후불 수수료(${postpaidRate}%)를 아래 입금 계좌로 송금해야 한다.${bankDetails}`;
      } else {
        return `Party A shall transfer the prepaid portion (${prepaidRate}%) before the claim is filed, and the postpaid portion (${postpaidRate}%) within 3 business days after receiving the tax refund from the authorities, to Party B's designated bank account below.${bankDetails}`;
      }
    } else if (prepaidRate > 0) {
      if (language === '한국어') {
        return `의뢰인(갑)은 세무 경정청구 신청 접수 전에 약정된 선불 수수료(${prepaidRate}%)에 해당하는 금액을 수임인(을)이 지정한 아래 입금 계좌로 송금해야 한다.${bankDetails}`;
      } else {
        return `Party A shall transfer the prepaid fee (${prepaidRate}%) to Party B's designated bank account below before the tax rectification claim is filed.${bankDetails}`;
      }
    } else {
      if (t.paymentText) {
        return t.paymentText;
      }
      const baseText = '갑은 국세청 및 지자체로부터 세금 환급금을 본인 계좌로 수령한 날로부터 3영업일 이내에 을이 지정한 아래 입금 계좌로 수수료를 송금해야 한다.';
      return `${baseText}${bankDetails}`;
    }
  };

  const feeDescription = getDynamicFeeText();
  const paymentClause = getDynamicPaymentText();

  const handleTextChange = (key: string, value: string) => {
    if (isEditable && onTranslationChange) {
      onTranslationChange(key, value);
    }
  };

  const renderEditableText = (
    key: string,
    defaultValue: string,
    options?: {
      isTextarea?: boolean;
      style?: React.CSSProperties;
      className?: string;
      rows?: number;
    }
  ) => {
    const value = t[key] !== undefined ? t[key] : defaultValue;

    if (!isEditable) {
      return (
        <span style={options?.style} className={options?.className}>
          {value}
        </span>
      );
    }

    if (options?.isTextarea) {
      return (
        <textarea
          value={value}
          rows={options?.rows || 3}
          onChange={(e) => handleTextChange(key, e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '12px',
            lineHeight: '1.5',
            fontFamily: 'inherit',
            border: '1px solid #93c5fd',
            borderRadius: '4px',
            backgroundColor: '#eff6ff',
            color: '#1e3a8a',
            resize: 'vertical',
            boxSizing: 'border-box',
            outline: 'none',
            ...options?.style,
          }}
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleTextChange(key, e.target.value)}
        style={{
          width: '100%',
          padding: '4px 6px',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          fontFamily: 'inherit',
          border: '1px solid #93c5fd',
          borderRadius: '4px',
          backgroundColor: '#eff6ff',
          color: '#1e3a8a',
          boxSizing: 'border-box',
          outline: 'none',
          ...options?.style,
        }}
      />
    );
  };

  return (
    <div className="a4-document-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', fontFamily: "'Noto Sans KR', 'Inter', sans-serif" }}>

      {/* 🖨️ Print Stylesheet */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          /* 1. Hide entire background page and UI */
          body * {
            visibility: hidden !important;
          }

          /* 2. Show ONLY the A4 contract container and all its descendants */
          .a4-document-container,
          .a4-document-container * {
            visibility: visible !important;
          }

          /* 3. Anchor A4 container directly at (0,0) of the print paper */
          .a4-document-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            background: #ffffff !important;
            z-index: 99999 !important;
          }

          /* 4. Format each A4 page sheet */
          .a4-page-sheet {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            margin: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            box-sizing: border-box !important;
            padding: 14mm 16mm 12mm 16mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 5. Page 1 (Front) strictly breaks page after */
          .a4-page-front {
            page-break-after: always !important;
            break-after: page !important;
          }

          /* 6. Page 2 (Back) strictly breaks page before */
          .a4-page-back {
            page-break-before: always !important;
            break-before: page !important;
            page-break-after: auto !important;
            break-after: auto !important;
          }

          /* 7. Hide buttons and toolbar */
          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>

      {/* ========================================================= */}
      {/* 📄 SHEET 1: A4 앞면 (Page 1) - 계약 본문 전체 (제1조 ~ 제5조) */}
      {/* ========================================================= */}
      <div
        className="a4-page-sheet a4-page-front"
        style={{
          width: '100%',
          maxWidth: '794px', // 210mm at 96dpi
          minHeight: '1080px', // 297mm at 96dpi
          backgroundColor: '#ffffff',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          borderRadius: '8px',
          boxSizing: 'border-box',
          padding: '36px 40px 28px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          border: '1px solid #e2e8f0',
          color: '#1e293b'
        }}
      >
        <div>
          {/* Header Banner */}
          <div style={{ padding: '18px 20px', backgroundColor: '#0f172a', borderRadius: '10px', color: '#ffffff', textAlign: 'center', marginBottom: '18px' }}>

            {/* Top CI Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#38bdf8', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>
                N
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', border: '1px dashed rgba(148, 163, 184, 0.4)', padding: '2px 8px', borderRadius: '4px' }}>
                {renderEditableText('logoPlaceholder', '세무법인 노벨세무회계 CI')}
              </div>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0', color: '#38bdf8', letterSpacing: '-0.5px' }}>
              {renderEditableText('title', '세무 경정 청구 표준계약서')}
            </h2>
            <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: '1.4' }}>
              {renderEditableText('subtitle', '본 계약은 세무회계 위임 고객님과 세무법인 노벨세무회계 간의 경정청구 대행 약정서입니다.')}
            </p>

            {/* 14 Languages Selector Buttons */}
            {showLanguageSelector && (
              <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '14px', flexWrap: 'wrap' }}>
                {Object.keys(CONTRACT_LANG_CODES).map((lang) => {
                  const isCurrent = language === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => onLanguageChange && onLanguageChange(lang)}
                      style={{
                        border: 'none',
                        background: isCurrent ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)',
                        color: isCurrent ? '#0f172a' : '#e2e8f0',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {CONTRACT_LANG_CODES[lang] || lang}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 1. Parties Info Table (의뢰인 갑 & 수임인 을) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>

            {/* 甲: 의뢰인 */}
            <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '10px' }}>
              <div style={{ fontWeight: '800', color: '#2563eb', marginBottom: '6px', fontSize: '12.5px' }}>
                {renderEditableText('clientLabel', '의뢰인 (갑)')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr', gap: '3px', color: '#334155' }}>
                <span style={{ color: '#64748b' }}>• {renderEditableText('nameLabel', '성명')}:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{client.name || '-'}</span>

                <span style={{ color: '#64748b' }}>• {renderEditableText('nationalityLabel', '국적')}:</span>
                <span>{client.country || '-'}</span>

                <span style={{ color: '#64748b' }}>• {renderEditableText('regNumLabel', '외국인등록번호')}:</span>
                <span>{client.regNum || '-'}</span>

                <span style={{ color: '#64748b' }}>• {renderEditableText('companyLabel', '근무처')}:</span>
                <span>{client.company || '-'}</span>

                <span style={{ color: '#64748b' }}>• {renderEditableText('visaLabel', '비자 종류')}:</span>
                <span>{client.visa || '-'}</span>
              </div>
            </div>

            {/* 乙: 수임인 */}
            <div style={{ paddingLeft: '6px' }}>
              <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '6px', fontSize: '12.5px' }}>
                {renderEditableText('agentLabel', '수임인 (을)')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr', gap: '3px', color: '#334155' }}>
                <span style={{ color: '#64748b' }}>• {renderEditableText('firmNameLabel', '상호/법인명')}:</span>
                <span style={{ fontWeight: '700' }}>{renderEditableText('firmNameVal', '세무법인 노벨세무회계')}</span>

                <span style={{ color: '#64748b' }}>• {renderEditableText('firmRepresentativeLabel', '대표자')}:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {renderEditableText('representativeVal', '대표세무사 (직인)')}

                  {/* 세무사 공식 직인 인영 */}
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    border: '2px solid #dc2626',
                    color: '#dc2626',
                    fontSize: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: 'bold',
                    lineHeight: '1.1',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    transform: 'rotate(-5deg)'
                  }}>
                    <span>노벨</span>
                    <span style={{ fontSize: '7px' }}>직인</span>
                  </div>
                </span>
              </div>
            </div>

          </div>

          {/* 2. Contract Articles (제1조 ~ 제5조) */}
          <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.55', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 16px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '11px' }}>

            {/* Article 1 */}
            <div>
              <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                {renderEditableText('purposeTitle', '제1조 (목적)')}
              </div>
              <div style={{ color: '#475569', wordBreak: 'keep-all' }}>
                {renderEditableText('purposeText', '의뢰인(갑)은 세법 상 적용 누락된 감면 및 세액공제(중소기업 취업자 감면, 인적공제, 월세 세액공제 등)에 대한 세액 소급 환급을 위한 세무 경정청구 업무를 수임인(을)에게 위임한다.', { isTextarea: true, rows: 2 })}
              </div>
            </div>

            {/* Article 2 */}
            <div>
              <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                {renderEditableText('scopeTitle', '제2조 (위임 업무의 범위)')}
              </div>
              <div style={{ color: '#475569', whiteSpace: 'pre-line' }}>
                {renderEditableText('scopeText', '을이 수행하는 위임 업무의 범위는 다음 각 호와 같다:\n1. 갑의 귀속 연도별 원천징수영수증 및 소득 명세 적정성 검토\n2. 경정청구서 작성 및 관할 세무서 제출\n3. 과세관청의 소명 요구 자료 제출 및 대응 업무', { isTextarea: true, rows: 3 })}
              </div>
            </div>

            {/* Article 3 */}
            <div>
              <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                {renderEditableText('feeTitle', '제3조 (용역 보수 및 성공수수료)')}
              </div>
              <div style={{ color: '#475569', marginBottom: '5px', wordBreak: 'keep-all' }}>
                {isEditable ? renderEditableText('feeText1', feeDescription, { isTextarea: true, rows: 2 }) : feeDescription}
              </div>

              {/* Fee Calculation Highlight Box */}
              <div style={{ backgroundColor: '#f1f5f9', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: '#0f172a', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600' }}>{t.feeText2 || '• 약정 수수료율: '}</span>
                  <strong style={{ color: '#1d4ed8', fontSize: '14px' }}>{totalFeeRate}%{prepaidRate > 0 && postpaidRate > 0 ? ` (선불 ${prepaidRate}%, 후불 ${postpaidRate}%)` : ''}</strong>
                </div>
              </div>
            </div>

            {/* Article 4 */}
            <div>
              <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                {renderEditableText('paymentTitle', '제4조 (지급 기한 및 방식)')}
              </div>
              <div style={{ color: '#475569', whiteSpace: 'pre-line' }}>
                {isEditable ? renderEditableText('paymentText', paymentClause, { isTextarea: true, rows: 2 }) : paymentClause}
              </div>
            </div>

            {/* Article 5 */}
            <div>
              <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                {renderEditableText('dutiesTitle', '제5조 (신의성실 및 비밀유지)')}
              </div>
              <div style={{ color: '#475569', whiteSpace: 'pre-line' }}>
                {renderEditableText('dutiesText', '1. 을은 갑이 제공한 신분증 및 소득 자료를 경정청구 목적으로만 성실히 사용해야 하며, 절대 제3자에게 유출하거나 다른 목적으로 사용해서는 안 된다.\n2. 갑은 경정청구 진행을 위해 을이 요청하는 서류(외국인등록증, 가족관계증명서, 월세 내역 등)를 성실히 협조하여 제공해야 한다.', { isTextarea: true, rows: 2 })}
              </div>
            </div>

          </div>
        </div>

        {/* Sheet 1 Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>
          <span>세무법인 노벨세무회계 경정청구 위임계약서</span>
          <span style={{ fontWeight: 'bold', color: '#64748b' }}>페이지 1 / 2 (다음 장에 서명란이 이어집니다 ➔)</span>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 📄 SHEET 2: A4 뒷면 (Page 2) - 동의 확약 및 전자 서명란 */}
      {/* ========================================================= */}
      <div
        className="a4-page-sheet a4-page-back"
        style={{
          width: '100%',
          maxWidth: '794px',
          minHeight: '1080px',
          backgroundColor: '#ffffff',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          borderRadius: '8px',
          boxSizing: 'border-box',
          padding: '36px 40px 28px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          border: '1px solid #e2e8f0',
          color: '#1e293b'
        }}
      >
        <div>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '2px solid #0f172a', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '4px', backgroundColor: '#0f172a', color: '#38bdf8', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: '900' }}>
                N
              </div>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>세무법인 노벨세무회계</span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{renderEditableText('title', '세무 경정 청구 표준계약서')} (서명 및 체결)</span>
          </div>

          {/* Article 6 / Agreement Confirmation Section */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '20px 24px', marginBottom: '28px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
              {renderEditableText('completionTitle', '제6조 (계약의 체결 및 동의 확약)')}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6', wordBreak: 'keep-all' }}>
              {renderEditableText('completionText', '본인은 위 계약의 모든 조항 및 개인정보 처리에 관한 내용을 충분히 숙지하고 동의하며, 이에 성실히 서명하여 본 계약을 체결합니다.', { isTextarea: true, rows: 2 })}
            </p>
          </div>

          {/* Contract Date Box */}
          <div style={{ textAlign: 'center', margin: '24px 0 32px 0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{renderEditableText('dateLabel', '계약 체결 일자')}</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', letterSpacing: '1px' }}>
              {client.signedDate || new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Signature Grid (Party A Client vs Party B Contractor) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>

            {/* 甲 의뢰인 서명란 */}
            <div style={{ border: '2px solid #3b82f6', borderRadius: '10px', padding: '16px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#1d4ed8' }}>
                  ✍️ {renderEditableText('sigLabel', '의뢰인 (갑) 서명')}
                </span>

                {showSignaturePad && !client.signatureUrl && clearCanvas && (
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="no-print"
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#475569',
                      fontWeight: '700'
                    }}
                  >
                    {renderEditableText('sigClear', '지우기')}
                  </button>
                )}
              </div>

              {/* Signature Display or Interactive Canvas */}
              {client.signatureUrl ? (
                <div style={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                  <img src={client.signatureUrl} alt="Client Signature" style={{ maxHeight: '120px', maxWidth: '90%', objectFit: 'contain' }} />
                </div>
              ) : showSignaturePad ? (
                <canvas
                  ref={activeCanvasRef}
                  width={340}
                  height={140}
                  style={{
                    width: '100%',
                    height: '140px',
                    display: 'block',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px dashed #93c5fd',
                    touchAction: 'none',
                    cursor: 'crosshair'
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              ) : (
                <div style={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: '12px' }}>
                  (온라인 전자 서명 대기중)
                </div>
              )}

              <div style={{ marginTop: '8px', textAlign: 'right', fontSize: '12px', color: '#475569' }}>
                성명: <strong>{client.name || '-'}</strong> (인 / 서명)
              </div>
            </div>

            {/* 乙 수임인 직인란 */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
                  수임인 (을) 법인 및 대표자
                </div>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
                  <div>• 상호: <strong>{t.firmNameVal || '세무법인 노벨세무회계'}</strong></div>
                  <div>• 대표세무사: <strong>{t.representativeVal ? t.representativeVal.replace(/\(직인.*?\)/, '').trim() : '대표세무사'}</strong></div>
                  <div>• 사업자번호: 540-85-01234</div>
                </div>
              </div>

              {/* Official Seal Imprint */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>대표세무사</span>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '3px solid #dc2626',
                  color: '#dc2626',
                  fontSize: '11px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontWeight: '900',
                  lineHeight: '1.2',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(239, 68, 68, 0.04)',
                  boxShadow: 'inset 0 0 4px rgba(220, 38, 38, 0.2)'
                }}>
                  <span>세무법인</span>
                  <span>노벨</span>
                  <span style={{ fontSize: '9px' }}>직인</span>
                </div>
              </div>
            </div>

          </div>

          {/* Action Submit Button (Shown in Customer Mode) */}
          {showSignaturePad && !client.signatureUrl && onSignatureSubmit && (
            <div className="no-print" style={{ marginTop: '16px' }}>
              <button
                type="button"
                disabled={submitting || isCompleted}
                onClick={() => onSignatureSubmit('')}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '15px',
                  backgroundColor: submitting ? '#94a3b8' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: '800',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {submitting ? (
                  <span>{renderEditableText('submitting', '계약 체결 중...')}</span>
                ) : (
                  <span>🔒 {renderEditableText('submitBtn', '서명 제출하고 계약 체결하기')}</span>
                )}
              </button>
            </div>
          )}

          {/* Completed Notice */}
          {isCompleted && (
            <div style={{ padding: '16px', backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '8px', textAlign: 'center', color: '#065f46', marginTop: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>🎉 {t.successTitle || '계약 체결 완료'}</div>
              <div style={{ fontSize: '12px' }}>{t.successText || '경정청구 표준계약서 작성이 정상적으로 완료되었습니다.'}</div>
            </div>
          )}
        </div>

        {/* Sheet 2 Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '20px', fontSize: '11px', color: '#94a3b8' }}>
          <span>NOVEL TAX LAW FIRM</span>
          <span style={{ fontWeight: 'bold', color: '#64748b' }}>페이지 2 / 2 (최종 서명본)</span>
        </div>

      </div>

    </div>
  );
};
