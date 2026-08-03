import React, { useState, useEffect, useRef } from 'react';
import { fetchClientByConsentToken, updateClientContract, supabase } from '../utils/supabaseClient';
import { calculateCombinedRefund } from '../utils/combinedTaxCalculator';

interface ContractPageProps {
  token: string;
  onBackToLogin?: () => void;
}

const CONTRACT_LANG_CODES: Record<string, string> = {
  '한국어': 'KO',
  '베트남어': 'VN',
  '인도네시아어': 'ID',
  '몽골어': 'MN',
  '미얀마어': 'MM',
  '캄보디아어': 'KH',
  '네팔어': 'NP',
  '방글라데시어': 'BD',
  '우즈베크어': 'UZ',
  '파키스탄어': 'PK',
  '태국어': 'TH',
  '필리핀어': 'PH',
  '스리랑카어': 'LK',
  '영어': 'EN'
};

const CONTRACT_TRANSLATIONS: Record<string, Record<string, string>> = {
  '한국어': {
    title: '세무 경정 청구 표준계약서',
    subtitle: '본 계약은 세무회계 위임 고객님과 세무법인 노벨세무회계 간의 경정청구 대행 약정서입니다.',
    clientLabel: '의뢰인 (갑)',
    agentLabel: '수임인 (을)',
    nameLabel: '성명',
    nationalityLabel: '국적',
    regNumLabel: '외국인등록번호/생년월일',
    addressLabel: '주민등록상 주소지',
    phoneLabel: '연락처',
    companyLabel: '근무처',
    visaLabel: '비자 종류',
    firmNameLabel: '상호 / 법인명',
    firmRepresentativeLabel: '대표자',
    firmNameVal: '세무법인 노벨세무회계',
    representativeVal: '대표세무사 (직인 예정)',
    purposeTitle: '제1조 (목적)',
    purposeText: '의뢰인(갑)은 세법 상 적용 누락된 감면 및 세액공제(중소기업 취업자 감면, 인적공제, 월세 세액공제 등)에 대한 세액 소급 환급을 위한 세무 경정청구 업무를 수임인(을)에게 위임한다.',
    scopeTitle: '제2조 (위임 업무의 범위)',
    scopeText: '을이 수행하는 위임 업무의 범위는 다음 각 호와 같다:\n1. 갑의 귀속 연도별 원천징수영수증 및 소득 명세 적정성 검토\n2. 경정청구서 작성 및 관할 세무서 제출\n3. 과세관청의 소명 요구 자료 제출 및 대응 업무',
    feeTitle: '제3조 (용역 보수 및 성공수수료)',
    feeText1: '본 경정청구 용역의 대가는 성공보수 방식으로 하며, 국세청으로부터 환급(결정)이 확정된 총 환급금액(지방세 포함)에 약정 수수료율을 곱한 금액으로 한다.',
    feeText2: '• 약정 수수료율: ',
    feeText3: '• 예상 총 환급금액: ',
    feeText4: '• 계산된 예상 수수료 (원화): ',
    paymentTitle: '제4조 (지급 기한 및 방식)',
    paymentText: '갑은 국세청 및 지자체로부터 세금 환급금을 본인 계좌로 수령한 날로부터 3영업일 이내에 을이 지정한 아래 입금 계좌로 수수료를 송금해야 한다.\n• 입금 계좌: 국민은행 848601-04-162791\n• 예금주: (주)노벨디앤씨',
    dutiesTitle: '제5조 (신의성실 및 비밀유지)',
    dutiesText: '1. 을은 갑이 제공한 신분증 및 소득 자료를 경정청구 목적으로만 성실히 사용해야 하며, 절대 제3자에게 유출하거나 다른 목적으로 사용해서는 안 된다.\n2. 갑은 경정청구 진행을 위해 을이 요청하는 서류(외국인등록증, 가족관계증명서, 월세 내역 등)를 성실히 협조하여 제공해야 한다.',
    completionTitle: '제6조 (계약의 체결 및 서명)',
    completionText: '본 계약의 조항을 명확히 확인하였으며, 계약서 내용에 동의하여 서명합니다.',
    sigLabel: '의뢰인 서명 (손가락 또는 마우스)',
    sigClear: '지우기',
    submitBtn: '서명 제출하고 계약 체결하기',
    submitting: '계약 체결 중...',
    successTitle: '계약 체결 완료',
    successText: '경정청구 표준계약서 작성이 정상적으로 완료되었습니다. 환급 정산 절차가 안전하고 신속하게 진행될 예정입니다. 감사합니다.',
    errorTitle: '고객 정보 로드 오류',
    errorText: '계약서 서명을 위한 고객 정보를 찾을 수 없거나 링크가 만료되었습니다. 담당 매니저에게 문의해 주세요.',
    sealPlaceholder: '(세무사 직인 예정지)',
    logoPlaceholder: '세무법인 노벨세무회계 CI',
    won: '원'
  },
  '영어': {
    title: 'Standard Tax Refund Claim Agreement',
    subtitle: 'This agreement is a service contract between the client (Client) and Novel Tax Accounting.',
    clientLabel: 'Client (Party A)',
    agentLabel: 'Agent (Party B)',
    nameLabel: 'Full Name',
    nationalityLabel: 'Nationality',
    regNumLabel: 'ARC Number / DOB',
    addressLabel: 'Registered Address',
    phoneLabel: 'Contact No',
    companyLabel: 'Employer',
    visaLabel: 'Visa Type',
    firmNameLabel: 'Firm Name',
    firmRepresentativeLabel: 'Representative',
    firmNameVal: 'Novel Tax & Accounting Corp.',
    representativeVal: 'Representative Tax Accountant',
    purposeTitle: 'Article 1 (Purpose)',
    purposeText: 'The Client (Party A) delegates to the Agent (Party B) the tax rectification (refund claim) service for retroactively claiming missed tax deductions/reductions (e.g., SME employment reduction, dependents deduction, monthly rent credit) under tax laws.',
    scopeTitle: 'Article 2 (Scope of Services)',
    scopeText: 'The scope of services performed by Party B is as follows:\n1. Reviewing Party A\'s withholding tax receipts and income appropriateness per year\n2. Preparing and submitting rectification requests to the tax office\n3. Answering requests for explanations from tax authorities.',
    feeTitle: 'Article 3 (Service Fees & Success Fees)',
    feeText1: 'The fee for this rectification service shall be based on a success-fee basis, calculated by multiplying the total refund amount (including local tax) confirmed by the NTS by the agreed fee rate.',
    feeText2: '• Agreed Fee Rate: ',
    feeText3: '• Expected Total Refund: ',
    feeText4: '• Calculated Expected Fee: ',
    paymentTitle: 'Article 4 (Payment Terms & Method)',
    paymentText: 'Party A shall transfer the fee to Party B\'s designated bank account below within 3 business days from the date Party A receives the tax refund from the tax office/local government.\n• Account: KB Kookmin Bank 848601-04-162791\n• Depositor: Nobel D&C Co., Ltd.',
    dutiesTitle: 'Article 5 (Good Faith & Confidentiality)',
    dutiesText: '1. Party B shall use the ID and income details provided by Party A strictly for the purpose of tax rectification and shall never leak them to third parties.\n2. Party A shall cooperate in good faith to provide documents requested by Party B.',
    completionTitle: 'Article 6 (Execution & Signatures)',
    completionText: 'I have verified and agreed to all terms of this agreement and signed below.',
    sigLabel: 'Client Signature (Draw using finger or mouse)',
    sigClear: 'Clear',
    submitBtn: 'Submit & Sign Agreement',
    submitting: 'Submitting...',
    successTitle: 'Agreement Completed',
    successText: 'The Tax Refund Claim Agreement has been successfully executed. The refund process will proceed securely. Thank you.',
    errorTitle: 'Customer Information Error',
    errorText: 'Customer details could not be found or the link has expired. Please contact your manager.',
    sealPlaceholder: '(Tax Accountant Seal)',
    logoPlaceholder: 'Novel Tax Accounting CI',
    won: 'KRW'
  },
  '베트남어': {
    title: 'Hợp đồng ủy quyền đại lý thuế',
    subtitle: 'Hợp đồng này là văn bản cam kết dịch vụ giữa khách hàng (Bên A) và Văn phòng Đại lý Thuế Novel.',
    clientLabel: 'Khách hàng (Bên A)',
    agentLabel: 'Đại lý thuế (Bên B)',
    nameLabel: 'Họ và tên',
    nationalityLabel: 'Quốc tịch',
    regNumLabel: 'Số thẻ ngoại kiều/Ngày sinh',
    addressLabel: 'Địa chỉ đăng ký',
    phoneLabel: 'Số điện thoại',
    companyLabel: 'Nơi làm việc',
    visaLabel: 'Loại Visa',
    firmNameLabel: 'Tên văn phòng',
    firmRepresentativeLabel: 'Người đại diện',
    firmNameVal: 'Văn phòng Đại lý Thuế Novel',
    representativeVal: 'Đại diện đại lý thuế',
    purposeTitle: 'Điều 1 (Mục đích)',
    purposeText: 'Khách hàng (Bên A) ủy quyền cho Đại lý thuế (Bên B) thực hiện các thủ tục yêu cầu hoàn thuế bổ sung (ví dụ: giảm thuế SME, giảm trừ gia cảnh, hoàn thuế thuê nhà hàng tháng) bị bỏ sót theo luật thuế.',
    scopeTitle: 'Điều 2 (Phạm vi công việc)',
    scopeText: 'Phạm vi dịch vụ do Bên B thực hiện như sau:\n1. Xem xét biên lai thuế khấu trừ tại nguồn và tính hợp lý của thu nhập Bên A theo từng năm\n2. Soạn thảo và nộp hồ sơ yêu cầu hoàn thuế đến cơ quan thuế\n3. Giải trình số liệu với cơ quan thuế khi có yêu cầu.',
    feeTitle: 'Điều 3 (Phí dịch vụ & Phí thành công)',
    feeText1: 'Phí dịch vụ được tính theo hình thức phí thành công, bằng tổng số tiền hoàn thuế (bao gồm cả thuế địa phương) được xác nhận bởi Cơ quan Thuế nhân với tỷ lệ phí đã thỏa thuận.',
    feeText2: '• Tỷ lệ phí đã thỏa thuận: ',
    feeText3: '• Tổng số tiền hoàn thuế dự kiến: ',
    feeText4: '• Phí dịch vụ dự kiến (KRW): ',
    paymentTitle: 'Điều 4 (Phương thức & Thời hạn thanh toán)',
    paymentText: 'Bên A có trách nhiệm chuyển phí dịch vụ vào tài khoản ngân hàng của Bên B trong vòng 3 ngày làm việc kể từ ngày Bên A nhận được tiền hoàn thuế từ cơ quan thuế.\n• Tài khoản: Ngân hàng KB Kookmin 848601-04-162791\n• Chủ tài khoản: Nobel D&C Co., Ltd.',
    dutiesTitle: 'Điều 5 (Cam kết bảo mật & Trung thực)',
    dutiesText: '1. Bên B cam kết bảo mật tuyệt đối thông tin cá nhân và tài liệu thu nhập của Bên A cung cấp, chỉ sử dụng cho mục đích yêu cầu hoàn thuế.\n2. Bên A cam kết cung cấp trung thực và đầy đủ các tài liệu cần thiết theo yêu cầu của Bên B.',
    completionTitle: 'Điều 6 (Ký kết hợp đồng)',
    completionText: 'Tôi đã kiểm tra và hoàn toàn đồng ý với các điều khoản trong hợp đồng này.',
    sigLabel: 'Chữ ký của Bên A (Ký bằng ngón tay hoặc chuột)',
    sigClear: 'Xóa ký lại',
    submitBtn: 'Ký và gửi hợp đồng',
    submitting: 'Đang gửi...',
    successTitle: 'Ký kết thành công',
    successText: 'Hợp đồng ủy quyền hoàn thuế đã được ký kết thành công. Chúng tôi sẽ tiến hành thủ tục an toàn nhất cho bạn. Xin cảm ơn.',
    errorTitle: 'Lỗi thông tin khách hàng',
    errorText: 'Không tìm thấy thông tin khách hàng hoặc liên kết đã hết hạn. Vui lòng liên hệ với quản lý của bạn.',
    sealPlaceholder: '(Con dấu đại lý thuế)',
    logoPlaceholder: 'Novel Tax Logo',
    won: 'Won'
  },
  '인도네시아어': {
    title: 'Perjanjian Kuasa Pajak Standar',
    subtitle: 'Perjanjian ini adalah kontrak layanan antara klien (Pihak A) dan Novel Tax Accounting.',
    clientLabel: 'Klien (Pihak A)',
    agentLabel: 'Agen Pajak (Pihak B)',
    nameLabel: 'Nama Lengkap',
    nationalityLabel: 'Kewarganegaraan',
    regNumLabel: 'Nomor ARC / Tanggal Lahir',
    addressLabel: 'Alamat Terdaftar',
    phoneLabel: 'Nomor Kontak',
    companyLabel: 'Tempat Kerja',
    visaLabel: 'Jenis Visa',
    firmNameLabel: 'Nama Firma',
    firmRepresentativeLabel: 'Perwakilan',
    firmNameVal: 'Novel Tax & Accounting',
    representativeVal: 'Perwakilan Akuntan Pajak',
    purposeTitle: 'Pasal 1 (Tujuan)',
    purposeText: 'Klien (Pihak A) mendelegasikan kepada Agen (Pihak B) layanan klaim pengembalian pajak untuk mengklaim kembali pengurangan pajak yang terlewat (misalnya, pengurangan kerja UKM, pengurangan keluarga, kredit sewa bulanan) berdasarkan undang-undang perpajakan.',
    scopeTitle: 'Pasal 2 (Ruang Lingkup Layanan)',
    scopeText: 'Ruang lingkup layanan yang dilakukan oleh Pihak B adalah:\n1. Memeriksa tanda terima pajak penghasilan dan kelayakan pendapatan Klien per tahun\n2. Menyiapkan dan mengajukan permintaan pengembalian pajak ke kantor pajak\n3. Menjawab permintaan klarifikasi dari otoritas pajak.',
    feeTitle: 'Pasal 3 (Biaya Layanan & Komisi Sukses)',
    feeText1: 'Biaya untuk layanan ini didasarkan pada komisi sukses, dihitung dengan mengalikan total jumlah pengembalian dana (termasuk pajak daerah) yang dikonfirmasi oleh kantor pajak dengan tarif biaya yang disepakati.',
    feeText2: '• Tarif Biaya yang Disepakati: ',
    feeText3: '• Perkiraan Total Pengembalian: ',
    feeText4: '• Perkiraan Biaya yang Dihitung: ',
    paymentTitle: 'Pasal 4 (Ketentuan & Metode Pembayaran)',
    paymentText: 'Pihak A harus mentransfer komisi ke rekening bank Pihak B di bawah ini dalam waktu 3 hari kerja sejak tanggal Pihak A menerima pengembalian pajak dari kantor pajak.\n• Rekening: Bank KB Kookmin 848601-04-162791\n• Pemilik Rekening: Nobel D&C Co., Ltd.',
    dutiesTitle: 'Pasal 5 (Itikad Baik & Kerahasiaan)',
    dutiesText: '1. Pihak B harus menggunakan dokumen identitas dan rincian pendapatan yang diberikan oleh Pihak A hanya untuk tujuan pengembalian pajak dan tidak membocorkannya kepada pihak ketiga.\n2. Pihak A harus bekerja sama dengan itikad baik untuk menyediakan dokumen yang diminta.',
    completionTitle: 'Pasal 6 (Penandatanganan & Persetujuan)',
    completionText: 'Saya telah memeriksa dan menyetujui semua ketentuan perjanjian ini dan menandatanganinya di bawah ini.',
    sigLabel: 'Tanda Tangan Klien (Gunakan jari atau mouse)',
    sigClear: 'Hapus',
    submitBtn: 'Kirim & Tanda Tangani Perjanjian',
    submitting: 'Mengirimkan...',
    successTitle: 'Perjanjian Selesai',
    successText: 'Perjanjian klaim pajak telah berhasil dilaksanakan. Proses pengembalian dana akan berjalan dengan aman. Terima kasih.',
    errorTitle: 'Kesalahan Informasi Pelanggan',
    errorText: 'Informasi pelanggan tidak ditemukan atau tautan telah kedaluwarsa. Silakan hubungi manajer Anda.',
    sealPlaceholder: '(Cap Akuntan Pajak)',
    logoPlaceholder: 'Novel Tax Logo',
    won: 'KRW'
  },
  '몽골어': {
    title: 'Татварын итгэмжлэлийн стандарт гэрээ',
    subtitle: 'Энэхүү гэрээ нь үйлчлүүлэгч (А тал) болон Новель татварын зөвлөх компанийн хооронд байгуулсан гэрээ юм.',
    clientLabel: 'Үйлчлүүлэгч (А тал)',
    agentLabel: 'Төлөөлөгч (Б тал)',
    nameLabel: 'Овог нэр',
    nationalityLabel: 'Иргэншил',
    regNumLabel: 'Бүртгэлийн дугаар/Төрсөн огноо',
    addressLabel: 'Бүртгэлтэй хаяг',
    phoneLabel: 'Утасны дугаар',
    companyLabel: 'Ажлын газар',
    visaLabel: 'Визний төрөл',
    firmNameLabel: 'Компанийн нэр',
    firmRepresentativeLabel: 'Төлөөлөгч',
    firmNameVal: 'Новель Татварын Зөвлөх Компани',
    representativeVal: 'Төлөөлөх татварын итгэмжлэгдсэн нягтлан бодогч',
    purposeTitle: '1-р зүйл (Зорилго)',
    purposeText: 'Үйлчлүүлэгч (А тал) нь татварын хуулийн дагуу орхигдсон хөнгөлөлт, чөлөөлөлтийг (жишээлбэл, жижиг дунд үйлдвэрийн хөнгөлөлт, хамааралтай хүмүүсийн хөнгөлөлт, түрээсийн хөнгөлөлт) нөхөн авахаар татварын итгэмжлэлийн ажлыг Б талд шилжүүлэн өгч байна.',
    scopeTitle: '2-р зүйл (Үйлчилгээний хүрээ)',
    scopeText: 'Б талын гүйцэтгэх ажлын хүрээ дараах байдалтай байна:\n1. Жил бүрийн орлогын тайлан, татвар суутгалын баримтыг шалгах\n2. Татварын нөхөн төлбөрийн хүсэлт бэлтгэх, татварын албанд хүргүүлэх\n3. Татварын байгууллагаас ирүүлсэн тайлбар шаардах бичигт хариу өгөх.',
    feeTitle: '3-р зүйл (Ажлын хөлс ба амжилтын урамшуулал)',
    feeText1: 'Энэхүү үйлчилгээний ажлын хөлс нь амжилтын урамшуулал хэлбэртэй байх бөгөөд татварын албанаас баталгаажуулсан нийт буцаан олголтын дүнг тохирсон хувиар үржүүлж тооцно.',
    feeText2: '• Тохирсон урамшууллын хувь: ',
    feeText3: '• Тооцоолсон буцаан олголт: ',
    feeText4: '• Тооцсон ажлын хөлс: ',
    paymentTitle: '4-р зүйл (Төлбөр төлөх журам ба хугацаа)',
    paymentText: 'А тал нь татварын албанаас буцаан олголтыг авснаас хойш ажлын 3 өдрийн дотор Б талын доорх банкны дансанд ажлын хөлсийг шилжүүлэх үүрэгтэй.\n• Данс: КБ Күүкмин Банк 848601-04-162791\n• Хүлээн авагч: Новель Ди Энд Си',
    dutiesTitle: '5-р зүйл (Нууцлалыг хадгалах үүрэг)',
    dutiesText: '1. Б тал нь А талын ирүүлсэн бичиг баримт, орлогын мэдээллийг зөвхөн татвар нөхөн авах зорилгоор ашиглах бөгөөд гуравдагч этгээдэд задруулахгүй байх үүрэгтэй.\n2. А тал нь шаардлагатай бичиг баримтуудыг үнэн зөвөөр гарган өгөх үүрэгтэй.',
    completionTitle: '6-р зүйл (Гэрээг баталгаажуулж гарын үсэг зурах)',
    completionText: 'Би гэрээний бүх заалтыг шалгаж зөвшөөрсөн тул доор гарын үсэг зурав.',
    sigLabel: 'Захиалагчийн гарын үсэг (Хуруу эсвэл хулганаар)',
    sigClear: 'Арилгах',
    submitBtn: 'Гэрээг илгээж баталгаажуулах',
    submitting: 'Илгээж байна...',
    successTitle: 'Гэрээ баталгаажлаа',
    successText: 'Татварын итгэмжлэлийн гэрээ амжилттай баталгаажлаа. Буцаан олголт авах үйл ажиллагаа найдвартай явагдах болно. Баярлалаа.',
    errorTitle: 'Үйлчлүүлэгчийн мэдээллийн алдаа',
    errorText: 'Үйлчлүүлэгчийн мэдээлэл олдсонгүй эсвэл холбоос хүчингүй байна. Хариуцсан менежертэйгээ холбоо барина уу.',
    sealPlaceholder: '(Татварын итгэмжлэгдсэн төлөөлөгчийн тамга)',
    logoPlaceholder: 'Novel Tax Logo',
    won: 'Вон'
  },
  '미얀마어': {
    title: 'အခွန်ကိုယ်စားလှယ် လုပ်ငန်းဆိုင်ရာ စံသဘောတူညီချက် စာချုပ်',
    subtitle: 'ဤစာချုပ်သည် ဖောက်သည် (ပါတီ A) နှင့် Novel အခွန်ကိုယ်စားလှယ်အေဂျင်စီတို့အကြား ချုပ်ဆိုသော ဝန်ဆောင်မှုစာချုပ်ဖြစ်သည်။',
    clientLabel: 'အပ်နှံသူ (ပါတီ A)',
    agentLabel: 'လက်ခံသူ (ပါတီ B)',
    nameLabel: 'အမည်',
    nationalityLabel: 'နိုင်ငံသား',
    regNumLabel: 'နိုင်ငံခြားသားကတ်အမှတ်/မွေးသက္ကရာဇ်',
    addressLabel: 'မှတ်ပုံတင်ထားသော လိပ်စာ',
    phoneLabel: 'ဖုန်းနံပါတ်',
    companyLabel: 'လုပ်ငန်းခွင်',
    visaLabel: 'ဗီဇာအမျိုးအစား',
    firmNameLabel: 'အေဂျင်စီအမည်',
    firmRepresentativeLabel: 'ကိုယ်စားလှယ်',
    firmNameVal: 'Novel အခွန်နှင့်စာရင်းကိုင်လုပ်ငန်း',
    representativeVal: 'တာဝန်ခံ အခွန်အရာရှိ/စာရင်းကိုင်',
    purposeTitle: 'အပိုဒ် ၁ (ရည်ရွယ်ချက်)',
    purposeText: 'အပ်နှံသူ (ပါတီ A) သည် အခွန်ဥပဒေအရ ကျန်ရှိနေသော အခွန်သက်သာခွင့်များနှင့် ပြန်အမ်းငွေများကို (ဥပမာ- SME အလုပ်အကိုင်လျှော့ပေါ့မှု၊ မှီခိုသူလျှော့ပေါ့မှု၊ လစဉ်အိမ်ငှားခအခွန်နုတ်ယူမှု) ပြန်လည်တောင်းခံရန် အခွန်ပြန်အမ်းငွေ ကိုယ်စားလှယ်လုပ်ငန်းကို လက်ခံသူ (ပါတီ B) ထံ လွှဲအပ်ပါသည။',
    scopeTitle: 'အပိုဒ် ၂ (ဝန်ဆောင်မှုနယ်ပယ်)',
    scopeText: 'ပါတီ B မှ ဆောင်ရွက်မည့် ဝန်ဆောင်မှုများမှာ အောက်ပါအတိုင်းဖြစ်ပါသည် -\n၁။ ပါတီ A ၏ နှစ်အလိုက် အခွန်နုတ်ယူမှု ဖြတ်ပိုင်းများနှင့် ဝင်ငွေမှန်ကန်မှုကို စစ်ဆေးခြင်း\n၂။ အခွန်ပြန်လည်တောင်းခံလွှာကို ရေးသား၍ သက်ဆိုင်ရာအခွန်ရုံးသို့ တင်ပြခြင်း\n၃။ အခွန်ဌာနမှ ရှင်းလင်းချက်တောင်းခံမှုများကို တုံ့ပြန်ဆောင်ရွက်ခြင်း။',
    feeTitle: 'အပိုဒ် ၃ (ဝန်ဆောင်မှုကြေးနှင့် အောင်မြင်မှုကော်မရှင်)',
    feeText1: 'ဤဝန်ဆောင်မှုအတွက် ဝန်ဆောင်မှုကြေးကို အောင်မြင်မှုအပေါ် မူတည်၍ တွက်ချက်မည်ဖြစ်ပြီး၊ အခွန်ရုံးမှ အတည်ပြုပေးသော စုစုပေါင်းပြန်အမ်းငွေ (ဒေသန္တရအခွန်အပါအဝင်) အပေါ် သဘောတူထားသော ရာခိုင်နှုန်းဖြင့် မြှောက်၍ တွက်ချက်ပါမည်။',
    feeText2: '• သဘောတူညီထားသော နှုန်းထား: ',
    feeText3: '• ခန့်မှန်းခြေ စုစုပေါင်းပြန်အမ်းငွေ: ',
    feeText4: '• တွက်ချက်ထားသော ဝန်ဆောင်မှုကြေး: ',
    paymentTitle: 'အပိုဒ် ၄ (ငွေပေးချေမှုဆိုင်ရာ သတ်မှတ်ချက်များ)',
    paymentText: 'ပါတီ A သည် အခွန်ရုံးမှ ပြန်အမ်းငွေကို မိမိဘဏ်အကောင့်ထဲသို့ လက်ခံရရှိသည့်နေ့မှစ၍ အလုပ်ပိတ်ရက်မပါ ၃ ရက်အတွင်း ပါတီ B ၏ အောက်ပါဘဏ်အကောင့်သို့ ဝန်ဆောင်မှုကြေးကို လွှဲပြောင်းပေးရမည်။\n• ဘဏ်အကောင့်: KB Kookmin Bank 848601-04-162791\n• အကောင့်ပိုင်ရှင်: Nobel D&C Co., Ltd.',
    dutiesTitle: 'အပိုဒ် ၅ (လုံခြုံရေးနှင့် သစ္စာစောင့်သိမှု)',
    dutiesText: '1. ပါတီ B သည် ပါတီ A ပေးအပ်သော မည်သူမည်ဝါဖြစ်ကြောင်း သက်သေခံကတ်ပြားနှင့် ဝင်ငွေအချက်အလက်များကို အခွန်ပြန်အမ်းရန်အတွက်သာ အသုံးပြုရမည်ဖြစ်ပြီး ပြင်ပသို့ မပေါက်ကြားစေရပါ။\n2. ပါတီ A သည် ဝန်ဆောင်မှုအောင်မြင်စေရန် လိုအပ်သောစာရွက်စာတမ်းများကို ကူညီပံ့ပိုးပေးရမည်။',
    completionTitle: 'အပိုဒ် ၆ (စာချုပ်ချုပ်ဆိုခြင်းနှင့် လက်မှတ်ရေးထိုးခြင်း)',
    completionText: 'ကျွန်ုပ်သည် ဤစာချုပ်ပါ စည်းကမ်းချက်များအားလုံးကို သေචาစွာ စစ်ဆေးပြီး သဘောတူပါသဖြင့် အောက်တွင် လက်မှတ်ရေးထိုးပါသည်။',
    sigLabel: 'အပ်နှံသူလက်မှတ် (လက်ချောင်း သို့မဟုတ် မောက်စ်ဖြင့်)',
    sigClear: 'ဖျက်ရန်',
    submitBtn: 'လက်မှတ်တင်သွင်းပြီး စာချုပ်ချုပ်ဆိုရန်',
    submitting: 'တင်သွင်းနေပါသည်...',
    successTitle: 'စာချုပ်ချုပ်ဆိုမှု ပြီးမြောက်ပါပြီ',
    successText: 'အခွန်ကိုယ်စားလှယ် စာချုပ်ချုပ်ဆိုခြင်း အောင်မြင်စွာ ပြီးဆုံးပါပြီ။ အခွန်ပြန်အမ်းငွေတောင်းခံခြင်းကို စနစ်တကျ ဆက်လက်ဆောင်ရွက်ပေးပါမည်။ ကျေးဇူးတင်ပါသည်။',
    errorTitle: 'ဖောက်သည်အချက်အလက် အမှား',
    errorText: 'ဖောက်သည်အချက်အလက်ကို ရှာမတွေ့ပါ သို့မဟုတ် လင့်ခ်သက်တမ်းကုန်ဆုံးသွားပါပြီ။ တာဝန်ခံမန်နေဂျာကို ဆက်သွယ်ပါ။',
    sealPlaceholder: '(အခွန်အရာရှိ၏ တရားဝင်တံဆိပ်)',
    logoPlaceholder: 'Novel Tax Logo',
    won: 'ဝမ်'
  },
  '캄보디아어': {
    title: 'កិច្ចសន្យាស្តង់ដារតំណាងពន្ធដារ',
    subtitle: 'កិច្ចសន្យានេះគឺជាកិច្ចព្រមព្រៀងសេវាកម្មរវាងអតិថិជន (ភាគី ក) និងការិយាល័យពន្ធដារ Novel ។',
    clientLabel: 'អតិថិជន (ភាគី ក)',
    agentLabel: 'ភ្នាក់ងារតំណាង (ភាគី ខ)',
    nameLabel: 'ឈ្មោះពេញ',
    nationalityLabel: 'សញ្ជាតិ',
    regNumLabel: 'លេខកាតស្នាក់នៅ/ថ្ងៃខែឆ្នាំកំណើត',
    addressLabel: 'អាសយដ្ឋានចុះឈ្មោះ',
    phoneLabel: 'លេខទូរស័ព្ទ',
    companyLabel: 'កន្លែងធ្វើការ',
    visaLabel: 'ប្រភេទ ទិដ្ឋាការ',
    firmNameLabel: 'ឈ្មោះក្រុមហ៊ុន',
    firmRepresentativeLabel: 'អ្នកតំណាង',
    firmNameVal: 'ភ្នាក់ងារគណនេយ្យនិងពន្ធដារ Novel',
    representativeVal: 'តំណាងភ្នាក់ងារពន្ធដារ',
    purposeTitle: 'មាត្រា ១ (គោលបំណង)',
    purposeText: 'អតិថិជន (ភាគី ក) ប្រគល់សិទ្ធិឱ្យភ្នាក់ងារតំណាង (ភាគី ខ) ធ្វើការស្នើសុំបង្វិលសងពន្ធដែលបានខកខានកន្លងមក (ដូចជា ការកាត់បន្ថយពន្ធសហគ្រាសធុនតូចនិងមធ្យម ការកាត់បន្ថយបន្ទុកគ្រួសារ និងការកាត់កងពន្ធលើថ្លៃផ្ទះប្រចាំខែ) ស្របតាមច្បាប់ពន្ធដារ។',
    scopeTitle: 'មាត្រា ២ (វិសាលភាពនៃសេវាកម្ម)',
    scopeText: 'វិសាលភាពនៃសេវាកម្មដែលអនុវត្តដោយភាគី ខ មានដូចខាងក្រោម៖\n១. ពិនិត្យមើលវិក្កយបត្រពន្ធកាត់ទុក និងភាពត្រឹមត្រូវនៃប្រាក់ចំណូលរបស់ភាគី ក ប្រចាំឆ្នាំ\n២. រៀបចំ និងដាក់លិខិតស្នើសុំបង្វិលសងពន្ធទៅកាន់ការិយាល័យពន្ធដារ\n៣. ឆ្លើយតបចំពោះการសាកសួរ ឬពន្យល់ពីអាជ្ញาធរពន្ធដារ។',
    feeTitle: 'មាត្រា ៣ (កម្រៃសេវា និងភាគលាភជោគជ័យ)',
    feeText1: 'កម្រៃសេវាសម្រាប់សេវាកម្មនេះត្រូវគិតផ្អែកលើលទ្ធផលជោគជ័យ ដោយគណនាដោយគុណទឹកប្រាក់បង្វិលសងសรុប (រួមទាំងពន្ធក្នុងតំបន់) ដែលត្រូវបានបញ្ជាក់ដោយการិយាល័យពន្ធដារ ជាមួយអត្រាកម្រៃសេវាដែលបានព្រមព្រៀង។',
    feeText2: '• អត្រាកម្រៃសេវាព្រมព្រៀង៖ ',
    feeText3: '• ទឹកប្រាក់បង្វិលសងសរុបដែលរំពឹងទុក៖ ',
    feeText4: '• កម្រៃសេវាដែលបានគណនា៖ ',
    paymentTitle: 'មាត្រា ៤ (លក្ខខណ្ឌនៃការទូទាត់)',
    paymentText: 'ភាគី ក ត្រូវផ្ទេរកម្រៃសេវាទៅគណនីធនាគាររបស់ភាគី ខ ខាងក្រោម ក្នុងរយៈពេល ៣ ថ្ងៃនៃថ្ងៃធ្វើការ ចាប់ពីថ្ងៃដែលភាគី ក ទទួលបានប្រាក់បង្វិលសងពន្ធពីการិយាល័យពន្ធដារ។\n• គណនី៖ ធនាគារ KB Kookmin 848601-04-162791\n• ម្ចាស់គណនី៖ Nobel D&C Co., Ltd.',
    dutiesTitle: 'មាត្រា ៥ (ការរក្សាការសម្ងាត់ និងការជឿទុកចិត្ត)',
    dutiesText: '១. ភាគី ខ ត្រូវប្រើប្រាស់ព័ត៌មានផ្ទាល់ខ្លួន និងទិន្នន័យប្រាក់ចំណូលរបស់ភាគី ក សម្រាប់តែគោលបំណងបង្វិលសងពន្ធប៉ុណ្ណោះ និងមិនត្រូវបញ្ចេញឱ្យតីតជនដឹងឡើយ។\n២. ភាគី ក ត្រូវសហការដោយស្មោះត្រង់ក្នុងការផ្តល់ឯកសារចាំបាច់តាមតម្រូវការរបស់ភាគី ខ។',
    completionTitle: 'មាត្រា ៦ (ការចុះហត្ថលេខាលើកិច្ចសន្យា)',
    completionText: 'ខ្ញុំបានពិនិត្យ និងយល់ព្រមលើរាល់លក្ខខណ្ឌទាំងអស់នៃកិច្ចព្រមព្រៀងនេះ ហើយបានចុះហត្ថเลขាខាងក្រោម។',
    sigLabel: 'ហត្ថលេខាអតិថิជន (ដោយប្រើម្រាមដៃ ឬកណ្ដុរ)',
    sigClear: 'លុបសរសេរឡើងវិញ',
    submitBtn: 'ដាក់ស្នើ និងចុះកិច្ចសន្យា',
    submitting: 'កំពុងដាក់ស្នើ...',
    successTitle: 'កិច្ចសន្យាត្រូវបានបញ្ចប់',
    successText: 'កិច្ចសន្យាស្នើសុំបង្វិលសងពន្ធត្រូវបានបញ្ចប់ដោយជោគជ័យ។ ដំណើរការបង្វិលសងពន្ធនឹងប្រព្រឹត្តទៅដោយសុវត្ថិภาพ។ សូមអរគុណ។',
    errorTitle: 'កំហុសព័ត៌មានអតិថិជន',
    errorText: 'រកមិនឃើញព័ត៌មានអតិថិជន ឬតំណភ្ជាប់បានហួសកំណត់។ សូមទាក់ទងអ្នកគ្រប់គ្រងរបស់អ្នក។',
    sealPlaceholder: '(ត្រាផ្លូវการរបស់ភ្នាក់ងារពន្ធដារ)',
    logoPlaceholder: 'Novel Tax Logo',
    won: 'វ៉ុន'
  },
  '네팔어': {
    title: 'कर फिर्ता दाबी मानक सम्झौता',
    subtitle: 'यो सम्झौता ग्राहक (पक्ष क) र नोबेल कर एकाउन्टिंग बीचको कर फिर्ता सम्झौता पत्र हो।',
    clientLabel: 'ग्राहक (पक्ष क)',
    agentLabel: 'कर प्रतिनिधि (पक्ष ख)',
    nameLabel: 'पूरा नाम',
    nationalityLabel: 'राष्ट्रियता',
    regNumLabel: 'विदेशी दर्ता नम्बर/DOB',
    addressLabel: 'दर्ता भएको ठेगाना',
    phoneLabel: 'सम्पर्क नम्बर',
    companyLabel: 'काम गर्ने ठाउँ',
    visaLabel: 'भिषा प्रकार',
    firmNameLabel: 'फर्मको नाम',
    firmRepresentativeLabel: 'प्रतिनिधि',
    firmNameVal: 'नोबेल कर र लेखा एकाउन्टिङ',
    representativeVal: 'प्रतिनिधि कर एकाउन्टेन्ट',
    purposeTitle: 'धारा १ (उद्देश्य)',
    purposeText: 'ग्राहक (पक्ष क) ले कर प्रतिनिधि (पक्ष ख) लाई कर कानून बमोजिम छुटेका कर छुट तथा कटौतीहरू (जस्तै: SME रोजगार छुट, आश्रित छुट, मासिक कोठा भाडा छुट) फिर्ता दाबी गर्ने अधिकार प्रदान गर्दछ।',
    scopeTitle: 'धारा २ (सेवाको दायरा)',
    scopeText: 'पक्ष ख द्वारा प्रदान गरिने सेवाहरू यस प्रकार छन्:\n१. पक्ष क को वर्ष अनुसारको कर कटौती र आम्दानीको जाँच\n२. कर फिर्ता दाबी फारम तयार गरी कर कार्यालयमा पेश गर्ने\n३. कर कार्यालयबाट माग गरिएका स्पष्टीकरणहरूको जवाफ दिने।',
    feeTitle: 'धारा ३ (सेवा शुल्क र सफलता कमिसन)',
    feeText1: 'यो सेवाको शुल्क सफलतामा आधारित हुनेछ, कर कार्यालयले स्वीकृत गरेको कुल फिर्ता रकम (स्थानीय कर सहित) मा तोकिएको प्रतिशत लागू गरी गणना गरिनेछ।',
    feeText2: '• तोकिएको शुल्क दर: ',
    feeText3: '• अनुमानित कुल फिर्ता रकम: ',
    feeText4: '• गणना गरिएको सेवा शुल्क: ',
    paymentTitle: 'धारा ४ (भुक्तानी सर्त र तरिका)',
    paymentText: 'पक्ष क ले कर कार्यालयबाट फिर्ता रकम आफ्नो खातामा प्राप्त गरेको ३ कार्यदिन भित्र पक्ष ख को निम्न खातामा सेवा शुल्क पठाउनुपर्नेछ।\n• खाता नम्बर: KB Kookmin Bank 848601-04-162791\n• खातावालाको नाम: Nobel D&C Co., Ltd.',
    dutiesTitle: 'धारा ५ (सद्भाव र गोपनीयता)',
    dutiesText: '१. पक्ष ख ले पक्ष क को व्यक्तिगत विवरण र कागजातहरू कर फिर्ता दाबीका लागि मात्र प्रयोग गर्नेछ र तेस्रो पक्षलाई दिने छैन।\n२. पक्ष क ले कर फिर्ताका लागि आवश्यक कागजातहरू उपलब्ध गराई सहयोग गर्नुपर्नेछ।',
    completionTitle: 'धारा ६ (सम्झौता कार्यान्वयन र हस्ताक्षर)',
    completionText: 'मैले यस सम्झौताका सबै सर्तहरू पढेर बुझेको छु र सहमत भई हस्ताक्षर गरेको छु।',
    sigLabel: 'ग्राहकको हस्ताक्षर (औंला वा माउस प्रयोग गरेर)',
    sigClear: 'मेट्नुहोस्',
    submitBtn: 'सम्झौता बुझाउनुहोस् र हस्ताक्षर गर्नुहोस्',
    submitting: 'बुझाउँदैछ...',
    successTitle: 'सम्झौता सम्पन्न भयो',
    successText: 'कर फिर्ता दाबी सम्झौता सफलतापूर्वक सम्पन्न भएको छ। कर फिर्ता प्रक्रिया सुरक्षित रूपमा अघि बढाइनेछ। धन्यवाद।',
    errorTitle: 'ग्राहक विवरण त्रुटि',
    errorText: 'ग्राहकको विवरण फेला परेन वा लिङ्क अमान्य छ। कृपया आफ्नो प्रबन्धकलाई सम्पर्क गर्नुहोस्।',
    sealPlaceholder: '(कर एकाउन्टेन्टको छाप)',
    logoPlaceholder: 'Novel Tax Logo',
    won: 'कोरियन वन'
  },
  '방글라데시어': {
    title: 'কর ফেরত দাবির মানসম্মত চুক্তিপত্র',
    subtitle: 'এই চুক্তিপত্রটি গ্রাহক (পক্ষ ক) এবং নোবেল ট্যাক্স অ্যাকাউন্টিং-এর মধ্যে সম্পাদিত একটি সেবা চুক্তি।',
    clientLabel: 'গ্রাহক (পক্ষ ক)',
    agentLabel: 'ট্যাক্স এজেন্ট (পক্ষ খ)',
    nameLabel: 'সম্পূর্ণ নাম',
    nationalityLabel: 'জাতীয়তা',
    regNumLabel: 'এলিয়েন রেজিস্ট্রেশন নম্বর / জন্মতারিখ',
    addressLabel: 'বর্তমান ঠিকানা',
    phoneLabel: 'যোগাযোগ নম্বর',
    companyLabel: 'কর্মস্থল',
    visaLabel: 'ভিসার ধরন',
    firmNameLabel: 'প্রতিষ্ঠানের নাম',
    firmRepresentativeLabel: 'প্রতিনিধি',
    firmNameVal: 'নোবেল ট্যাক্স অ্যান্ড অ্যাকাউন্টিং কর্পোরেশন',
    representativeVal: 'প্রতিনিধি ট্যাক্স অ্যাকাউন্ট্যান্ট',
    purposeTitle: 'অনুচ্ছেদ ১ (উদ্দেশ্য)',
    purposeText: 'গ্রাহক (পক্ষ ক) ট্যাক্স আইন অনুযায়ী বাদ পড়া কর ছাড় বা রিফান্ড (যেমন: এসএমই কর্মসংস্থান ছাড়, নির্ভরশীল পরিবার ছাড়, মাসিক বাড়ি ভাড়া ছাড়) পুনরুদ্ধারের জন্য ট্যাক্স এজেন্ট (পক্ষ খ)-কে দায়িত্ব প্রদান করছেন।',
    scopeTitle: 'অনুচ্ছেদ ২ (কাজের পরিধি)',
    scopeText: 'পক্ষ খ কর্তৃক সম্পাদিত কাজের পরিধি নিম্নরূপ:\n১. পক্ষ ক-এর বার্ষিক ট্যাক্স রিটার্ন ও আয়ের যথাযথতা পরীক্ষা করা\n২. রিফান্ড দাবিপত্র প্রস্তুত করে কর কার্যালয়ে জমা দেওয়া\n৩. কর কর্তৃপক্ষের কোনো ব্যাখ্যার অনুরোধের জবাব দেওয়া।',
    feeTitle: 'অনুচ্ছেদ ৩ (সেবা ফি ও সফলতার কমিশন)',
    feeText1: 'এই সেবার ফি সফলতার ভিত্তিতে নির্ধারিত হবে, যা কর অফিস কর্তৃক অনুমোদিত মোট রিফান্ড পরিমাণের (স্থানীয় করসহ) সাথে সম্মত ফি হার গুণ করে হিসাব করা হবে।',
    feeText2: '• সম্মত ফি হার: ',
    feeText3: '• সম্ভাব্য মোট রিফান্ড: ',
    feeText4: '• হিসাবকৃত সম্ভাব্য ফি: ',
    paymentTitle: 'অনুচ্ছেদ ৪ (পেমেন্ট ও পরিশোধের নিয়ম)',
    paymentText: 'পক্ষ ক কর অফিস বা স্থানীয় সরকার থেকে রিফান্ড পাওয়ার ৩ কর্মদিবসের মধ্যে পক্ষ খ-এর নির্দিষ্ট ব্যাংক অ্যাকাউন্টে ফি পরিশোধ করবেন।\n• অ্যাকাউন্ট: কেবি কুকমিন ব্যাংক 848601-04-162791\n• অ্যাকাউন্টের নাম: Nobel D&C Co., Ltd.',
    dutiesTitle: 'অনুচ্ছেদ ৫ (গোপনীয়তা ও বিশ্বাসযোগ্যতা)',
    dutiesText: '১. পক্ষ খ গ্রাহকের আইডি ও আয়ের তথ্য কেবল কর দাবির কাজেই ব্যবহার করবে এবং অন্য কোথাও প্রকাশ করবে না।\n২. পক্ষ ক প্রয়োজনীয় কাগজপত্র দিয়ে পক্ষ খ-কে সহায়তা করতে সম্মত আছেন।',
    completionTitle: 'অনুচ্ছেদ ৬ (চুক্তিপত্র সম্পাদন ও স্বাক্ষর)',
    completionText: 'আমি চুক্তিপত্রের সব শর্ত যাচাই করেছি এবং সম্মত হয়ে নিচে স্বাক্ষর করেছি।',
    sigLabel: 'গ্রাহকের স্বাক্ষর (আঙুল বা মাউস ব্যবহার করুন)',
    sigClear: 'মুছে ফেলুন',
    submitBtn: 'স্বাক্ষর দিয়ে চুক্তিপত্র জমা দিন',
    submitting: 'জমা দেওয়া হচ্ছে...',
    successTitle: 'চুক্তি সম্পন্ন হয়েছে',
    successText: 'কর ফেরত চুক্তিপত্র সফলভাবে সম্পাদিত হয়েছে। আপনার রিফান্ড প্রক্রিয়াটি নিরাপদভাবে চালানো হবে। ধন্যবাদ।',
    errorTitle: 'গ্রাহকের তথ্যে ত্রুটি',
    errorText: 'গ্রাহকের তথ্য পাওয়া যায়নি অথবা লিঙ্কটি অবৈধ। অনুগ্রহ করে আপনার ম্যানেজারের সাথে যোগাযোগ করুন।',
    sealPlaceholder: '(ট্যাক্স অ্যাকাউন্ট্যান্টের সিল)',
    logoPlaceholder: 'Novel Tax Logo',
    won: 'উওন'
  },
  '우즈베크어': {
    title: 'Soliq qaytarish boʻyicha standart shartnoma',
    subtitle: 'Ushbu shartnoma mijoz (A tomon) va Nobel soliq maslahati firmasi oʻrtasidagi xizmat koʻrsatish kelishuvidir.',
    clientLabel: 'Mijoz (A tomon)',
    agentLabel: 'Vakil (B tomon)',
    nameLabel: 'Toʻliq ism',
    nationalityLabel: 'Fuqarolik',
    regNumLabel: 'ID karta raqami / Tugʻilgan sana',
    addressLabel: 'Roʻyxatdan oʻtgan manzil',
    phoneLabel: 'Telefon raqami',
    companyLabel: 'Ish joyi',
    visaLabel: 'Viza turi',
    firmNameLabel: 'Firma nomi',
    firmRepresentativeLabel: 'Vakil',
    firmNameVal: 'Nobel Soliq va Buxgalteriya Xizmati',
    representativeVal: 'Vakolatli soliq maslahatchisi',
    purposeTitle: '1-modda (Maqsad)',
    purposeText: 'Mijoz (A tomon) soliq qonunchiligiga koʻra oʻtkazib yuborilgan soliq imtiyozlarini (masalan, kichik biznes imtiyozlari, oilaviy imtiyozlar, oylik ijara haqi imtiyozlari) qaytarib olish boʻyicha soliq vakilligi vazifalarini B tomonga topshiradi.',
    scopeTitle: '2-modda (Xizmatlar doirasi)',
    scopeText: 'B tomoni tomonidan koʻrsatiladigan xizmatlar doirasi quyidagilardan iborat:\n1. A tomonining yillik daromadlari va soliq ushlanmalarining toʻgʻriligini tekshirish\n2. Soliqni qaytarish arizalarini tayyorlash va soliq idorasiga topshirish\n3. Soliq organlarining tushuntirish talablariga javob berish.',
    feeTitle: '3-modda (Xizmat haqi va muvaffaqiyatli komissiya)',
    feeText1: 'Ushbu xizmat haqi muvaffaqiyatli natijaga asoslangan boʻlib, soliq idorasi tomonidan tasdiqlangan umumiy qaytarilgan mablagʻ miqdorini (mahalliy soliqlar bilan birga) kelishilgan foiz stavkasiga koʻpaytirish yoʻli bilan hisoblanadi.',
    feeText2: '• Kelishilgan komissiya stavkasi: ',
    feeText3: '• Kutilayotgan umumiy qaytarish summasi: ',
    feeText4: '• Hisoblangan xizmat haqi: ',
    paymentTitle: '4-modda (Toʻlov shartlari va usuli)',
    paymentText: 'A tomoni soliq idorasidan qaytarilgan mablagʻni oʻz hisob raqamiga olgandan boshlab 3 ish kuni ichida xizmat haqini B tomonining quyidagi bank hisobiga oʻtkazishi shart.\n• Bank hisobi: KB Kookmin Bank 848601-04-162791\n• Hisob egasi: Nobel D&C Co., Ltd.',
    dutiesTitle: '5-modda (Maxfiylik va ishonchlilik)',
    dutiesText: '1. B tomoni A tomoni taqdim etgan shaxsiy hujjatlar va daromadlar maʼlumotlarini faqat soliq qaytarish maqsadida ishlatadi va uchinchi shaxslarga bermaydi.\n2. A tomoni kerakli hujjatlarni taqdim etishda toʻliq hamkorlik qiladi.',
    completionTitle: '6-modda (Shartnomani imzolash)',
    completionText: 'Men ushbu shartnomaning barcha shartlarini tekshirdim va rozi boʻlib quyida imzo chekdim.',
    sigLabel: 'Mijoz imzosi (Barmoq yoki sichqoncha yordamida)',
    sigClear: 'Tozalash',
    submitBtn: 'Shartnomani tasdiqlash va imzolash',
    submitting: 'Yuborilmoqda...',
    successTitle: 'Shartnoma imzolandi',
    successText: 'Soliq qaytarish shartnomasi muvaffaqiyatli tuzildi. Soliqni qaytarish jarayoni xavfsiz davom etadi. Rahmat.',
    errorTitle: 'Mijoz maʼlumotida xatolik',
    errorText: 'Mijoz maʼlumotlari topilmadi yoki havola haqiqiy emas. Menejeringizga murojaat qiling.',
    sealPlaceholder: '(Soliq maslahatchisining muhri)',
    logoPlaceholder: 'Novel Tax Logo',
    won: 'Von'
  },
  '파키스탄어': {
    title: 'ٹیکس ریفنڈ کلیم کا معیاری معاہدہ',
    subtitle: 'یہ معاہدہ کسٹمر (فریق اول) اور نوبل ٹیکس اکاؤنٹنگ کے درمیان سروس معاہدہ ہے۔',
    clientLabel: 'کسٹمر (فریق اول/الف)',
    agentLabel: 'ٹیکس ایجنٹ (فریق دوم/ب)',
    nameLabel: 'مکمل نام',
    nationalityLabel: 'قومیت',
    regNumLabel: 'غیر ملکی شناختی کارڈ نمبر / تاریخ پیدائش',
    addressLabel: 'موجودہ پتہ',
    phoneLabel: 'رابطہ نمبر',
    companyLabel: 'کام کی جگہ',
    visaLabel: 'ویزہ کی قسم',
    firmNameLabel: 'ادارے کا نام',
    firmRepresentativeLabel: 'نمائندہ',
    firmNameVal: 'نوبل ٹیکس اینڈ اکاؤنٹنگ کارپوریشن',
    representativeVal: 'نمائندہ ٹیکس اکاؤنٹنٹ',
    purposeTitle: 'دفعہ ۱ (مقصد)',
    purposeText: 'کسٹمر (فریق اول) ٹیکس قانون کے مطابق رہ جانے والی ٹیکس کٹوتیوں اور ریفنڈ (جیسے: چھوٹے کاروباری اداروں کے ٹیکس ریفنڈ، زیر کفالت افراد پر ٹیکس ریلیف، ماہانہ رہائشی کرایہ ریلیف) کی واپسی کے لیے ٹیکس ایجنٹ (فریق دوم) کو ذمہ داری تفویض کرتا ہے۔',
    scopeTitle: 'دفعہ ۲ (کام کا دائرہ کار)',
    scopeText: 'فریق دوم کی طرف سے انجام دیے جانے والے کام کا دائرہ درج ذیل ہے:\n1۔ فریق اول کے سالانہ ٹیکس ریٹرن اور آمدنی کی جانچ پڑتال\n2۔ ریفنڈ کا دعویٰ تیار کرکے ٹیکس آفس میں جمع کرانا\n3۔ ٹیکس حکام کی جانب سے کسی وضاحت کی درخواست کا جواب دینا۔',
    feeTitle: 'دفعہ ۳ (سروس فیس اور کامیابی کا کمیشن)',
    feeText1: 'اس سروس کی فیس کامیابی پر مبنی ہوگی، جو ٹیکس آفس کی طرف سے منظور شدہ کل ریفنڈ کی رقم (بشمول مقامی ٹیکس) کو طے شدہ شرح سے ضرب دے کر حاصل کی جائے گی۔',
    feeText2: '• طے شدہ فیس کی شرح: ',
    feeText3: '• ممکنہ کل ریفنڈ: ',
    feeText4: '• حساب شدہ ممکنہ فیس: ',
    paymentTitle: 'دفعہ ۴ (ادائیگی کی شرائط اور طریقہ کار)',
    paymentText: 'فریق اول ٹیکس آفس یا مقامی حکومت سے ریفنڈ حاصل کرنے کے 3 کاروباری دنوں کے اندر فریق دوم کے مخصوص بینک اکاؤنٹ میں فیس منتقل کرے گا۔\n• اکاؤنٹ نمبر: KB Kookmin Bank 848601-04-162791\n• اکاؤنٹ ہولڈر: Nobel D&C Co., Ltd.',
    dutiesTitle: 'دفعہ ۵ (رازداری اور ایمانداری)',
dutiesText: '1۔ فریق دوم کسٹمر کی شناختی معلومات اور آمدنی کی تفصیلات صرف ٹیکس ریفنڈ کے مقصد کے لیے استعمال کرے گا اور فریق ثالث کو فراہم نہیں کرے گا۔\n2۔ فریق اول درکار دستاویزات فراہم کرنے میں فریق دوم کے ساتھ مکمل تعاون کرے گا۔',
    completionTitle: 'دفعہ ۶ (معاہدہ پر دستخط اور منظوری)',
    completionText: 'میں نے معاہدے کی تمام شرائط کو چیک کر لیا ہے اور متفق ہو کر نیچے دستخط کیے ہیں۔',
    sigLabel: 'گاہک کے دستخط (انگلی یا ماؤس استعمال کریں)',
    sigClear: 'مٹائیں',
    submitBtn: 'معاہدہ جمع کریں اور دستخط کریں',
    submitting: 'جمع ہو رہا ہے...',
    successTitle: 'معاہدہ مکمل ہو گیا',
    successText: 'ٹیکس ریفنڈ کا معاہدہ کامیابی کے ساتھ مکمل ہو گیا ہے۔ آپ کا ریفنڈ کا عمل محفوظ طریقے سے چلایا جائے گا۔ شکریہ۔',
    errorTitle: 'کسٹمر کی معلومات میں غلطی',
    errorText: 'کسٹمر کی معلومات نہیں ملیں یا لنک ختم ہو گیا ہے۔ براہ کرم اپنے مینیجر سے رابطہ کریں۔',
    sealPlaceholder: '(ٹیکس اکاؤنٹنٹ کی مہر)',
    logoPlaceholder: 'Novel Tax Logo',
    won: 'وون'
  },
  '태국어': {
    title: 'สัญญามาตรฐานตัวแทนยื่นขอคืนภาษี',
    subtitle: 'สัญญานี้เป็นข้อตกลงการบริการระหว่างลูกค้า (ผู้ว่าจ้าง) และสำนักงานบัญชีและภาษีโนเบล (ผู้รับจ้าง)',
    clientLabel: 'ผู้ว่าจ้าง (ฝ่าย ก)',
    agentLabel: 'ผู้รับจ้าง (ฝ่าย ข)',
    nameLabel: 'ชื่อ-นามสกุล',
    nationalityLabel: 'สัญชาติ',
    regNumLabel: 'เลขทะเบียนต่างด้าว/วันเกิด',
    addressLabel: 'ที่อยู่ตามบัตรต่างด้าว',
    phoneLabel: 'เบอร์โทรศัพท์',
    companyLabel: 'สถานที่ทำงาน',
    visaLabel: 'ประเภทวีซ่า',
    firmNameLabel: 'ชื่อสำนักงาน',
    firmRepresentativeLabel: 'ผู้แทน',
    firmNameVal: 'สำนักงานบัญชีและภาษีโนเบล',
    representativeVal: 'ตัวแทนนักบัญชีภาษีอากร',
    purposeTitle: 'ข้อ 1 (วัตถุประสงค์)',
    purposeText: 'ผู้ว่าจ้าง (ฝ่าย ก) มอบหมายให้ผู้รับจ้าง (ฝ่าย ข) ดำเนินการยื่นขอคืนภาษีย้อนหลังสำหรับสิทธิประโยชน์ทางภาษีที่ตกหล่น (เช่น การลดหย่อนภาษี SME, การลดหย่อนค่าลดหย่อนครอบครัว, สิทธิลดหย่อนค่าเช่าบ้านรายเดือน) ตามกฎหมายภาษีอากร',
    scopeTitle: 'ข้อ 2 (ขอบเขตงาน)',
    scopeText: 'ขอบเขตของงานบริการโดยฝ่าย ข มีดังนี้:\n1. ตรวจสอบเอกสารหักภาษี ณ ที่จ่าย และรายได้ของผู้ว่าจ้างเป็นรายปี\n2. จัดเตรียมและยื่นคำขอคืนภาษีต่อสรรพากร\n3. ชี้แจงข้อมูลต่อกรมสรรพากรกรณีมีการขอข้อมูลเพิ่มเติม',
    feeTitle: 'ข้อ 3 (ค่าบริการและค่าความสำเร็จ)',
    feeText1: 'ค่าบริการนี้คิดตามความสำเร็จของงาน โดยคำนวณจากจำนวนเงินภาษีที่ได้รับคืนจริงทั้งหมด (รวมภาษีท้องถิ่น) คูณด้วยอัตราค่าบริการที่ตกลงกันไว้',
    feeText2: '• อัตราค่าบริการที่ตกลงกันไว้: ',
    feeText3: '• ยอดเงินขอคืนภาษีที่คาดว่าจะได้รับจริง: ',
    feeText4: '• ค่าบริการที่คำนวณได้จริง: ',
    paymentTitle: 'ข้อ 4 (เงื่อนไขและวิธีการชำระเงิน)',
    paymentText: 'ฝ่าย ก จะต้องโอนค่าบริการไปยังบัญชีธนาคารของฝ่าย ข ด้านล่างนี้ ภายใน 3 วันทำการ นับจากวันที่ได้รับเงินคืนภาษีจากกรมสรรพากรเข้าบัญชีแล้ว\n• บัญชีธนาคาร: KB Kookmin Bank 848601-04-162791\n• ชื่อบัญชี: Nobel D&C Co., Ltd.',
    dutiesTitle: 'ข้อ 5 (การรักษาความลับและความซื่อสัตย์)',
    dutiesText: '1. ฝ่าย ข จะใช้ข้อมูลส่วนบุคคลและรายได้ของฝ่าย ก เพื่อวัตถุประสงค์ในการยื่นขอคืนภาษีเท่านั้น และจะไม่เปิดเผยข้อมูลต่อบุคคลภายนอก\n2. ฝ่าย ก จะให้ความร่วมมือในการจัดเตรียมเอกสารที่ฝ่าย ข ร้องขอตามความเป็นจริง',
    completionTitle: 'ข้อ 6 (การลงนามในสัญญา)',
    completionText: 'ฉันได้อ่านเงื่อนไขทั้งหมดในสัญญานี้และยอมรับเงื่อนไขทั้งหมดจึงลงลายมือชื่อด้านล่างนี้',
    sigLabel: 'ลายเซ็นลูกค้า (ใช้นิ้วหรือเมาส์)',
    sigClear: 'ล้างลายเซ็น',
    submitBtn: 'ส่งข้อมูลและลงชื่อในสัญญา',
    submitting: 'กำลังส่งข้อมูล...',
    successTitle: 'สัญญาเสร็จสมบูรณ์แล้ว',
    successText: 'สัญญาตัวแทนยื่นขอคืนภาษีได้รับการลงนามเสร็จสมบูรณ์แล้ว การดำเนินการจะเสร็จสิ้นอย่างปลอดภัยที่สุด ขอขอบคุณ',
    errorTitle: 'ข้อมูลลูกค้าไม่ถูกต้อง',
    errorText: 'ไม่พบข้อมูลลูกค้าหรือลิงก์หมดอายุแล้ว กรุณาติดต่อผู้จัดการของคุณ',
    sealPlaceholder: '(ตราประทับตัวแทนภาษี)',
    logoPlaceholder: 'Novel Tax Logo',
    won: 'วอน'
  },
  '필리핀어': {
    title: 'Standard na Kasunduan sa Pagbawi ng Buwis',
    subtitle: 'Ang kasunduang ito ay isang kontrata ng serbisyo sa pagitan ng kliyente (Client) at Novel Tax Accounting.',
    clientLabel: 'Kliyente (Unang Panig/A)',
    agentLabel: 'Ahente ng Buwis (Ikalawang Panig/B)',
    nameLabel: 'Buong Pranlan',
    nationalityLabel: 'Nasyonalidad',
    regNumLabel: 'Numero ng ARC / Araw ng Kapanganakan',
    addressLabel: 'Rehistradong Address',
    phoneLabel: 'Numero ng Telepono',
    companyLabel: 'Tempat Kerja',
    visaLabel: 'Uri ng Visa',
    firmNameLabel: 'Pangalan ng Firma',
    firmRepresentativeLabel: 'Kinatawan',
    firmNameVal: 'Novel Tax & Accounting Corp.',
    representativeVal: 'Kinatawan ng Akuntan ng Buwis',
    purposeTitle: 'Artikulo 1 (Layunin)',
    purposeText: 'Ang Kliyente (Panig A) ay nagtatalaga sa Ahente (Panig B) ng serbisyo sa pagbawi ng buwis upang makuha muli ang mga nakaligtaang bawas sa buwis (tulad ng bawas sa trabaho sa SME, bawas sa mga dependent, credit sa buwanang upa) sa ilalim ng mga batas sa buwis.',
    scopeTitle: 'Artikulo 2 (Saklaw ng Serbisyo)',
    scopeText: 'Ang saklaw ng mga serbisyong gagawin ng Panig B ay ang mga sumusunod:\n1. Pagsusuri sa taunang withholding tax receipts at kawastuhan ng kita ng Panig A\n2. Paghahanda at pagsumite ng mga aplikasyon sa pagbawi sa opisina ng buwis\n3. Pagsagot sa mga kahilingan para sa paliwanag mula sa mga awtoridad sa buwis.',
    feeTitle: 'Artikulo 3 (Bayad sa Serbisyo at Komisyon sa Tagumpay)',
    feeText1: 'Ang bayad sa serbisyong ito ay batay sa komisyon sa tagumpay, na kinakalkula sa pamamagitan ng pagpaparami ng kabuuang halaga ng refund (kasama ang lokal na buwis) na kinumpirma ng opisina ng buwis sa napagkasunduang rate.',
    feeText2: '• Napagkasunduang Rate ng Bayad: ',
    feeText3: '• Inaasahang Kabuuang Refund: ',
    feeText4: '• Kinakalkulang Inaasahang Bayad: ',
    paymentTitle: 'Artikulo 4 (Mga Tuntunin at Paraan ng Pagbabayad)',
    paymentText: 'Dapat ilipat ng Panig A ang bayad sa itinalagang bank account ng Panig B sa ibaba sa loob ng 3 araw ng negosyo mula sa petsa kung kailan natanggap ng Panig A o pumasok sa account ang refund mula sa opisina ng buwis.\n• Account: KB Kookmin Bank 848601-04-162791\n• May-ari ng Account: Nobel D&C Co., Ltd.',
    dutiesTitle: 'Artikulo 5 (Mabuting Paniniwala at Pagiging Lihim)',
    dutiesText: '1. Gagamitin ng Panig B ang ID at mga detalye ng kita na ibinigay ng Panig A para lamang sa layunin ng pagbawi ng buwis at hindi ito ibabahagi sa ibang tao.\n2. Makikipagtulungan ang Panig A sa pagbibigay ng mga dokumentong hiniling ng Panig B.',
    completionTitle: 'Artikulo 6 (Paglagda at Pagpapatupad)',
    completionText: 'Napatunayan at sumasang-ayon ako sa lahat ng mga tuntunin ng kasunduang ito at lumagda sa ibaba.',
    sigLabel: 'Lagda ng Kliyente (Gamit ang daliri o mouse)',
    sigClear: 'Burahin',
    submitBtn: 'Isumite at Lagdaan ang Kasunduan',
    submitting: 'Ipinapadala...',
    successTitle: 'Kasunduan ay Tapos Na',
    successText: 'Ang Kasunduan sa Pagbawi ng Buwis ay matagumpay na naisagawa. Ang proseso ng refund ay tatakbo nang ligtas. Salamat.',
    errorTitle: 'Maling Impormasyon ng Kliyente',
    errorText: 'Hindi nahanap ng impormasyon ng kliyente o expire na ang link. Mangyaring makipag-ugnayan sa iyong manager.',
    sealPlaceholder: '(Tatak ng Akuntan ng Buwis)',
    logoPlaceholder: 'Novel Tax Logo',
    won: 'KRW'
  },
  '스리랑카어': {
    title: 'බදු මුදල් ආපසු ලබා ගැනීමේ නියෝජිත සම්මත ගිවිසුම',
    subtitle: 'මෙම ගිවිසුම පාරිභෝගිකයා (පළමු පාර්ශවය) සහ නොබෙල් බදු ගිණුම්කරණ ආයතනය අතර සේවා ගිවිසුමකි.',
    clientLabel: 'සේවාදායකයා (ක පාර්ශවය)',
    agentLabel: 'බදු නියෝජිතයා (ඛ පාර්ශවය)',
    nameLabel: 'සම්පූර්ණ නම',
    nationalityLabel: 'ජාතිකත්වය',
    regNumLabel: 'විදේශික ලියාපදිංචි අංකය / උපන් දිනය',
    addressLabel: 'ලියාපදිංචි ලිපිනය',
    phoneLabel: 'දුරකථන අංකය',
    companyLabel: 'සේවා ස්ථානය',
    phoneComp: 'දුරකථන සේවා සපයන්නා',
    visaLabel: 'වීසා වර්ගය',
    firmNameLabel: 'ආයතනයේ නම',
    firmRepresentativeLabel: 'නියෝජිතයා',
    firmNameVal: 'නොබෙල් බදු සහ ගිණුම්කරණ සංස්ථාව',
    representativeVal: 'නියෝජිත බදු ගණකාධිකාරීවරයා',
    purposeTitle: '1 වන වගන්තිය (අරමුණ)',
    purposeText: 'සේවාදායකයා (ක පාර්ශවය) බදු නීති යටතේ මඟ හැරුණු බදු සහන සහ ආපසු ගෙවීම් (උදා: සුළු පරිමාණ ව්‍යවසාය රැකියා බදු සහන, යැපෙන්නන්ගේ බදු සහන, මාසික නිවාස කුලී බදු සහන) ආපසු ලබා ගැනීම සඳහා බදු නියෝජිතයා (ඛ පාර්ශවය) වෙත බලය පවරයි.',
    scopeTitle: '2 වන වගන්තිය (සේවා විෂය පථය)',
    scopeText: 'ඛ පාර්ශවය විසින් ඉටු කරනු ලබන සේවා විෂය පථය පහත පරිදි වේ:\n1. ක පාර්ශවයේ වාර්ෂික බදු ගෙවීම් සහ ආදායම් නිරවද්‍යතාවය පරීක්ෂා කිරීම\n2. බදු ආපසු ලබා ගැනීමේ අයදුම්පත සකස් කර බදු කාර්යාලයට ඉදිරිපත් කිරීම\n3. බදු බලධාරීන්ගෙන් විමසන කරුණු සඳහා පැහැදිලි කිරීම් ලබා දීම.',
    feeTitle: '3 වන වගන්තිය (සේවා ගාස්තු සහ සාර්ථකත්ව කොමිස් මුදල)',
    feeText1: 'මෙම සේවාව සඳහා ගาස්තුව සාර්ථකත්වය මත පදනම් වන අතර, බදු කාර්යාලය විසින් අනුමත කරන ලද මුළු ආපසු ලැබෙන මුදලෙන් (දේශීය බදු ඇතුළුව) එකඟ වූ ප්‍රතිශතයක් ගණනය කරනු ලැබේ.',
    feeText2: '• එකඟ වූ ගාස්තු ප්‍රතිශතය: ',
    feeText3: '• බලාපොරොත්තු වන මුළු ආපසු ලැබෙන මුදල: ',
    feeText4: '• ගණනය කළ සේවා ගාස්තුව: ',
    paymentTitle: '4 වන වගන්තිය (ගෙවීම් නියමයන් සහ ක්‍රමවේදය)',
    paymentText: 'ක පාර්ශවය බදු කාර්යාලයෙන් බදු ආපසු ලැබෙන මුදල තමාගේ ගිණුමට ලැබී වැඩ කරන දින 3ක් ඇතුළත ඛ පාර්ශවයේ පහත සඳහන් බැංකු ගิණුමට සේවා ගාස්තුව ගෙවිය යුතුය.\n• ගිණුම් අංකය: KB Kookmin Bank 848601-04-162791\n• ගිණුම් හිමියාගේ නම: Nobel D&C Co., Ltd.',
    dutiesTitle: '5 වන වගන්තිය (රහස්‍යභාවය රැකීම)',
    dutiesText: '1. ඛ පාර්ශවය විසින් සේවාදායකයාගේ පුද්ගලික තොරතුරු සහ ලේඛන බදු ආපසු ලබා ගැනීමේ අරමුණ සඳහා පමණක් භාවිතා කරන අතර තෙවන පාර්ශවයකට ලබා නොදේ.\n2. ක පාර්ශවය බදු ආපසු ලබා ගැනීමට අවශ්‍ය ලේඛන ලබා දෙමින් සහයෝගය දැක්විය යුතුය.',
    completionTitle: '6 වන වගන්තිය (ගිවිසුම අත්සන් කිරීම)',
    completionText: 'මම මෙම ගිවිසුමේ සියලුම කොන්දේසි පරීක්ෂා කර එකඟ වී පහතින් අත්සන් තැබුවෙමි.',
    sigLabel: 'සේවාදායකයාගේ අත්සන (ඇඟිල්ලෙන් හෝ මවුසයෙන් අත්සන් කරන්න)',
    sigClear: 'මකන්න',
    submitBtn: 'අත්සන යොමු කර ගිවිසුම සම්පූර්ණ කරන්න',
    submitting: 'යොමු කරමින්...',
    successTitle: 'ගිවිසුම සාර්ථකව අවසන් කරන ලදී',
    successText: 'බදු මුදල් ආපසු ලබා ගැනීමේ ගිවිසුම සාර්ථකව අවසන් කර ඇත. ආපසු ලබා ගැනීමේ ක්‍රියාවලිය ආරක්ෂිතව සිදු කෙරේ. ස්තූතියි.',
    errorTitle: 'පාරිභෝගික තොරතුරු දෝෂයකි',
    errorText: 'පාරිභෝගිකයාගේ තොරතුරු සොයාගත නොහැක හෝ සබැඳිය වලංගු නොවේ. කරුණාකර ඔබේ කළමනාකරු අමතන්න.',
    sealPlaceholder: '(බදු ගණකාධිකාරීවරයාගේ නිල මුද්‍රාව)',
    logoPlaceholder: 'Novel Tax Logo',
    won: 'වොන්'
  }
};

export function ContractPage({ token }: ContractPageProps) {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('한국어');
  const [expectedRefund, setExpectedRefund] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  // Load client data & calculate total expected refund across 5 years
  useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await fetchClientByConsentToken(token);
      if (data) {
        setClient(data);
        
        // Get language parameter from URL if available, else auto-detect from client country
        const params = new URLSearchParams(window.location.search);
        const urlLang = params.get('lang') || params.get('l');
        
        if (urlLang && CONTRACT_LANG_CODES[urlLang]) {
          setSelectedLanguage(urlLang);
        } else {
          if (data.country === '베트남') setSelectedLanguage('베트남어');
          else if (data.country === '인도네시아') setSelectedLanguage('인도네시아어');
          else if (data.country === '몽골') setSelectedLanguage('몽골어');
          else if (data.country === '미얀마') setSelectedLanguage('미얀마어');
          else if (data.country === '캄보디아') setSelectedLanguage('캄보디아어');
          else if (data.country === '네팔') setSelectedLanguage('네팔어');
          else if (data.country === '방글라데시') setSelectedLanguage('방글라데시어');
          else if (data.country === '우즈베키스탄') setSelectedLanguage('우즈베크어');
          else if (data.country === '파키스탄') setSelectedLanguage('파키스탄어');
          else if (data.country === '태국') setSelectedLanguage('태국어');
          else if (data.country === '필리핀') setSelectedLanguage('필리핀어');
          else if (data.country === '스리랑카') setSelectedLanguage('스리랑카어');
          else if (data.country && data.country !== '대한민국' && data.country !== '한국') setSelectedLanguage('영어');
          else setSelectedLanguage('한국어');
        }

        // Fetch YearEndData to summarize total expected refunds
        try {
          const { data: yearsList } = await supabase
            .from('YearEndData')
            .select(`
              id, year, companyName, netSalary, calculatedTax, determinedTax, changedDeterminedTax,
              totalTaxRefund, localTaxRefund,
              rentRefundExpectNational, rentRefundExpectLocal, rentRefundTotal,
              dependentsCount, seniorCount, disabledCount, childCount,
              freelancerActive, freelancerNetSalary, freelancerDeterminedTax, freelancerLocalTax,
              freelancerRefundExpectNational, freelancerRefundExpectLocal
            `)
            .eq('clientId', data.id);
          
          if (yearsList && yearsList.length > 0) {
            // Reconstruct the regForm state structure for calculateCombinedRefund
            const reconstructedRegForm: any = {
              nationality: data.country || '인도네시아',
              isMonthlyRent: data.isMonthlyTenant ? '가' : '부',
              rentAllHouseholdsNoHouse: data.rentAllHouseholdsNoHouse || '부',
              monthlyRentFee: String(data.monthlyRentFee || 0),
              dependentsCount: data.dependentsCount || 0,
              seniorCount: data.seniorCount || 0,
              disabledCount: data.disabledCount || 0,
              childCount: data.childCount || 0,
              years: [],
              freelancerYears: {}
            };

            const targetYears = ['2021', '2022', '2023', '2024', '2025'];
            targetYears.forEach(yr => {
              reconstructedRegForm.freelancerYears[yr] = {
                active: false,
                totalIncome: '0',
                withholdingTax3: '0',
                localTax03: '0',
                refundExpectNational: '0',
                refundExpectLocal: '0'
              };
            });

            yearsList.forEach(y => {
              const yrStr = String(y.year);
              if (!y.freelancerActive) {
                reconstructedRegForm.years.push({
                  id: String(y.id),
                  year: yrStr,
                  active: true,
                  salaryTotal: String(y.netSalary || 0),
                  taxBase: String(y.calculatedTax || 0),
                  decisionTax: String(y.determinedTax || 0),
                  decisionTaxApplyAmt: String(y.changedDeterminedTax || 0),
                  refundExpectNational: String(y.totalTaxRefund || 0),
                  refundExpectLocal: String(y.localTaxRefund || 0),
                  childDeduction: String((y as any).childDeduction || 0),
                  childReductionApply: (y as any).childReductionApply || 'Y',
                  rentRefundExpectNational: String(y.rentRefundExpectNational || 0),
                  rentRefundExpectLocal: String(y.rentRefundExpectLocal || 0),
                  rentRefundTotal: String(y.rentRefundTotal || 0),
                  dependentsCount: y.dependentsCount,
                  seniorCount: y.seniorCount,
                  disabledCount: y.disabledCount,
                  childCount: y.childCount
                });
              } else {
                reconstructedRegForm.freelancerYears[yrStr] = {
                  active: true,
                  totalIncome: String(y.freelancerNetSalary || 0),
                  withholdingTax3: String(y.freelancerDeterminedTax || 0),
                  localTax03: String(y.freelancerLocalTax || 0),
                  refundExpectNational: String(y.freelancerRefundExpectNational || 0),
                  refundExpectLocal: String(y.freelancerRefundExpectLocal || 0)
                };
              }
            });

            let total = 0;
            targetYears.forEach(yr => {
              const combinedRes = calculateCombinedRefund(reconstructedRegForm, yr, Number(data.feeRate) || 22);
              const hasWage = reconstructedRegForm.years.some((y: any) => String(y.year) === yr && y.active);
              const isActive = hasWage || reconstructedRegForm.freelancerYears[yr]?.active;
              if (isActive) {
                total += combinedRes.finalRefund;
              }
            });

            setExpectedRefund(total);
          }
        } catch (err) {
          console.warn('Failed to summarize expected refunds:', err);
        }
      }
      setLoading(false);
    }
    load();
  }, [token]);

  // Setup signature canvas styling
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

  const t = CONTRACT_TRANSLATIONS[selectedLanguage] || CONTRACT_TRANSLATIONS['한국어'];

  // Signature drawing logic
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

  // Submit contract signature
  const handleSubmit = async () => {
    if (!client) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas is empty
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      alert(selectedLanguage === '영어' ? 'Please complete your signature.' : '서명을 작성해 주세요.');
      return;
    }

    setSubmitting(true);
    const signatureBase64 = canvas.toDataURL('image/png');

    const res = await updateClientContract(client.id, signatureBase64);
    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
    } else {
      alert(`제출 실패 / Submission Failed: ${res.error}`);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#475569' }}>
          <div style={{ border: '4px solid #cbd5e1', borderTop: '4px solid #2563eb', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Loading...</div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px', fontFamily: 'sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>{t.errorTitle}</h3>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>{t.errorText}</p>
        </div>
      </div>
    );
  }

  const numericFeeRate = Number(client.feeRate) || 22;
  const feeMethod = client.feeMethod || '후불 22%';
  
  let prepaidRate = 0;
  let postpaidRate = 0;
  
  // Regex to match "선불 10%, 후불 10%" or similar hybrid structures
  const hybridMatch = feeMethod.match(/선불\s*(\d+)%?,\s*후불\s*(\d+)%?/);
  if (hybridMatch) {
    prepaidRate = Number(hybridMatch[1]);
    postpaidRate = Number(hybridMatch[2]);
  } else if (feeMethod.includes('선불')) {
    const prepaidMatch = feeMethod.match(/선불\s*(\d+)%?/);
    prepaidRate = prepaidMatch ? Number(prepaidMatch[1]) : numericFeeRate;
    postpaidRate = 0;
  } else {
    prepaidRate = 0;
    const postpaidMatch = feeMethod.match(/후불\s*(\d+)%?/);
    postpaidRate = postpaidMatch ? Number(postpaidMatch[1]) : numericFeeRate;
  }

  const totalFeeRate = prepaidRate + postpaidRate;
  const calculatedFee = Math.round(expectedRefund * (totalFeeRate / 100));
  const prepaidAmt = Math.round(expectedRefund * (prepaidRate / 100));
  const postpaidAmt = Math.round(expectedRefund * (postpaidRate / 100));

  // Dynamic Fee clause generator
  const getDynamicFeeText = (lang: string, prepRate: number, postRate: number) => {
    if (prepRate > 0 && postRate > 0) {
      if (lang === '한국어') {
        return '본 경정청구 용역의 대가는 선불 및 성공보수 후불 혼합 방식으로 하며, 신청 시의 선불 수수료와 국세청으로부터 환급(결정)이 확정된 총 환급금액(지방세 포함)에 대한 후불 성공보수를 각각 합산한 금액으로 한다.';
      } else {
        return 'The fee for this service shall be a hybrid of a prepaid fee and a success postpaid fee, calculated as the sum of the prepaid portion and the postpaid success portion based on the final refund amount.';
      }
    } else if (prepRate > 0) {
      if (lang === '한국어') {
        return '본 경정청구 용역의 대가는 선불 방식으로 하며, 예상 환급금액에 약정 수수료율을 곱하여 산정된 금액을 경정청구 진행 전에 납부하는 것으로 한다.';
      } else {
        return 'The fee for this service shall be paid upfront (prepaid), calculated by multiplying the expected refund amount by the agreed fee rate before the filing process begins.';
      }
    } else {
      if (lang === '한국어') {
        return '본 경정청구 용역의 대가는 성공보수 후불 방식으로 하며, 국세청으로부터 환급(결정)이 확정된 총 환급금액(지방세 포함)에 약정 수수료율을 곱한 금액으로 한다.';
      } else {
        return 'The fee for this service shall be on a success-fee basis (postpaid), calculated by multiplying the total refund amount (including local tax) confirmed by the tax authorities by the agreed fee rate.';
      }
    }
  };

  // Dynamic Payment clause generator
  const getDynamicPaymentText = (lang: string, prepRate: number, postRate: number) => {
    const bankDetails = lang === '영어' 
      ? '\n• Bank: KB Kookmin Bank 848601-04-162791\n• Depositor: Nobel D&C Co., Ltd.'
      : '\n• 입금 계좌: 국민은행 848601-04-162791\n• 예금주: (주)노벨디앤씨';

    if (prepRate > 0 && postRate > 0) {
      if (lang === '한국어') {
        return `의뢰인(갑)은 세무 경정청구 신청 접수 전에 약정된 선불 수수료(${prepRate}%)에 해당하는 금액을 송금하고, 국세청 및 지자체로부터 환급금을 본인 계좌로 수령한 날로부터 3영업일 이내에 약정된 후불 수수료(${postRate}%)를 아래 입금 계좌로 송금해야 한다.${bankDetails}`;
      } else {
        return `Party A shall transfer the prepaid portion (${prepRate}%) before the claim is filed, and the postpaid portion (${postRate}%) within 3 business days after receiving the tax refund from the authorities, to Party B's designated bank account below.${bankDetails}`;
      }
    } else if (prepRate > 0) {
      if (lang === '한국어') {
        return `의뢰인(갑)은 세무 경정청구 신청 접수 전에 약정된 선불 수수료(${prepRate}%)에 해당하는 금액을 수임인(을)이 지정한 아래 입금 계좌로 송금해야 한다.${bankDetails}`;
      } else {
        return `Party A shall transfer the prepaid fee (${prepRate}%) to Party B's designated bank account below before the tax rectification claim is filed.${bankDetails}`;
      }
    } else {
      if (lang === '한국어') {
        return `의뢰인(갑)은 국세청 및 지자체로부터 세금 환급금을 본인 계좌로 수령한 날로부터 3영업일 이내에 수임인(을)이 지정한 아래 입금 계좌로 수수료를 송금해야 한다.${bankDetails}`;
      } else {
        return `Party A shall transfer the fee to Party B's designated bank account below within 3 business days from the date Party A receives the tax refund from the tax office or local government.${bankDetails}`;
      }
    }
  };

  const feeDescriptionText = getDynamicFeeText(selectedLanguage, prepaidRate, postpaidRate);
  const paymentText = getDynamicPaymentText(selectedLanguage, prepaidRate, postpaidRate);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', boxSizing: 'border-box', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '580px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        
        {/* Header Section */}
        <div style={{ padding: '24px 20px', backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'center', position: 'relative' }}>
          
          {/* 🏷️ Placeholder: 세무사 로고 / CI 등록 예정지 */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#38bdf8', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>
              N
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', border: '1px dashed rgba(148, 163, 184, 0.4)', padding: '2px 8px', borderRadius: '4px' }}>
              {t.logoPlaceholder}
            </div>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#38bdf8' }}>{t.title}</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>{t.subtitle}</p>

          {/* Language Selector */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px', flexWrap: 'wrap' }}>
            {Object.keys(CONTRACT_TRANSLATIONS).map(lang => (
              <button 
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                style={{ 
                  border: 'none', 
                  background: selectedLanguage === lang ? '#38bdf8' : 'rgba(255,255,255,0.1)', 
                  color: selectedLanguage === lang ? '#0f172a' : '#cbd5e1',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {CONTRACT_LANG_CODES[lang] || lang}
              </button>
            ))}
          </div>
        </div>

        {success ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px' }}>{t.successTitle}</h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 32px 0', wordBreak: 'keep-all' }}>
              {t.successText}
            </p>
            <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '16px', fontWeight: 'bold' }}>
              NOVEL TAX LAW FIRM
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', boxSizing: 'border-box' }}>
            
            {/* 1. Parties Info Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              
              {/* 甲: 의뢰인 */}
              <div style={{ fontSize: '13px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', color: '#2563eb', marginBottom: '6px' }}>{t.clientLabel}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px', color: '#334155' }}>
                  <span>• {t.nameLabel}:</span> <span style={{ fontWeight: 'bold' }}>{client.name || '-'}</span>
                  <span>• {t.nationalityLabel}:</span> <span>{client.country || '-'}</span>
                  <span>• {t.regNumLabel}:</span> <span>{client.regNum || '-'}</span>
                  <span>• {t.companyLabel}:</span> <span>{client.company || '-'}</span>
                  <span>• {t.visaLabel}:</span> <span>{client.visa || '-'}</span>
                </div>
              </div>

              {/* 乙: 수임인 */}
              <div style={{ fontSize: '13px', paddingTop: '4px' }}>
                <div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '6px' }}>{t.agentLabel}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px', color: '#334155', position: 'relative' }}>
                  <span>• {t.firmNameLabel}:</span> <span>{t.firmNameVal}</span>
                  <span>• {t.firmRepresentativeLabel}:</span> 
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {t.representativeVal}
                    
                    {/* 🔴 Placeholder: 세무사 직인 자리 */}
                    <div style={{ 
                      width: '45px', 
                      height: '45px', 
                      borderRadius: '50%', 
                      border: '2px dashed #ef4444', 
                      color: '#ef4444', 
                      fontSize: '8px', 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      transform: 'rotate(-10deg)',
                      fontWeight: 'bold',
                      lineHeight: '1.1',
                      padding: '2px',
                      boxSizing: 'border-box',
                      backgroundColor: 'rgba(239, 68, 68, 0.05)'
                    }}>
                      <span>노벨세무</span>
                      <span style={{ fontSize: '7px' }}>{t.sealPlaceholder}</span>
                    </div>
                  </span>
                </div>
              </div>

            </div>

            {/* 2. Contract Terms Details */}
            <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', marginBottom: '20px', backgroundColor: '#fafafa' }}>
              
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#0f172a' }}>{t.purposeTitle}</h4>
                <p style={{ margin: 0, color: '#475569', wordBreak: 'keep-all' }}>{t.purposeText}</p>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#0f172a' }}>{t.scopeTitle}</h4>
                <p style={{ margin: 0, color: '#475569', whiteSpace: 'pre-line' }}>{t.scopeText}</p>
              </div>

               <div style={{ marginBottom: '14px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#0f172a' }}>{t.feeTitle}</h4>
                <p style={{ margin: '0 0 6px 0', color: '#475569', wordBreak: 'keep-all' }}>{feeDescriptionText}</p>
                <div style={{ backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#0f172a', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>{t.feeText2} <strong>{totalFeeRate}% ({feeMethod})</strong></div>
                  {prepaidRate > 0 && <div>• {selectedLanguage === '영어' ? 'Prepaid portion' : '선불금액'} ({prepaidRate}%): <strong>{prepaidAmt.toLocaleString()} {t.won}</strong></div>}
                  {postpaidRate > 0 && <div>• {selectedLanguage === '영어' ? 'Postpaid portion' : '후불금액'} ({postpaidRate}%): <strong>{postpaidAmt.toLocaleString()} {t.won}</strong></div>}
                  <div>{t.feeText3} <strong>{expectedRefund.toLocaleString()} {t.won}</strong></div>
                  <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '4px', marginTop: '4px' }}>{t.feeText4} <strong style={{ color: '#2563eb', fontSize: '13px' }}>{calculatedFee.toLocaleString()} {t.won}</strong></div>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#0f172a' }}>{t.paymentTitle}</h4>
                <p style={{ margin: 0, color: '#475569', whiteSpace: 'pre-line' }}>{paymentText}</p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#0f172a' }}>{t.dutiesTitle}</h4>
                <p style={{ margin: 0, color: '#475569', whiteSpace: 'pre-line' }}>{t.dutiesText}</p>
              </div>

            </div>

            {/* 3. Signature & Canvas Section */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>✍️ {t.sigLabel}</span>
                <button 
                  type="button" 
                  onClick={clearCanvas} 
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontWeight: 'bold'
                  }}
                >
                  {t.sigClear}
                </button>
              </div>
              
              <canvas
                ref={canvasRef}
                width={540}
                height={160}
                style={{
                  width: '100%',
                  height: '160px',
                  display: 'block',
                  backgroundColor: '#ffffff',
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
            </div>

            {/* Submit Actions */}
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                backgroundColor: submitting ? '#94a3b8' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)',
                transition: 'all 0.2s'
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
