import React, { useState, useMemo } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, Trash2 } from 'lucide-react';
import { encodeEucKr } from '../../utils/hometaxGenerator';

interface ValidationError {
  lineNum: number;
  recordType: string;
  message: string;
  severity: 'error' | 'warning';
}

export const HometaxValidatorView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [results, setResults] = useState<{
    fileType: 'wage' | 'freelancer' | 'unknown';
    totalLines: number;
    errors: ValidationError[];
    warnings: ValidationError[];
    summary: string;
  } | null>(null);

  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning'>('all');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResults(null);
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsValidating(true);
    setResults(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) return;

        // Decode as CP949 (EUC-KR)
        const decoder = new TextDecoder('euc-kr');
        const text = decoder.decode(buffer);
        
        // Split by lines. Note: NTS files end with \r\n (CRLF)
        const rawLines = text.split('\r\n');
        // Filter out empty trailing line if any
        const lines = rawLines.filter((l, idx) => idx < rawLines.length - 1 || l.trim() !== '');

        if (lines.length === 0) {
          setResults({
            fileType: 'unknown',
            totalLines: 0,
            errors: [{ lineNum: 1, recordType: '-', message: '파일 내용이 비어 있습니다.', severity: 'error' }],
            warnings: [],
            summary: '검증 실패: 빈 파일'
          });
          setIsValidating(false);
          return;
        }

        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        // 1. Detect file type based on first line (A-record)
        const firstLine = lines[0];
        let fileType: 'wage' | 'freelancer' | 'unknown' = 'unknown';
        let targetLength = 2010;

        if (firstLine.startsWith('A')) {
          const typeCode = firstLine.slice(1, 3);
          if (typeCode === '20') {
            fileType = 'wage';
            targetLength = 2010;
          } else if (typeCode === '24') {
            fileType = 'freelancer';
            targetLength = 190;
          }
        }

        if (fileType === 'unknown') {
          errors.push({
            lineNum: 1,
            recordType: 'A',
            message: '첫 번째 라인이 올바른 A레코드 식별자(근로소득: A20, 사업소득: A24)로 시작하지 않습니다.',
            severity: 'error'
          });
        }

        // Aggregate statistics to check counts and sums
        let actualBCount = 0;
        let expectedBCountInA = 0;

        let currentBCode = '';
        let expectedCCountInB = 0;
        let actualCCountInB = 0;

        let expectedSumInB = 0;
        let actualSumInB = 0;

        let expectedIncomeTaxInB = 0;
        let actualIncomeTaxInB = 0;

        let expectedLocalTaxInB = 0;
        let actualLocalTaxInB = 0;

        // Parse lines one by one
        lines.forEach((line, index) => {
          const lineNum = index + 1;
          const byteLen = encodeEucKr(line).length;
          const recordType = line[0] || 'Unknown';

          // A. Length Check
          if (fileType !== 'unknown' && byteLen !== targetLength) {
            errors.push({
              lineNum,
              recordType,
              message: `바이트 길이가 일치하지 않습니다. (기준: ${targetLength}바이트, 실제: ${byteLen}바이트)`,
              severity: 'error'
            });
          }

          // B. Dash Check in RRN/BizNo
          if (line.includes('-')) {
            errors.push({
              lineNum,
              recordType,
              message: '파일 본문에 하이픈(-)이 포함되어 있습니다. 국세청 전산매체에는 하이픈 기호가 금지됩니다.',
              severity: 'error'
            });
          }

          // C. Sequence & Subsum Validation
          if (fileType === 'wage') {
            if (recordType === 'A') {
              expectedBCountInA = parseInt(line.slice(194, 199), 10) || 0;
            } 
            else if (recordType === 'B') {
              actualBCount++;
              // Cross-check previous B-record C-count
              if (currentBCode !== '') {
                if (actualCCountInB !== expectedCCountInB) {
                  errors.push({
                    lineNum,
                    recordType: 'B',
                    message: `이전 원천징수의무자(사업자번호: ${currentBCode}) 아래의 실제 근로자 수(${actualCCountInB}명)가 B레코드에 기재된 소득인원(${expectedCCountInB}명)과 다릅니다.`,
                    severity: 'error'
                  });
                }
              }
              currentBCode = line.slice(12, 22).trim();
              expectedCCountInB = parseInt(line.slice(52, 58), 10) || 0;
              actualCCountInB = 0;
            } 
            else if (recordType === 'C') {
              actualCCountInB++;
            }
          } 
          else if (fileType === 'freelancer') {
            if (recordType === 'A') {
              expectedBCountInA = parseInt(line.slice(160, 165), 10) || 0;
            } 
            else if (recordType === 'B') {
              actualBCount++;
              
              // Validate previous group sums
              if (currentBCode !== '') {
                if (actualCCountInB !== expectedCCountInB) {
                  errors.push({
                    lineNum,
                    recordType: 'B',
                    message: `이전 원천징수의무자(사업자번호: ${currentBCode}) 아래의 실제 프리랜서 인원(${actualCCountInB}명)이 B레코드에 기재된 소득인원(${expectedCCountInB}명)과 다릅니다.`,
                    severity: 'error'
                  });
                }
                if (actualSumInB !== expectedSumInB) {
                  errors.push({
                    lineNum,
                    recordType: 'B',
                    message: `이전 의무자(${currentBCode})의 총 지급금액 합산(${actualSumInB}원)이 B레코드 총지급액계(${expectedSumInB}원)와 다릅니다.`,
                    severity: 'error'
                  });
                }
                if (actualIncomeTaxInB !== expectedIncomeTaxInB) {
                  errors.push({
                    lineNum,
                    recordType: 'B',
                    message: `이전 의무자(${currentBCode})의 소득세 합산(${actualIncomeTaxInB}원)이 B레코드 소득세액계(${expectedIncomeTaxInB}원)와 다릅니다.`,
                    severity: 'error'
                  });
                }
                if (actualLocalTaxInB !== expectedLocalTaxInB) {
                  errors.push({
                    lineNum,
                    recordType: 'B',
                    message: `이전 의무자(${currentBCode})의 지방소득세 합산(${actualLocalTaxInB}원)이 B레코드 지방소득세액계(${expectedLocalTaxInB}원)와 다릅니다.`,
                    severity: 'error'
                  });
                }
              }

              currentBCode = line.slice(12, 22).trim();
              expectedCCountInB = parseInt(line.slice(52, 58), 10) || 0;
              expectedSumInB = parseInt(line.slice(68, 83), 10) || 0;
              expectedIncomeTaxInB = parseInt(line.slice(83, 98), 10) || 0;
              expectedLocalTaxInB = parseInt(line.slice(98, 113), 10) || 0;

              actualCCountInB = 0;
              actualSumInB = 0;
              actualIncomeTaxInB = 0;
              actualLocalTaxInB = 0;
            } 
            else if (recordType === 'C') {
              actualCCountInB++;
              actualSumInB += parseInt(line.slice(131, 144), 10) || 0;
              actualIncomeTaxInB += parseInt(line.slice(147, 160), 10) || 0;
              actualLocalTaxInB += parseInt(line.slice(161, 174), 10) || 0;
            }
          }
        });

        // Last group validation for Freelancers
        if (fileType === 'freelancer' && currentBCode !== '') {
          if (actualCCountInB !== expectedCCountInB) {
            errors.push({
              lineNum: lines.length,
              recordType: 'C',
              message: `마지막 의무자(${currentBCode}) 아래의 실제 프리랜서 인원(${actualCCountInB}명)이 B레코드에 기재된 소득인원(${expectedCCountInB}명)과 다릅니다.`,
              severity: 'error'
            });
          }
          if (actualSumInB !== expectedSumInB) {
            errors.push({
              lineNum: lines.length,
              recordType: 'C',
              message: `마지막 의무자(${currentBCode})의 총 지급금액 합산(${actualSumInB}원)이 B레코드 총지급액계(${expectedSumInB}원)와 다릅니다.`,
              severity: 'error'
            });
          }
          if (actualIncomeTaxInB !== expectedIncomeTaxInB) {
            errors.push({
              lineNum: lines.length,
              recordType: 'C',
              message: `마지막 의무자(${currentBCode})의 소득세 합산(${actualIncomeTaxInB}원)이 B레코드 소득세액계(${expectedIncomeTaxInB}원)와 다릅니다.`,
              severity: 'error'
            });
          }
          if (actualLocalTaxInB !== expectedLocalTaxInB) {
            errors.push({
              lineNum: lines.length,
              recordType: 'C',
              message: `마지막 의무자(${currentBCode})의 지방소득세 합산(${actualLocalTaxInB}원)이 B레코드 지방소득세액계(${expectedLocalTaxInB}원)와 다릅니다.`,
              severity: 'error'
            });
          }
        }

        // B-record count match in Submitter (A-record)
        if (fileType !== 'unknown' && actualBCount !== expectedBCountInA) {
          errors.push({
            lineNum: 1,
            recordType: 'A',
            message: `제출파일 내 실제 B레코드(의무자) 수(${actualBCount}개)가 A레코드에 기재된 신고의무자 수(${expectedBCountInA}개)와 일치하지 않습니다.`,
            severity: 'error'
          });
        }

        // Compile validation results
        let summary = '검증 통과! 국세청 홈택스에 안전하게 제출할 수 있습니다.';
        if (errors.length > 0) {
          summary = `검증 실패: 총 ${errors.length}건의 형식/값 오류가 감지되었습니다.`;
        }

        setResults({
          fileType,
          totalLines: lines.length,
          errors,
          warnings,
          summary
        });
        setIsValidating(false);
      };

      reader.readAsArrayBuffer(uploadedFile);
    } catch (e: any) {
      console.error(e);
      setResults({
        fileType: 'unknown',
        totalLines: 0,
        errors: [{ lineNum: 0, recordType: '-', message: `파일 읽기 오류: ${e.message}`, severity: 'error' }],
        warnings: [],
        summary: '검증 진행 불가'
      });
      setIsValidating(false);
    }
  };

  const filteredIssues = useMemo(() => {
    if (!results) return [];
    const all = [...results.errors, ...results.warnings];
    if (filterSeverity === 'all') return all;
    return all.filter(i => i.severity === filterSeverity);
  }, [results, filterSeverity]);

  return (
    <div style={{ padding: '24px', color: '#1e293b', minHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔍</span> 국세청 전산매체 파일 사전 셀프 검증기
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
          홈택스에 파일을 업로드하기 전에 바이트 수, 레코드 서열, 금액 합산 정합성을 자동으로 검증하는 대량 일괄 분석 도구입니다.
        </p>
      </div>

      {!file ? (
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: '2px dashed ' + (dragOver ? '#3b82f6' : '#cbd5e1'),
            borderRadius: '16px',
            backgroundColor: dragOver ? '#eff6ff' : '#f8fafc',
            padding: '60px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out'
          }}
          onClick={() => document.getElementById('file-picker')?.click()}
        >
          <input 
            type="file" 
            id="file-picker" 
            style={{ display: 'none' }} 
            accept=".txt"
            onChange={handleFileChange}
          />
          <UploadCloud size={48} color={dragOver ? '#2563eb' : '#94a3b8'} style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 'bold', color: '#334155' }}>
            국세청 제출용 전산매체 파일(.txt)을 드래그해 놓거나 클릭하여 선택하세요
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            EUC-KR(CP949) 완성형 인코딩 및 근로소득(2010바이트), 프리랜서(190바이트) 일괄 자동 감지 검사
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* File summary bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '12px 20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} color="#64748b" />
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>{file.name}</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>({(file.size / 1024).toFixed(2)} KB)</span>
            </div>
            <button 
              onClick={handleReset} 
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <Trash2 size={14} /> 다른 파일 검증
            </button>
          </div>

          {isValidating && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid #3b82f6', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite', margin: '0 auto 12px auto' }}></div>
              <p style={{ fontSize: '13px', color: '#64748b' }}>전산매체 파일 정밀 디코딩 및 교차 정합성 분석 중...</p>
            </div>
          )}

          {results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Summary Status Panel */}
              <div 
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid ' + (results.errors.length > 0 ? '#fca5a5' : '#a7f3d0'),
                  backgroundColor: results.errors.length > 0 ? '#fef2f2' : '#ecfdf5',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}
              >
                {results.errors.length > 0 ? (
                  <AlertTriangle size={32} color="#dc2626" style={{ marginTop: '2px' }} />
                ) : (
                  <CheckCircle2 size={32} color="#10b981" style={{ marginTop: '2px' }} />
                )}
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: results.errors.length > 0 ? '#991b1b' : '#065f46' }}>
                    {results.summary}
                  </h3>
                  <div style={{ fontSize: '13px', color: results.errors.length > 0 ? '#b91c1c' : '#047857', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span>• 파일 유형: <strong>{results.fileType === 'wage' ? '근로소득 지급명세서 (2,010바이트)' : results.fileType === 'freelancer' ? '거주자 사업소득 지급명세서 (190바이트)' : '알 수 없음'}</strong></span>
                    <span>• 전체 레코드 행수: <strong>{results.totalLines} 라인</strong></span>
                    <span>• 오류: <strong style={{ color: '#ef4444' }}>{results.errors.length}건</strong></span>
                    <span>• 경고: <strong>{results.warnings.length}건</strong></span>
                  </div>
                </div>
              </div>

              {/* Issue list filter and display */}
              {results.errors.length > 0 && (
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>감지된 규격 불일치 및 데이터 오류 목록</h3>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => setFilterSeverity('all')}
                        style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: filterSeverity === 'all' ? '#0f172a' : '#ffffff', color: filterSeverity === 'all' ? '#ffffff' : '#475569', cursor: 'pointer' }}
                      >
                        전체 ({results.errors.length})
                      </button>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                          <th style={{ padding: '10px 16px', width: '80px' }}>행 번호</th>
                          <th style={{ padding: '10px 16px', width: '90px' }}>레코드 타입</th>
                          <th style={{ padding: '10px 16px', width: '100px' }}>심각도</th>
                          <th style={{ padding: '10px 16px' }}>오류 및 조치 권장 내역</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIssues.map((issue, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: issue.severity === 'error' ? '#fffafb' : '#fffdfa' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#1e293b' }}>{issue.lineNum}행</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                                {issue.recordType} 레코드
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ 
                                color: issue.severity === 'error' ? '#ef4444' : '#d97706', 
                                backgroundColor: issue.severity === 'error' ? '#fee2e2' : '#fef3c7',
                                padding: '2px 8px', 
                                borderRadius: '20px', 
                                fontSize: '11px', 
                                fontWeight: 'bold' 
                              }}>
                                {issue.severity === 'error' ? '오류 (Error)' : '경고 (Warning)'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', color: '#475569', lineHeight: '1.4' }}>{issue.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
