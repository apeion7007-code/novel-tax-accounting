import React, { useState, useEffect, useRef } from 'react';
import { fetchClientByConsentToken, updateClientConsent } from '../utils/supabaseClient';

interface ConsentPageProps {
  token: string;
  onBackToLogin?: () => void;
}

const CONSENT_TRANSLATIONS: Record<string, Record<string, string>> = {
  '한국어': {
    title: '세무대리 수임동의 서류 제출',
    subtitle: '안전한 경정청구 세금 환급 대행을 위해 아래 정보를 제출해 주세요.',
    clientNameLabel: '신청인 성명',
    arcLabel: '외국인등록증 (앞면)',
    arcHint: '이름과 외국인등록번호가 선명하게 보이도록 촬영 및 업로드해 주세요.',
    sigLabel: '서명 (손가락 또는 마우스)',
    sigClear: '지우기',
    submitBtn: '동의서 제출하기',
    submitting: '제출 중...',
    successTitle: '서류 제출 완료',
    successText: '감사합니다. 수임동의 서류가 정상적으로 제출되었습니다. 관리자가 신속하게 접수 처리를 진행할 예정입니다.',
    errorTitle: '고객 정보 오류',
    errorText: '고객 정보를 찾을 수 없거나 유효하지 않은 링크입니다. 담당 매니저에게 문의해 주세요.',
    kakaotalkGuideTitle: '보안 및 파일 제출을 위해 외부 브라우저로 이동해 주세요.',
    kakaotalkGuideText: '아이폰 보안 정책상 카카오톡 화면에서는 신분증 카메라 촬영이 불가능합니다. 화면 우측 상단의 점 세 개(···) 또는 아래 메뉴 버튼을 누르고 [Safari로 열기] 또는 [다른 브라우저로 열기]를 선택하여 작성해 주세요.'
  },
  '베트남어': {
    title: 'Nộp tài liệu đồng ý đại lý thuế',
    subtitle: 'Vui lòng gửi thông tin dưới đây để thực hiện hoàn thuế một cách an toàn.',
    clientNameLabel: 'Họ và tên người nộp',
    arcLabel: 'Thẻ đăng ký người nước ngoài (Mặt trước)',
    arcHint: 'Vui lòng chụp và tải lên sao cho họ tên và số đăng ký hiện rõ nét.',
    sigLabel: 'Chữ ký (Bằng ngón tay hoặc chuột)',
    sigClear: 'Xóa ký lại',
    submitBtn: 'Gửi tài liệu đồng ý',
    submitting: 'Đang gửi...',
    successTitle: 'Nộp tài liệu thành công',
    successText: 'Xin cảm ơn. Tài liệu đồng ý thuế của bạn đã được gửi thành công. Quản trị viên sẽ nhanh chóng tiến hành xử lý.',
    errorTitle: 'Lỗi thông tin khách hàng',
    errorText: 'Không tìm thấy thông tin khách hàng hoặc liên kết không hợp lệ. Vui lòng liên hệ với quản lý của bạn.',
    kakaotalkGuideTitle: 'Vui lòng mở bằng trình duyệt ngoài để nộp tài liệu bảo mật.',
    kakaotalkGuideText: 'Do chính sách bảo mật của iPhone, không thể chụp ảnh thẻ ngoại kiều trong màn hình KakaoTalk. Vui lòng nhấn vào dấu ba chấm (···) ở góc trên bên phải hoặc nút menu bên dưới và chọn [Mở bằng Safari] hoặc [Mở bằng trình duyệt khác] để tiếp tục.'
  },
  '미얀마어': {
    title: 'အခွန်ကိုယ်စားလှယ် သဘောတူညီချက် စာရွက်စာတမ်းတင်ပြခြင်း',
    subtitle: 'လုံခြုံစိတ်ချရသော အခွန်ပြန်အမ်းငွေ ကိုယ်စားလှယ်လုပ်ငန်းအတွက် အောက်ပါအချက်အလက်များကို တင်ပြပေးပါ။',
    clientNameLabel: 'လျှောက်ထားသူအမည်',
    arcLabel: 'နိုင်ငံခြားသားစိစစ်ရေးကတ် (အရှေ့ဘက်)',
    arcHint: 'အမည်နှင့် နိုင်ငံခြားသားမှတ်ပုံတင်နံပါတ် ရှင်းလင်းစွာမြင်ရအောင် ဓာတ်ပုံရိုက်ပြီး တင်ပေးပါ။',
    sigLabel: 'လက်မှတ် (လက်ချောင်း သို့မဟုတ် မောက်စ်)',
    sigClear: 'ပြန်ဖျက်ရန်',
    submitBtn: 'သဘောတူညီချက် တင်သွင်းရန်',
    submitting: 'တင်သွင်းနေဆဲ...',
    successTitle: 'စာရွက်စာတမ်း တင်သွင်းမှုအောင်မြင်သည်',
    successText: 'ကျေးဇူးတင်ပါသည်။ သင်၏ သဘောတူညီချက် စာရွက်စာတမ်းကို အောင်မြင်စွာ တင်သွင်းပြီးပါပြီ။ မန်နေဂျာမှ အမြန်ဆုံး ဆက်လက်ဆောင်ရွက်ပေးပါမည်။',
    errorTitle: 'ဖောက်သည်အချက်အလက် အမှား',
    errorText: 'ဖောက်သည်အချက်အလက်ကို ရှာမတွေ့ပါ သို့မဟုတ် လင့်ခ်မှာ သက်တမ်းကုန်ဆုံးသွားပါပြီ။ တာဝန်ခံမန်နေဂျာကို ဆက်သွယ်မေးမြန်းပါ။',
    kakaotalkGuideTitle: 'လုံခြုံရေးနှင့် ဖိုင်တင်သွင်းရန် ပြင်ပဘရောက်ဆာသို့ ကူးပြောင်းပေးပါ။',
    kakaotalkGuideText: 'iPhone ၏လုံခြုံရေးမူဝါဒကြောင့် KakaoTalk မျက်နှာပြင်တွင် ကင်မရာအသုံးပြု၍မရပါ။ ညာဘက်အပေါ်ရှိ အစက်သုံးစက် (···) သို့မဟုတ် အောက်ခြေမီနူးကိုနှိပ်ပြီး [Safari ဖြင့်ဖွင့်ရန်] သို့မဟုတ် [အခြားဘရောက်ဆာဖြင့်ဖွင့်ရန်] ကိုရွေးချယ်ပါ။'
  },
  '영어': {
    title: 'Tax Agent Authorization Consent',
    subtitle: 'Please submit the following information to securely authorize your tax refund request.',
    clientNameLabel: 'Applicant Name',
    arcLabel: 'Alien Registration Card (Front)',
    arcHint: 'Please upload a photo with your name and registration number clearly visible.',
    sigLabel: 'Signature (Finger or Mouse)',
    sigClear: 'Clear',
    submitBtn: 'Submit Consent',
    submitting: 'Submitting...',
    successTitle: 'Submission Completed',
    successText: 'Thank you. Your consent documents have been successfully submitted. The administrator will process it shortly.',
    errorTitle: 'Invalid Link',
    errorText: 'Client information not found or link has expired. Please contact your manager.',
    kakaotalkGuideTitle: 'Please open in an external browser to submit documents.',
    kakaotalkGuideText: 'Due to iPhone security policies, camera access is disabled inside KakaoTalk. Please tap the three dots (···) in the top-right corner or the menu button below, and select [Open in Safari] or [Open in Default Browser].'
  }
};

export function ConsentPage({ token, onBackToLogin }: ConsentPageProps) {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('한국어');
  
  const [arcFile, setArcFile] = useState<File | null>(null);
  const [arcPreview, setArcPreview] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  const [isKakaoBrowser, setIsKakaoBrowser] = useState<boolean>(false);
  const [isIOSDevice, setIsIOSDevice] = useState<boolean>(false);

  // Detect KakaoTalk In-App Browser and trigger outlink on Android
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isKakao = ua.indexOf('kakaotalk') > -1;
    const isIOS = /iphone|ipad|ipod/.test(ua);
    
    setIsKakaoBrowser(isKakao);
    setIsIOSDevice(isIOS);

    if (isKakao) {
      if (!isIOS) {
        // Android KakaoTalk Outlink breakout
        const currentUrl = window.location.href;
        const strippedUrl = currentUrl.replace(/^https?:\/\//, '');
        const scheme = currentUrl.startsWith('https') ? 'https' : 'http';
        const finalIntent = `intent://${strippedUrl}#Intent;scheme=${scheme};package=com.android.chrome;end`;
        window.location.href = finalIntent;
      }
    }
  }, []);

  // Load client data
  useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await fetchClientByConsentToken(token);
      if (data) {
        setClient(data);
        // Auto-select language based on country
        if (data.country === '베트남') {
          setSelectedLanguage('베트남어');
        } else if (data.country === '미얀마') {
          setSelectedLanguage('미얀마어');
        } else if (data.country && data.country !== '대한민국' && data.country !== '한국') {
          setSelectedLanguage('영어');
        }
      }
      setLoading(false);
    }
    load();
  }, [token]);

  // Setup signature canvas scaling
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [client, success]);

  const t = CONSENT_TRANSLATIONS[selectedLanguage] || CONSENT_TRANSLATIONS['한국어'];

  // Signature Draw Events (Mouse & Touch)
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Handle ARC File Input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArcFile(file);
      setArcPreview(URL.createObjectURL(file));
    }
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!client) return;

    if (!arcFile) {
      alert(selectedLanguage === '베트남어' ? 'Vui lòng tải lên ảnh thẻ đăng ký người nước ngoài.' :
            selectedLanguage === '미얀마어' ? 'နိုင်ငံခြားသားမှတ်ပုံတင်ကတ်ပုံ တင်ပြပေးပါ။' :
            '외국인등록증 사진을 등록해 주세요.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas is blank
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      alert(selectedLanguage === '베트남어' ? 'Vui lòng hoàn thành chữ ký của bạn.' :
            selectedLanguage === '미얀마어' ? 'လက်မှတ်ရေးထိုးပေးပါ။' :
            '서명을 작성해 주세요.');
      return;
    }

    setSubmitting(true);
    const signatureBase64 = canvas.toDataURL('image/png');

    const res = await updateClientConsent(client.id, arcFile, signatureBase64);
    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
    } else {
      alert(`제출 실패 / Submission Failed: ${res.error}`);
    }
  };

  if (isKakaoBrowser && isIOSDevice) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '400px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '32px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative' }}>
          
          <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '24px', animation: 'bounce 1s infinite alternate' }}>
            ↗️
          </div>
          <style>{`
            @keyframes bounce {
              0% { transform: translateY(0) translateX(0); }
              100% { transform: translateY(-8px) translateX(8px); }
            }
          `}</style>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
            {Object.keys(CONSENT_TRANSLATIONS).map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLanguage(lang)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  borderRadius: '100px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: selectedLanguage === lang ? '#3b82f6' : 'transparent',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                {lang === '한국어' ? 'KO' : lang === '베트남어' ? 'VN' : lang === '미얀마어' ? 'MM' : 'EN'}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '50px', marginBottom: '20px' }}>📱</div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#60a5fa', lineHeight: '1.4' }}>
            {t.kakaotalkGuideTitle}
          </h2>
          
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 24px 0', textAlign: 'left', wordBreak: 'keep-all' }}>
            {t.kakaotalkGuideText}
          </p>

          <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', fontSize: '11px', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            <span>💡</span> <span>다른 브라우저(Safari/Chrome)로 열면 즉시 작성 가능합니다.</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: '15px', color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: '400px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>{t.errorTitle}</h3>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', margin: '0 0 20px 0' }}>{t.errorText}</p>
          {onBackToLogin && (
            <button 
              onClick={onBackToLogin}
              style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              메인 화면으로 이동
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '16px',
      boxSizing: 'border-box',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '460px', 
        backgroundColor: '#ffffff', 
        borderRadius: '16px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', 
        overflow: 'hidden' 
      }}>
        {/* Header Language Selector */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          {Object.keys(CONSENT_TRANSLATIONS).map(lang => (
            <button 
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              style={{ 
                border: 'none', 
                background: selectedLanguage === lang ? '#0f172a' : 'transparent', 
                color: selectedLanguage === lang ? '#ffffff' : '#64748b',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 'bold',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {lang}
            </button>
          ))}
        </div>

        {success ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '50px', marginBottom: '16px' }}>🎉</div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#1e293b', fontWeight: 'bold' }}>{t.successTitle}</h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px 0' }}>{t.successText}</p>
            <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>Novel Tax Accounting</div>
          </div>
        ) : (
          <div style={{ padding: '24px' }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>{t.title}</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>{t.subtitle}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Applicant Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                  {t.clientNameLabel}
                </label>
                <div style={{ 
                  backgroundColor: '#f1f5f9', 
                  borderRadius: '6px', 
                  padding: '10px 12px', 
                  fontSize: '14px', 
                  color: '#1e293b', 
                  fontWeight: 'bold' 
                }}>
                  {client.name}
                </div>
              </div>

              {/* ARC Card Image Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                  {t.arcLabel} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                  {t.arcHint}
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {arcPreview ? (
                    <div style={{ position: 'relative', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden', height: '180px', display: 'flex', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
                      <img src={arcPreview} alt="ARC Preview" style={{ height: '100%', objectFit: 'contain' }} />
                      <button 
                        onClick={() => { setArcFile(null); setArcPreview(''); }}
                        style={{ 
                          position: 'absolute', 
                          top: '8px', 
                          right: '8px', 
                          backgroundColor: 'rgba(15, 23, 42, 0.7)', 
                          color: '#ffffff', 
                          border: 'none', 
                          borderRadius: '50%', 
                          width: '26px', 
                          height: '26px', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label style={{ 
                      border: '2px dashed #cbd5e1', 
                      borderRadius: '8px', 
                      height: '120px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      backgroundColor: '#f8fafc'
                    }}>
                      <span style={{ fontSize: '26px', marginBottom: '6px' }}>📷</span>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>사진 찍기 / 업로드</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        style={{ display: 'none' }} 
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Touch Signature Canvas */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
                    {t.sigLabel} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <button 
                    onClick={clearCanvas}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#ef4444', 
                      fontSize: '11px', 
                      fontWeight: 'bold', 
                      cursor: 'pointer' 
                    }}
                  >
                    🔄 {t.sigClear}
                  </button>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fafafa' }}>
                  <canvas 
                    ref={canvasRef}
                    width={410}
                    height={150}
                    style={{ display: 'block', width: '100%', cursor: 'crosshair', touchAction: 'none' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              style={{ 
                width: '100%', 
                backgroundColor: submitting ? '#64748b' : '#0f172a', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '8px', 
                padding: '14px 0', 
                fontSize: '14px', 
                fontWeight: 'bold', 
                marginTop: '24px', 
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}
            >
              {submitting ? t.submitting : t.submitBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
