// Contract multi-language templates storage and manager utilities
import { supabase } from './supabaseClient';

export const CONTRACT_LANG_CODES: Record<string, string> = {
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

export const BANK_DETAILS_MAP: Record<string, { bank: string; depositor: string }> = {
  '한국어': { bank: '• 입금 계좌: 기업은행 540-049052-04-010', depositor: '• 예금주: 한결금융컨설팅' },
  '영어': { bank: '• Bank Account: IBK (Industrial Bank of Korea) 540-049052-04-010', depositor: '• Account Holder: Hangyeol Financial Consulting' },
  '베트남어': { bank: '• Tài khoản ngân hàng: IBK (Ngân hàng Công nghiệp Hàn Quốc) 540-049052-04-010', depositor: '• Chủ tài khoản: Hangyeol Financial Consulting' },
  '인도네시아어': { bank: '• Rekening Bank: IBK (Industrial Bank of Korea) 540-049052-04-010', depositor: '• Pemilik Rekening: Hangyeol Financial Consulting' },
  '몽골어': { bank: '• Банкны данс: IBK (Солонгосын Аж үйлдвэрийн банк) 540-049052-04-010', depositor: '• Дансны эзэмшигч: Hangyeol Financial Consulting' },
  '미얀마어': { bank: '• ဘဏ်အကောင့်: IBK (Industrial Bank of Korea) 540-049052-04-010', depositor: '• အကောင့်ပိုင်ရှင်: Hangyeol Financial Consulting' },
  '캄보디아어': { bank: '• គណនីធនាគារ: IBK (Industrial Bank of Korea) 540-049052-04-010', depositor: '• ម្ចាស់គណនី: Hangyeol Financial Consulting' },
  '네팔어': { bank: '• बैंक खाता: IBK (Industrial Bank of Korea) 540-049052-04-010', depositor: '• खातावाला: Hangyeol Financial Consulting' },
  '방글라데시어': { bank: '• ব্যাংক অ্যাকাউন্ট: IBK (Industrial Bank of Korea) 540-049052-04-010', depositor: '• অ্যাকাউন্টের নাম: Hangyeol Financial Consulting' },
  '우즈베크어': { bank: '• Bank hisobi: IBK (Koreya Sanoat Banki) 540-049052-04-010', depositor: '• Hisob egasi: Hangyeol Financial Consulting' },
  '파키스탄어': { bank: '• بینک اکاؤنٹ: IBK (Industrial Bank of Korea) 540-049052-04-010', depositor: '• اکاؤنٹ ہولڈر: Hangyeol Financial Consulting' },
  '태국어': { bank: '• บัญชีธนาคาร: IBK (Industrial Bank of Korea) 540-049052-04-010', depositor: '• ชื่อบัญชี: Hangyeol Financial Consulting' },
  '필리핀어': { bank: '• Bank Account: IBK (Industrial Bank of Korea) 540-049052-04-010', depositor: '• Account Holder: Hangyeol Financial Consulting' },
  '스리랑카어': { bank: '• බැංකු ගිණුම: IBK (Industrial Bank of Korea) 540-049052-04-010', depositor: '• ගිණුම් හිමියා: Hangyeol Financial Consulting' }
};

export const PREPAID_LABEL_MAP: Record<string, string> = {
  '한국어': '선불금액',
  '영어': 'Prepaid Amount',
  '베트남어': 'Số tiền trả trước',
  '인도네시아어': 'Jumlah Uang Muka',
  '몽골어': 'Урьдчилгаа төлбөр',
  '미얀마어': 'ကြိုတင်ပေးငွေ',
  '캄보디아어': 'ប្រាក់បង់មុន',
  '네팔어': 'अग्रिम रकम',
  '방글라데시어': 'অগ্রিম পরিমাণ',
  '우즈베크어': 'Oldindan toʻlov',
  '파키스탄어': 'پیشگی رقم',
  '태국어': 'จำนวนเงินล่วงหน้า',
  '필리핀어': 'Halaga ng Paunang Bayad',
  '스리랑카어': 'පූර්ව ගෙවීම් මුදල'
};

export const POSTPAID_LABEL_MAP: Record<string, string> = {
  '한국어': '후불금액',
  '영어': 'Postpaid Amount',
  '베트남어': 'Số tiền trả sau',
  '인도네시아어': 'Jumlah Pascabayar',
  '몽골어': 'Дараа төлбөр',
  '미얀마어': 'နောက်မှပေးငွေ',
  '캄보디아어': 'ប្រាក់បង់ក្រោយ',
  '네팔어': 'पछिल्लो रकम',
  '방글라데시어': 'পরবর্তী পরিশোধ',
  '우즈베크어': 'Keyin toʻlanadigan summa',
  '파키스탄어': 'بعد میں ادائیگی کی رقم',
  '태국어': 'จำนวนเงินชำระทีหลัง',
  '필리핀어': 'Halaga ng Huling Bayad',
  '스리랑카어': 'පසු ගෙවීම් මුදල'
};

export const DEFAULT_CONTRACT_TRANSLATIONS: Record<string, Record<string, string>> = {
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
    feeText1: '본 경정청구 용역의 대가는 성공보수 후불 방식으로 하며, 국세청으로부터 환급(결정)이 확정된 총 환급금액(지방세 포함)에 약정 수수료율을 곱한 금액으로 한다.',
    feeText2: '• 약정 수수료율: ',
    feeText3: '• 예상 총 환급금액: ',
    feeText4: '• 계산된 예상 수수료 (원화): ',
    paymentTitle: '제4조 (지급 기한 및 방식)',
    paymentText: '갑은 국세청 및 지자체로부터 세금 환급금을 본인 계좌로 수령한 날로부터 3영업일 이내에 을이 지정한 아래 입금 계좌로 수수료를 송금해야 한다.\n• 입금 계좌: 기업은행 540-049052-04-010\n• 예금주: 한결금융컨설팅',
    dutiesTitle: '제5조 (신의성실 및 비밀유지)',
    dutiesText: '1. 을은 갑이 제공한 신분증 및 소득 자료를 경정청구 목적으로만 성실히 사용해야 하며, 절대 제3자에게 유출하거나 다른 목적으로 사용해서는 안 된다.\n2. 갑은 경정청구 진행을 위해 을이 요청하는 서류(외국인등록증, 가족관계증명서, 월세 내역 등)를 성실히 협조하여 제공해야 한다.',
    completionTitle: '제6조 (계약의 체결 및 동의 확약)',
    completionText: '본인은 위 계약의 모든 조항 및 개인정보 처리에 관한 내용을 충분히 숙지하고 동의하며, 이에 성실히 서명하여 본 계약을 체결합니다.',
    dateLabel: '계약 체결 일자',
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
    paymentText: 'Party A shall transfer the fee to Party B\'s designated bank account below within 3 business days from the date Party A receives the tax refund from the tax office/local government.\n• Account: IBK (Industrial Bank of Korea) 540-049052-04-010\n• Depositor: Hangyeol Financial Consulting',
    dutiesTitle: 'Article 5 (Good Faith & Confidentiality)',
    dutiesText: '1. Party B shall use the ID and income details provided by Party A strictly for the purpose of tax rectification and shall never leak them to third parties.\n2. Party A shall cooperate in good faith to provide documents requested by Party B.',
    completionTitle: 'Article 6 (Execution & Signatures)',
    completionText: 'I have verified and agreed to all terms of this agreement and signed below.',
    dateLabel: 'Date of Execution',
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
    paymentText: 'Bên A có trách nhiệm chuyển phí dịch vụ vào tài khoản ngân hàng của Bên B trong vòng 3 ngày làm việc kể từ ngày Bên A nhận được tiền hoàn thuế từ cơ quan thuế.\n• Tài khoản: Ngân hàng IBK (Industrial Bank of Korea) 540-049052-04-010\n• Chủ tài khoản: Hangyeol Financial Consulting',
    dutiesTitle: 'Điều 5 (Cam kết bảo mật & Trung thực)',
    dutiesText: '1. Bên B cam kết bảo mật tuyệt đối thông tin cá nhân và tài liệu thu nhập của Bên A cung cấp, chỉ sử dụng cho mục đích yêu cầu hoàn thuế.\n2. Bên A cam kết cung cấp trung thực và đầy đủ các tài liệu cần thiết theo yêu cầu của Bên B.',
    completionTitle: 'Điều 6 (Ký kết hợp đồng)',
    completionText: 'Tôi đã kiểm tra và hoàn toàn đồng ý với các điều khoản trong hợp đồng này.',
    dateLabel: 'Ngày ký hợp đồng',
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
    paymentText: 'Pihak A harus mentransfer komisi ke rekening bank Pihak B di bawah ini dalam waktu 3 hari kerja sejak tanggal Pihak A menerima pengembalian pajak dari kantor pajak.\n• Rekening: Bank IBK (Industrial Bank of Korea) 540-049052-04-010\n• Pemilik Rekening: Hangyeol Financial Consulting',
    dutiesTitle: 'Pasal 5 (Itikad Baik & Kerahasiaan)',
    dutiesText: '1. Pihak B harus menggunakan dokumen identitas dan rincian pendapatan yang diberikan oleh Pihak A hanya untuk tujuan pengembalian pajak dan tidak membocorkannya kepada pihak ketiga.\n2. Pihak A harus bekerja sama dengan itikad baik untuk menyediakan dokumen yang diminta.',
    completionTitle: 'Pasal 6 (Penandatanganan & Persetujuan)',
    completionText: 'Saya telah memeriksa dan menyetujui semua ketentuan perjanjian ini dan menandatanganinya di bawah ini.',
    dateLabel: 'Tanggal Penandatanganan',
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
    paymentText: 'А тал нь татварын албанаас буцаан олголтыг авснаас хойш ажлын 3 өдрийн дотор Б талын доорх банкны дансанд ажлын хөлсийг шилжүүлэх үүрэгтэй.\n• Данс: ИБК (Аж үйлдвэрийн банк) 540-049052-04-010\n• Хүлээн авагч: Хангёль Санхүүгийн Зөвлөх (Hangyeol Financial Consulting)',
    dutiesTitle: '5-р зүйл (Нууцлалыг хадгалах үүрэг)',
    dutiesText: '1. Б тал нь А талын ирүүлсэн бичиг баримт, орлогын мэдээллийг зөвхөн татвар нөхөн авах зорилгоор ашиглах бөгөөд гуравдагч этгээдэд задруулахгүй байх үүрэгтэй.\n2. А тал нь шаардлагатай бичиг баримтуудыг үнэн зөвөөр гарган өгөх үүрэгтэй.',
    completionTitle: '6-р зүйл (Гэрээг баталгаажуулж гарын үсэг зурах)',
    completionText: 'Би гэрээний бүх заалтыг шалгаж зөвшөөрсөн тул доор гарын үсэг зурав.',
    dateLabel: 'Гэрээ байгуулсан огноо',
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
    paymentText: 'ပါတီ A သည် အခွန်ရုံးမှ ပြန်အမ်းငွေကို မိမိဘဏ်အကောင့်ထဲသို့ လက်ခံရရှိသည့်နေ့မှစ၍ အလုပ်ပိတ်ရက်မပါ ၃ ရက်အတွင်း ပါတီ B ၏ အောက်ပါဘဏ်အကောင့်သို့ ဝန်ဆောင်မှုကြေးကို လွှဲပြောင်းပေးရမည်။\n• ဘဏ်အကောင့်: IBK (Industrial Bank of Korea) 540-049052-04-010\n• အကောင့်ပိုင်ရှင်: Hangyeol Financial Consulting',
    dutiesTitle: 'အပိုဒ် ၅ (လုံခြုံရေးနှင့် သစ္စာစောင့်သိမှု)',
    dutiesText: '1. ပါတီ B သည် ပါတီ A ပေးအပ်သော မည်သူမည်ဝါဖြစ်ကြောင်း သက်သေခံကတ်ပြားနှင့် ဝင်ငွေအချက်အလက်များကို အခွန်ပြန်အမ်းရန်အတွက်သာ အသုံးပြုရမည်ဖြစ်ပြီး ပြင်ပသို့ မပေါက်ကြားစေရပါ။\n2. ပါတီ A သည် ဝန်ဆောင်မှုအောင်မြင်စေရန် လိုအပ်သောစာရွက်စာတမ်းများကို ကူညီပံ့ပိုးပေးရမည်။',
    completionTitle: 'အပိုဒ် ၆ (စာချုပ်ချုပ်ဆိုခြင်းနှင့် လက်မှတ်ရေးထိုးခြင်း)',
    completionText: 'ကျွန်ုပ်သည် ဤစာချုပ်ပါ စည်းကမ်းချက်များအားလုံးကို သေချာစွာ စစ်ဆေးပြီး သဘောတူပါသဖြင့် အောက်တွင် လက်မှတ်ရေးထိုးပါသည်။',
    dateLabel: 'စာချုပ်ချုပ်ဆိုသည့်နေ့စွဲ',
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
    scopeText: 'វិសាលភាពនៃសេវាកម្មដែលអនុវត្តដោយភាគី ខ មានដូចខាងក្រោម៖\n១. ពិនិត្យមើលវិក្កយបត្រពន្ធកាត់ទុក និងភាពត្រឹមត្រូវនៃប្រាក់ចំណូលរបស់ភាគី ក ប្រចាំឆ្នាំ\n២. រៀបចំ និងដាក់លិខិតស្នើសុំបង្វិលសងពន្ធទៅកាន់ការិយាល័យពន្ធដារ\n៣. ឆ្លើយតបចំពោះការសាកសួរ ឬពន្យល់ពីអាជ្ញាធរពន្ធដារ។',
    feeTitle: 'មាត្រា ៣ (កម្រៃសេវា និងភាគលាភជោគជ័យ)',
    feeText1: 'កម្រៃសេវាសម្រាប់សេវាកម្មនេះត្រូវគិតផ្អែកលើលទ្ធផលជោគជ័យ ដោយគណនាដោយគុណទឹកប្រាក់បង្វិលសងសរុប (រួមទាំងពន្ធក្នុងតំបន់) ដែលត្រូវបានបញ្ជាក់ដោយការិយាល័យពន្ធដារ ជាមួយអត្រាកម្រៃសេវាដែលបានព្រមព្រៀង។',
    feeText2: '• អត្រាកម្រៃសេវាព្រមព្រៀង៖ ',
    feeText3: '• ទឹកប្រាក់បង្វិលសងសរុបដែលរំពឹងទុក៖ ',
    feeText4: '• កម្រៃសេវាដែលបានគណនា៖ ',
    paymentTitle: 'មាត្រា ៤ (លក្ខខណ្ឌនៃការទូទាត់)',
    paymentText: 'ភាគី ក ត្រូវផ្ទេរកម្រៃសេវាទៅគណនីធនាគាររបស់ភាគី ខ ខាងក្រោម ក្នុងរយៈពេល ៣ ថ្ងៃនៃថ្ងៃធ្វើការ ចាប់ពីថ្ងៃដែលភាគី ក ទទួលបានប្រាក់បង្វិលសងពន្ធពីការិយាល័យពន្ធដារ។\n• គណនី៖ IBK (Industrial Bank of Korea) 540-049052-04-010\n• ម្ចាស់គណនី៖ Hangyeol Financial Consulting',
    dutiesTitle: 'មាត្រា ៥ (ការរក្សាការសម្ងាត់ និងការជឿទុកចិត្ត)',
    dutiesText: '១. ភាគី ខ ត្រូវប្រើប្រាស់ព័ត៌មានផ្ទាល់ខ្លួន និងទិន្នន័យប្រាក់ចំណូលរបស់ភាគី ក សម្រាប់តែគោលបំណងបង្វិលសងពន្ធប៉ុណ្ណោះ និងមិនត្រូវបញ្ចេញឱ្យតតិយជនដឹងឡើយ។\n២. ភាគី ក ត្រូវសហការដោយស្មោះត្រង់ក្នុងការផ្តល់ឯកសារចាំបាច់តាមតម្រូវការរបស់ភាគី ខ។',
    completionTitle: 'មាត្រា ៦ (ការចុះហត្ថលេខាលើកិច្ចសន្យា)',
    completionText: 'ខ្ញុំបានពិនិត្យ និងយល់ព្រមលើរាល់លក្ខខណ្ឌទាំងអស់នៃកិច្ចព្រមព្រៀងនេះ ហើយបានចុះហត្ថលេខាខាងក្រោម។',
    dateLabel: 'កាលបរិច្ឆេទចុះកិច្ចសន្យា',
    sigLabel: 'ហត្ថលេខាអតិថិជន (ដោយប្រើម្រាមដៃ ឬកណ្ដុរ)',
    sigClear: 'លុបសរសេរឡើងវិញ',
    submitBtn: 'ដាក់ស្នើ និងចុះកិច្ចសន្យា',
    submitting: 'កំពុងដាក់ស្នើ...',
    successTitle: 'កិច្ចសន្យាត្រូវបានបញ្ចប់',
    successText: 'កិច្ចសន្យាស្នើសុំបង្វិលសងពន្ធត្រូវបានបញ្ចប់ដោយជោគជ័យ។ ដំណើរការបង្វិលសងពន្ធនឹងប្រព្រឹត្តទៅដោយសុវត្ថិភាព។ សូមអរគុណ។',
    errorTitle: 'កំហុសព័ត៌មានអតិថិជន',
    errorText: 'រកមិនឃើញព័ត៌មានអតិថិជន ឬតំណភ្ជាប់បានហួសកំណត់។ សូមទាក់ទងអ្នកគ្រប់គ្រងរបស់អ្នក។',
    sealPlaceholder: '(ត្រាផ្លូវការរបស់ភ្នាក់ងារពន្ធដារ)',
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
    paymentText: 'पक्ष क ले कर कार्यालयबाट फिर्ता रकम आफ्नो खातामा प्राप्त गरेको ३ कार्यदिन भित्र पक्ष ख को निम्न खातामा सेवा शुल्क पठाउनुपर्नेछ।\n• खाता नम्बर: IBK (Industrial Bank of Korea) 540-049052-04-010\n• खातावालाको नाम: Hangyeol Financial Consulting',
    dutiesTitle: 'धारा ५ (सद्भाव र गोपनीयता)',
    dutiesText: '१. पक्ष ख ले पक्ष क को व्यक्तिगत विवरण र कागजातहरू कर फिर्ता दाबीका लागि मात्र प्रयोग गर्नेछ र तेस्रो पक्षलाई दिने छैन।\n२. पक्ष क ले कर फिर्ताका लागि आवश्यक कागजातहरू उपलब्ध गराई सहयोग गर्नुपर्नेछ।',
    completionTitle: 'धारा ६ (सम्झौता कार्यान्वयन र हस्ताक्षर)',
    completionText: 'मैले यस सम्झौताका सबै सर्तहरू पढेर बुझेको छु र सहमत भई हस्ताक्षर गरेको छु।',
    dateLabel: 'सम्झौता मिति',
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
    paymentText: 'পক্ষ ক কর অফিস বা স্থানীয় সরকার থেকে রিফান্ড পাওয়ার ৩ কর্মদিবসের মধ্যে পক্ষ খ-এর নির্দিষ্ট ব্যাংক অ্যাকাউন্টে ফি পরিশোধ করবেন।\n• অ্যাকাউন্ট: IBK (Industrial Bank of Korea) 540-049052-04-010\n• অ্যাকাউন্টের নাম: Hangyeol Financial Consulting',
    dutiesTitle: 'অনুচ্ছেদ ৫ (গোপনীয়তা ও বিশ্বাসযোগ্যতা)',
    dutiesText: '১. পক্ষ খ গ্রাহকের আইডি ও আয়ের তথ্য কেবল কর দাবির কাজেই ব্যবহার করবে এবং অন্য কোথাও প্রকাশ করবে না।\n২. পক্ষ ক প্রয়োজনীয় কাগজপত্র দিয়ে পক্ষ খ-কে সহায়তা করতে সম্মত আছেন।',
    completionTitle: 'অনুচ্ছেদ ৬ (চুক্তিপত্র সম্পাদন ও স্বাক্ষর)',
    completionText: 'আমি চুক্তিপত্রের সব শর্ত যাচাই করেছি এবং সম্মত হয়ে নিচে স্বাক্ষর করেছি।',
    dateLabel: 'চুক্তি স্বাক্ষরের তারিখ',
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
    paymentText: 'A tomoni soliq idorasidan qaytarilgan mablagʻni oʻz hisob raqamiga olgandan boshlab 3 ish kuni ichida xizmat haqini B tomonining quyidagi bank hisobiga oʻtkazishi shart.\n• Bank hisobi: IBK (Industrial Bank of Korea) 540-049052-04-010\n• Hisob egasi: Hangyeol Financial Consulting',
    dutiesTitle: '5-modda (Maxfiylik va ishonchlilik)',
    dutiesText: '1. B tomoni A tomoni taqdim etgan shaxsiy hujjatlar va daromadlar maʼlumotlarini faqat soliq qaytarish maqsadida ishlatadi va uchinchi shaxslarga bermaydi.\n2. A tomoni kerakli hujjatlarni taqdim etishda toʻliq hamkorlik qiladi.',
    completionTitle: '6-modda (Shartnomani imzolash)',
    completionText: 'Men ushbu shartnomaning barcha shartlarini tekshirdim va rozi boʻlib quyida imzo chekdim.',
    dateLabel: 'Shartnoma tuzilgan sana',
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
    paymentText: 'فریق اول ٹیکس آفس یا مقامی حکومت سے ریفنڈ حاصل کرنے کے 3 کاروباری دنوں کے اندر فریق دوم کے مخصوص بینک اکاؤنٹ میں فیس منتقل کرے گا۔\n• اکاؤنٹ نمبر: IBK (Industrial Bank of Korea) 540-049052-04-010\n• اکاؤنٹ ہولڈر: Hangyeol Financial Consulting',
    dutiesTitle: 'دفعہ ۵ (رازداری اور ایمانداری)',
    dutiesText: '1۔ فریق دوم کسٹمر کی شناختی معلومات اور آمدنی کی تفصیلات صرف ٹیکس ریفنڈ کے مقصد کے لیے استعمال کرے گا اور فریق ثالث کو فراہم نہیں کرے گا۔\n2۔ فریق اول درکار دستاویزات فراہم کرنے میں فریق دوم کے ساتھ مکمل تعاون کرے گا۔',
    completionTitle: 'دفعہ ۶ (معاہدہ پر دستخط اور منظوری)',
    completionText: 'میں نے معاہدے کی تمام شرائط کو چیک کر لیا ہے اور متفق ہو کر نیچے دستخط کیے ہیں۔',
    dateLabel: 'معاہدے کی تاریخ',
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
    paymentText: 'ฝ่าย ก จะต้องโอนค่าบริการไปยังบัญชีธนาคารของฝ่าย ข ด้านล่างนี้ ภายใน 3 วันทำการ นับจากวันที่ได้รับเงินคืนภาษีจากกรมสรรพากรเข้าบัญชีแล้ว\n• บัญชีธนาคาร: IBK (Industrial Bank of Korea) 540-049052-04-010\n• ชื่อบัญชี: Hangyeol Financial Consulting',
    dutiesTitle: 'ข้อ 5 (การรักษาความลับและความซื่อสัตย์)',
    dutiesText: '1. ฝ่าย ข จะใช้ข้อมูลส่วนบุคคลและรายได้ของฝ่าย ก เพื่อวัตถุประสงค์ในการยื่นขอคืนภาษีเท่านั้น และจะไม่เปิดเผยข้อมูลต่อบุคคลภายนอก\n2. ฝ่าย ก จะให้ความร่วมมือในการจัดเตรียมเอกสารที่ฝ่าย ข ร้องขอตามความเป็นจริง',
    completionTitle: 'ข้อ 6 (การลงนามในสัญญา)',
    completionText: 'ฉันได้อ่านเงื่อนไขทั้งหมดในสัญญานี้และยอมรับเงื่อนไขทั้งหมดจึงลงลายมือชื่อด้านล่างนี้',
    dateLabel: 'วันที่ทำสัญญา',
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
    nameLabel: 'Buong Pangalan',
    nationalityLabel: 'Nasyonalidad',
    regNumLabel: 'Numero ng ARC / Araw ng Kapanganakan',
    addressLabel: 'Rehistradong Address',
    phoneLabel: 'Numero ng Telepono',
    companyLabel: 'Lugar ng Trabaho',
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
    paymentText: 'Dapat ilipat ng Panig A ang bayad sa itinalagang bank account ng Panig B sa ibaba sa loob ng 3 araw ng negosyo mula sa petsa kung kailan natanggap ng Panig A o pumasok sa account ang refund mula sa opisina ng buwis.\n• Account: IBK (Industrial Bank of Korea) 540-049052-04-010\n• May-ari ng Account: Hangyeol Financial Consulting',
    dutiesTitle: 'Artikulo 5 (Mabuting Paniniwala at Pagiging Lihim)',
    dutiesText: '1. Gagamitin ng Panig B ang ID at mga detalye ng kita na ibinigay ng Panig A para lamang sa layunin ng pagbawi ng buwis at hindi ito ibabahagi sa ibang tao.\n2. Makikipagtulungan ang Panig A sa pagbibigay ng mga dokumentong hiniling ng Panig B.',
    completionTitle: 'Artikulo 6 (Paglagda at Pagpapatupad)',
    completionText: 'Napatunayan at sumasang-ayon ako sa lahat ng mga tuntunin ng kasunduang ito at lumagda sa ibaba.',
    dateLabel: 'Petsa ng Kasunduan',
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
    feeText1: 'මෙම සේවාව සඳහා ගාස්තුව සාර්ථකත්වය මත පදනම් වන අතර, බදු කාර්යාලය විසින් අනුමත කරන ලද මුළු ආපසු ලැබෙන මුදලෙන් (දේශීය බදු ඇතුළුව) එකඟ වූ ප්‍රතිශතයක් ගණනය කරනු ලැබේ.',
    feeText2: '• එකඟ වූ ගාස්තු ප්‍රතිශතය: ',
    feeText3: '• බලාපොරොත්තු වන මුළු ආපසු ලැබෙන මුදල: ',
    feeText4: '• ගණනය කළ සේවා ගාස්තුව: ',
    paymentTitle: '4 වන වගන්තිය (ගෙවීම් නියමයන් සහ ක්‍රමවේදය)',
    paymentText: 'ක පාර්ශවය බදු කාර්යාලයෙන් බදු ආපසු ලැබෙන මුදල තමාගේ ගිණුමට ලැබී වැඩ කරන දින 3ක් ඇතුළත ඛ පාර්ශවයේ පහත සඳහන් බැංකු ගිණුමට සේවා ගාස්තුව ගෙවිය යුතුය.\n• ගිණුම් අංකය: IBK (Industrial Bank of Korea) 540-049052-04-010\n• ගිණුම් හිමියාගේ නම: Hangyeol Financial Consulting',
    dutiesTitle: '5 වන වගන්තිය (රහස්‍යභාවය රැකීම)',
    dutiesText: '1. ඛ පාර්ශවය විසින් සේවාදායකයාගේ පුද්ගලික තොරතුරු සහ ලේඛන බදු ආපසු ලබා ගැනීමේ අරමුණ සඳහා පමණක් භාවිතා කරන අතර තෙවන පාර්ශවයකට ලබා නොදේ.\n2. ක පාර්ශවය බදු ආපසු ලබා ගැනීමට අවශ්‍ය ලේඛන ලබා දෙමින් සහයෝගය දැක්විය යුතුය.',
    completionTitle: '6 වන වගන්තිය (ගිවිසුම අත්සන් කිරීම)',
    completionText: 'මම මෙම ගිවිසුමේ සියලුම කොන්දේසි පරීක්ෂා කර එකඟ වී පහතින් අත්සන් තැබුවෙමි.',
    dateLabel: 'ගිවිසුම් දිනය',
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

const STORAGE_KEY = 'novel_custom_contract_translations_v2';
const SUPABASE_STORAGE_PATH = 'contract_templates/novel_contract_templates.json';

// In-memory cached translations
let memoryCachedTranslations: Record<string, Record<string, string>> | null = null;

// Get current effective translations (merging saved custom edits over defaults)
export function getStoredContractTranslations(): Record<string, Record<string, string>> {
  if (memoryCachedTranslations) return memoryCachedTranslations;
  if (typeof window === 'undefined') return DEFAULT_CONTRACT_TRANSLATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONTRACT_TRANSLATIONS;
    const parsed = JSON.parse(raw);
    const result: Record<string, Record<string, string>> = {};
    for (const lang of Object.keys(DEFAULT_CONTRACT_TRANSLATIONS)) {
      result[lang] = {
        ...DEFAULT_CONTRACT_TRANSLATIONS[lang],
        ...(parsed[lang] || {})
      };
    }
    memoryCachedTranslations = result;
    return result;
  } catch (e) {
    console.error('Failed to read contract translations from localStorage:', e);
    return DEFAULT_CONTRACT_TRANSLATIONS;
  }
}

// Fetch latest contract translations from Supabase Cloud Storage
export async function fetchContractTranslationsFromSupabase(): Promise<Record<string, Record<string, string>>> {
  try {
    const { data, error } = await supabase.storage
      .from('novel_pdf')
      .download(SUPABASE_STORAGE_PATH);

    if (error || !data) {
      // If file doesn't exist yet in Supabase, return local / default
      return getStoredContractTranslations();
    }

    const text = await data.text();
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      const merged: Record<string, Record<string, string>> = {};
      for (const lang of Object.keys(DEFAULT_CONTRACT_TRANSLATIONS)) {
        merged[lang] = {
          ...DEFAULT_CONTRACT_TRANSLATIONS[lang],
          ...(parsed[lang] || {})
        };
      }
      memoryCachedTranslations = merged;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new Event('novel_contract_translations_updated'));
      }
      return merged;
    }
  } catch (e) {
    console.warn('Could not fetch contract templates from Supabase Storage:', e);
  }
  return getStoredContractTranslations();
}

// Save translations to both Supabase Cloud Storage and local storage
export async function saveContractTranslationsAsync(translations: Record<string, Record<string, string>>): Promise<{ success: boolean; cloudSuccess: boolean; error?: string }> {
  memoryCachedTranslations = translations;

  // 1. Save to LocalStorage immediately
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(translations));
      window.dispatchEvent(new Event('novel_contract_translations_updated'));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // 2. Upload to Supabase Cloud Storage for all devices & customer contract links
  let cloudSuccess = false;
  let errorMsg: string | undefined = undefined;
  try {
    const jsonStr = JSON.stringify(translations, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const { error } = await supabase.storage
      .from('novel_pdf')
      .upload(SUPABASE_STORAGE_PATH, blob, {
        upsert: true,
        contentType: 'application/json'
      });

    if (error) {
      console.warn('Supabase cloud storage upload warning:', error.message);
      errorMsg = error.message;
    } else {
      cloudSuccess = true;
    }
  } catch (err: any) {
    console.error('Supabase cloud storage save exception:', err);
    errorMsg = err?.message || String(err);
  }

  return { success: true, cloudSuccess, error: errorMsg };
}

// Synchronous wrapper for backwards compatibility
export function saveContractTranslations(translations: Record<string, Record<string, string>>): boolean {
  saveContractTranslationsAsync(translations).catch(err => {
    console.error('Async Supabase save error in background:', err);
  });
  return true;
}

// Reset specific language or all to defaults
export async function resetContractTranslations(language?: string): Promise<Record<string, Record<string, string>>> {
  if (typeof window === 'undefined') return DEFAULT_CONTRACT_TRANSLATIONS;
  try {
    if (!language) {
      localStorage.removeItem(STORAGE_KEY);
      memoryCachedTranslations = { ...DEFAULT_CONTRACT_TRANSLATIONS };
      window.dispatchEvent(new Event('novel_contract_translations_updated'));
      await saveContractTranslationsAsync(DEFAULT_CONTRACT_TRANSLATIONS);
      return DEFAULT_CONTRACT_TRANSLATIONS;
    } else {
      const current = getStoredContractTranslations();
      if (DEFAULT_CONTRACT_TRANSLATIONS[language]) {
        current[language] = { ...DEFAULT_CONTRACT_TRANSLATIONS[language] };
      }
      await saveContractTranslationsAsync(current);
      return current;
    }
  } catch (e) {
    console.error('Failed to reset contract translations:', e);
    return DEFAULT_CONTRACT_TRANSLATIONS;
  }
}

// Auto-trigger cloud fetch on module load in browser
if (typeof window !== 'undefined') {
  fetchContractTranslationsFromSupabase().catch(() => {});
}

