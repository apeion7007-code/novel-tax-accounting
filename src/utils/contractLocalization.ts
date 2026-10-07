/**
 * Contract Localization Module
 * Provides localized labels, headers, footers, country names, and date formatting
 * for 14 supported languages in A4ContractDocument.
 */

export interface ContractExtraLabels {
  sheet1FooterTitle: string;
  sheet1FooterPage: string;
  sheet2HeaderFirm: string;
  sheet2HeaderSuffix: string;
  sheet2FooterFirm: string;
  sheet2FooterPage: string;
  agentBoxTitle: string;
  agentBoxFirmLabel: string;
  agentBoxRepLabel: string;
  agentBoxBizNumLabel: string;
  agentRepStampTitle: string;
  clientSigNameLabel: string;
  clientSigStampLabel: string;
  pendingSigText?: string;
  sigClearText?: string;
  logoText?: string;
  prepaidText: string;
  postpaidText: string;
}

export type CompleteContractExtraLabels = Required<ContractExtraLabels>;

export const EXTRA_CONTRACT_LABELS: Record<string, ContractExtraLabels> = {
  '한국어': {
    sheet1FooterTitle: '세무법인 노벨세무회계 경정청구 위임계약서',
    sheet1FooterPage: '페이지 1 / 2 (다음 장에 서명란이 이어집니다 ➔)',
    sheet2HeaderFirm: '세무법인 노벨세무회계',
    sheet2HeaderSuffix: '(서명 및 체결)',
    sheet2FooterFirm: 'NOVEL TAX LAW FIRM',
    sheet2FooterPage: '페이지 2 / 2 (최종 서명본)',
    agentBoxTitle: '수임인 (을) 법인 및 대표자',
    agentBoxFirmLabel: '상호',
    agentBoxRepLabel: '대표세무사',
    agentBoxBizNumLabel: '사업자번호',
    agentRepStampTitle: '대표세무사',
    clientSigNameLabel: '성명',
    clientSigStampLabel: '(인 / 서명)',
    prepaidText: '선불',
    postpaidText: '후불'
  },
  '영어': {
    sheet1FooterTitle: 'Nobel Tax Law Firm - Tax Refund Representation Agreement',
    sheet1FooterPage: 'Page 1 / 2 (Signature section continues on next page ➔)',
    sheet2HeaderFirm: 'Nobel Tax Law Firm',
    sheet2HeaderSuffix: '(Signature & Execution)',
    sheet2FooterFirm: 'NOVEL TAX LAW FIRM',
    sheet2FooterPage: 'Page 2 / 2 (Final Signed Copy)',
    agentBoxTitle: 'Agent (Party B) Entity & Representative',
    agentBoxFirmLabel: 'Firm Name',
    agentBoxRepLabel: 'Certified Tax Accountant',
    agentBoxBizNumLabel: 'Business Reg. No.',
    agentRepStampTitle: 'Managing Tax Accountant',
    clientSigNameLabel: 'Full Name',
    clientSigStampLabel: '(Seal / Signature)',
    prepaidText: 'Prepaid',
    postpaidText: 'Postpaid'
  },
  '우즈베크어': {
    sheet1FooterTitle: 'Nobel Soliq va Buxgalteriya Xizmati soliq qaytarish boʻyicha vakillik shartnomasi',
    sheet1FooterPage: 'Sahifa 1 / 2 (Keyingi sahifada imzo boʻlimi davom etadi ➔)',
    sheet2HeaderFirm: 'Nobel Soliq va Buxgalteriya Xizmati',
    sheet2HeaderSuffix: '(Imzolash va rasmiylashtirish)',
    sheet2FooterFirm: 'NOVEL TAX LAW FIRM',
    sheet2FooterPage: 'Sahifa 2 / 2 (Yakuniy imzolangan nusxa)',
    agentBoxTitle: 'Vakil (B tomon) yuridik shaxs va rahbari',
    agentBoxFirmLabel: 'Firma nomi',
    agentBoxRepLabel: 'Vakolatli soliq maslahatchisi',
    agentBoxBizNumLabel: 'Korxona roʻyxat raqami',
    agentRepStampTitle: 'Bosh soliq maslahatchisi',
    clientSigNameLabel: 'Ism-sharifi',
    clientSigStampLabel: '(Muhr / Imzo)',
    prepaidText: 'Oldindan toʻlov',
    postpaidText: 'Qolgan toʻlov'
  },
  '베트남어': {
    sheet1FooterTitle: 'Hợp đồng ủy quyền hoàn thuế - Công ty Kế toán Thuế Nobel',
    sheet1FooterPage: 'Trang 1 / 2 (Phần ký tên tiếp tục ở trang sau ➔)',
    sheet2HeaderFirm: 'Công ty Kế toán Thuế Nobel',
    sheet2HeaderSuffix: '(Ký tên và xác nhận)',
    sheet2FooterFirm: 'NOVEL TAX LAW FIRM',
    sheet2FooterPage: 'Trang 2 / 2 (Bản ký chính thức)',
    agentBoxTitle: 'Bên nhận ủy quyền (Bên B) Pháp nhân & Đại diện',
    agentBoxFirmLabel: 'Tên công ty',
    agentBoxRepLabel: 'Đại diện thuế',
    agentBoxBizNumLabel: 'Mã số kinh doanh',
    agentRepStampTitle: 'Đại diện thuế',
    clientSigNameLabel: 'Họ và tên',
    clientSigStampLabel: '(Ký tên / Đóng dấu)',
    prepaidText: 'Trả trước',
    postpaidText: 'Trả sau'
  },
  '인도네시아어': {
    sheet1FooterTitle: 'Perjanjian Kuasa Pengembalian Pajak - Nobel Tax Law Firm',
    sheet1FooterPage: 'Halaman 1 / 2 (Bagian tanda tangan berlanjut di halaman berikutnya ➔)',
    sheet2HeaderFirm: 'Firma Hukum Pajak Nobel',
    sheet2HeaderSuffix: '(Tanda Tangan & Pengesahan)',
    sheet2FooterFirm: 'NOVEL TAX LAW FIRM',
    sheet2FooterPage: 'Halaman 2 / 2 (Salinan Tanda Tangan Final)',
    agentBoxTitle: 'Penerima Kuasa (Pihak B) Badan Hukum & Perwakilan',
    agentBoxFirmLabel: 'Nama Perusahaan',
    agentBoxRepLabel: 'Konsultan Pajak Resmi',
    agentBoxBizNumLabel: 'Nomor Pokok Usaha',
    agentRepStampTitle: 'Konsultan Pajak Utama',
    clientSigNameLabel: 'Nama Lengkap',
    clientSigStampLabel: '(Cap / Tanda Tangan)',
    prepaidText: 'Uang Muka',
    postpaidText: 'Pelunasan'
  },
  '필리핀어': {
    sheet1FooterTitle: 'Kasunduan sa Pagbabalik ng Buwis - Nobel Tax Law Firm',
    sheet1FooterPage: 'Pahina 1 / 2 (Ang pirma ay nasa susunod na pahina ➔)',
    sheet2HeaderFirm: 'Nobel Tax Law Firm',
    sheet2HeaderSuffix: '(Lagda at Pagpapatupad)',
    sheet2FooterFirm: 'NOVEL TAX LAW FIRM',
    sheet2FooterPage: 'Pahina 2 / 2 (Panghuling Kopya)',
    agentBoxTitle: 'Kinatawan (Panig B) Kumpanya at Tagapamahala',
    agentBoxFirmLabel: 'Pangalan ng Kumpanya',
    agentBoxRepLabel: 'Sertipikadong Tagapayo sa Buwis',
    agentBoxBizNumLabel: 'Numero ng Rehistro',
    agentRepStampTitle: 'Punong Tagapayo sa Buwis',
    clientSigNameLabel: 'Buong Pangalan',
    clientSigStampLabel: '(Tatak / Pirma)',
    prepaidText: 'Paunang Bayad',
    postpaidText: 'Huling Bayad'
  },
  '캄보디아어': {
    sheet1FooterTitle: 'កិច្ចសន្យាប្រគល់សិទ្ធិបង្វិលសងពន្ធ - ក្រុមហ៊ុនពន្ធដារណូបែល',
    sheet1FooterPage: 'ទំព័រ ១ / ២ (ផ្នែកហត្ថលេខាបន្តនៅទំព័របន្ទាប់ ➔)',
    sheet2HeaderFirm: 'ក្រុមហ៊ុនពន្ធដារណូបែល',
    sheet2HeaderSuffix: '(ការចុះហត្ថលេខា និងការអនុវត្ត)',
    sheet2FooterFirm: 'NOVEL TAX LAW FIRM',
    sheet2FooterPage: 'ទំព័រ ២ / ២ (ច្បាប់ហត្ថលេខាចុងក្រោយ)',
    agentBoxTitle: 'តំណាង (ភាគី ខ) នីតិបុគ្គល និងតំណាង',
    agentBoxFirmLabel: 'ឈ្មោះក្រុមហ៊ុន',
    agentBoxRepLabel: 'អ្នកប្រឹក្សាពន្ធដារដែលមានការអនុញ្ញាត',
    agentBoxBizNumLabel: 'លេខចុះបញ្ជីអាជីវកម្ម',
    agentRepStampTitle: 'អ្នកប្រឹក្សាពន្ធដារចម្បង',
    clientSigNameLabel: 'ឈ្មោះពេញ',
    clientSigStampLabel: '(ត្រា / ហត្ថលេខា)',
    prepaidText: 'ប្រាក់បង់មុន',
    postpaidText: 'ប្រាក់បង់ក្រោយ'
  },
  '몽골어': {
    sheet1FooterTitle: 'Татварын буцаан олголтын төлөөллийн гэрээ - Нобель Татварын Хуулийн Товчоо',
    sheet1FooterPage: 'Хуудас 1 / 2 (Гарын үсгийн хэсэг дараагийн хуудсанд үргэлжилнэ ➔)',
    sheet2HeaderFirm: 'Нобель Татварын Хуулийн Товчоо',
    sheet2HeaderSuffix: '(Гарын үсэг зурж баталгаажуулах)',
    sheet2FooterFirm: 'NOVEL TAX LAW FIRM',
    sheet2FooterPage: 'Хуудас 2 / 2 (Эцсийн баталгаажсан хувь)',
    agentBoxTitle: 'Төлөөлөгч (Б тал) Хуулийн этгээд ба төлөөлөгч',
    agentBoxFirmLabel: 'Байгууллагын нэр',
    agentBoxRepLabel: 'Татварын итгэмжлэгдсэн зөвлөх',
    agentBoxBizNumLabel: 'Бүртгэлийн дугаар',
    agentRepStampTitle: 'Ерөнхий татварын зөвлөх',
    clientSigNameLabel: 'Овог нэр',
    clientSigStampLabel: '(Тамга / Гарын үсэг)',
    prepaidText: 'Урьдчилгаа',
    postpaidText: 'Дараа төлбөр'
  },
  '미얀마어': {
    sheet1FooterTitle: 'အခွန်ပြန်အမ်းငွေ ကိုယ်စားလှယ်သဘောတူစာချုပ် - Nobel Tax Law Firm',
    sheet1FooterPage: 'စာမျက်နှာ ၁ / ၂ (လက်မှတ်ထိုးရန်အပိုင်း နောက်စာမျက်နှာတွင် ဆက်လက်ဖော်ပြပါသည် ➔)',
    sheet2HeaderFirm: 'Nobel Tax Law Firm',
    sheet2HeaderSuffix: '(လက်မှတ်ရေးထိုး အတည်ပြုခြင်း)',
    sheet2FooterFirm: 'NOVEL TAX LAW FIRM',
    sheet2FooterPage: 'စာမျက်နှာ ၂ / ၂ (နောက်ဆုံးလက်မှတ်ရေးထိုးပြီးမိတ္တူ)',
    agentBoxTitle: 'ကိုယ်စားလှယ် (အဖွဲ့ B) ကုမ္ပဏီနှင့် တာဝန်ခံ',
    agentBoxFirmLabel: 'ကုမ္ပဏီအမည်',
    agentBoxRepLabel: 'အခွန်အကြံပေးပညာရှင်',
    agentBoxBizNumLabel: 'လုပ်ငန်းမှတ်ပုံတင်အမှတ်',
    agentRepStampTitle: 'အဓိက အခွန်အကြံပေး',
    clientSigNameLabel: 'အမည်အပြည့်အစုံ',
    clientSigStampLabel: '(တံဆိပ်တုံး / လက်မှတ်)',
    prepaidText: 'ကြိုတင်ငွေ',
    postpaidText: 'နောက်ကျငွေ'
  },
  '네팔어': {
    sheet1FooterTitle: 'कर फिर्ता सम्झौता - नोबेल कर कानून फर्म',
    sheet1FooterPage: 'पृष्ठ १ / २ (हस्ताक्षर खण्ड अर्को पृष्ठमा जारी छ ➔)',
    sheet2HeaderFirm: 'नोबेल कर कानून फर्म',
    sheet2HeaderSuffix: '(हस्ताक्षर र कार्यान्वयन)',
    sheet2FooterFirm: 'NOVEL TAX LAW FIRM',
    sheet2FooterPage: 'पृष्ठ २ / २ (अन्तिम हस्ताक्षर प्रतिलिपि)',
    agentBoxTitle: 'प्रतिनिधि (पक्ष ख) संस्था र प्रतिनिधि',
    agentBoxFirmLabel: 'कम्पनीको नाम',
    agentBoxRepLabel: 'अधिकृत कर सल्लाहकार',
    agentBoxBizNumLabel: 'व्यवसाय दर्ता नं.',
    agentRepStampTitle: 'प्रमुख कर सल्लाहकार',
    clientSigNameLabel: 'पूरा नाम',
    clientSigStampLabel: '(छाप / हस्ताक्षर)',
    prepaidText: 'अग्रिम भुक्तानी',
    postpaidText: 'पछिल्लो भुक्तानी'
  },
  '방글라데시어': {
    sheet1FooterTitle: 'ট্যাক্স রিফান্ড প্রতিনিধিত্ব চুক্তি - নোবেল ট্যাক্স ল ফার্ম',
    sheet1FooterPage: 'পৃষ্ঠা ১ / ২ (স্বাক্ষর অংশ পরবর্তী পৃষ্ঠায় অব্যাহত রয়েছে ➔)',
    sheet2HeaderFirm: 'নোবেল ট্যাক্স ল ফার্ম',
    sheet2HeaderSuffix: '(স্বাক্ষর ও সম্পাদন)',
    sheet2FooterFirm: 'NOVEL TAX LAW FIRM',
    sheet2FooterPage: 'পৃষ্ঠা ২ / ২ (চূড়ান্ত স্বাক্ষরিত কপি)',
    agentBoxTitle: 'প্রতিনিধি (পক্ষ খ) প্রতিষ্ঠান ও প্রতিনিধি',
    agentBoxFirmLabel: 'প্রতিষ্ঠানের নাম',
    agentBoxRepLabel: 'অনুমোদিত কর পরামর্শক',
    agentBoxBizNumLabel: 'ব্যবসা নিবন্ধন নং',
    agentRepStampTitle: 'প্রধান কর পরামর্শক',
    clientSigNameLabel: 'পূর্ণ নাম',
    clientSigStampLabel: '(সিল / স্বাক্ষর)',
    prepaidText: 'অগ্রিম',
    postpaidText: 'বকেয়া'
  },
  '파키스탄어': {
    sheet1FooterTitle: 'ٹیکس ریفنڈ معاہدہ - نوبل ٹیکس لاء فرم',
    sheet1FooterPage: 'صفحہ 1 / 2 (دستخط کا حصہ اگلے صفحے پر جاری ہے ➔)',
    sheet2HeaderFirm: 'نوبل ٹیکس لاء فرم',
    sheet2HeaderSuffix: '(دستخط اور نفاذ)',
    sheet2FooterFirm: 'NOVEL TAX LAW FIRM',
    sheet2FooterPage: 'صفحہ 2 / 2 (حتمی دستخط شدہ کاپی)',
    agentBoxTitle: 'نمائندہ (فریق دوم) ادارہ اور نمائندہ',
    agentBoxFirmLabel: 'فرم کا نام',
    agentBoxRepLabel: 'مجاز ٹیکس کنسلٹنٹ',
    agentBoxBizNumLabel: 'کاروباری رجسٹریشن نمبر',
    agentRepStampTitle: 'چیف ٹیکس کنسلٹنٹ',
    clientSigNameLabel: 'مکمل نام',
    clientSigStampLabel: '(مہر / دستخط)',
    prepaidText: 'پیشگی',
    postpaidText: 'بعد ازاں'
  },
  '태국어': {
    sheet1FooterTitle: 'สัญญาตัวแทนขอคืนภาษี - โนเบล ลอว์ เฟิร์ม',
    sheet1FooterPage: 'หน้า 1 / 2 (ส่วนลงนามต่อในหน้าถัดไป ➔)',
    sheet2HeaderFirm: 'โนเบล แท็กซ์ ลอว์ เฟิร์ม',
    sheet2HeaderSuffix: '(การลงนามและมีผลบังคับใช้)',
    sheet2FooterFirm: 'NOVEL TAX LAW FIRM',
    sheet2FooterPage: 'หน้า 2 / 2 (ฉบับลงนามขั้นสุดท้าย)',
    agentBoxTitle: 'ตัวแทน (ฝ่าย ข) นิติบุคคลและผู้มีอำนาจลงนาม',
    agentBoxFirmLabel: 'ชื่อนิติบุคคล',
    agentBoxRepLabel: 'ที่ปรึกษาภาษีที่ได้รับอนุญาต',
    agentBoxBizNumLabel: 'เลขทะเบียนพาณิชย์',
    agentRepStampTitle: 'หัวหน้าที่ปรึกษาภาษี',
    clientSigNameLabel: 'ชื่อ-นามสกุล',
    clientSigStampLabel: '(ตราประทับ / ลายมือชื่อ)',
    prepaidText: 'ชำระล่วงหน้า',
    postpaidText: 'ชำระภายหลัง'
  },
  '스리랑카어': {
    sheet1FooterTitle: 'බදු ආපසු ලබාගැනීමේ නියෝජිත ගිවිසුම - නොබෙල් බදු නීති ආයතනය',
    sheet1FooterPage: 'පිටුව 1 / 2 (අත්සන් අංශය ඊළඟ පිටුවේ ඉදිරියට යයි ➔)',
    sheet2HeaderFirm: 'නොබෙල් බදු නීති ආයතනය',
    sheet2HeaderSuffix: '(අත්සන් කිරීම සහ බලාත්මක කිරීම)',
    sheet2FooterFirm: 'NOVEL TAX LAW FIRM',
    sheet2FooterPage: 'පිටුව 2 / 2 (අවසන් අත්සන් කළ පිටපත)',
    agentBoxTitle: 'නියෝජිත (පාර්ශවය ආ) ආයතනය සහ නියෝජිතයා',
    agentBoxFirmLabel: 'ආයතනයේ නම',
    agentBoxRepLabel: 'බලයලත් බදු උපදේශක',
    agentBoxBizNumLabel: 'ව්‍යාපාර ලියාපදිංචි අංකය',
    agentRepStampTitle: 'ප්‍රධාන බදු උපදේශක',
    clientSigNameLabel: 'සම්පූර්ණ නම',
    clientSigStampLabel: '(මුද්‍රාව / අත්සන)',
    prepaidText: 'පෙර ගෙවීම්',
    postpaidText: 'පසු ගෙවීම්'
  }
};

/**
 * Country name translations across supported languages
 */
export const COUNTRY_TRANSLATIONS: Record<string, Record<string, string>> = {
  '우즈베키스탄': {
    '우즈베크어': 'Oʻzbekiston',
    '영어': 'Uzbekistan',
    '베트남어': 'Uzbekistan',
    '인도네시아어': 'Uzbekistan',
    '한국어': '우즈베키스탄'
  },
  '베트남': {
    '베트남어': 'Việt Nam',
    '영어': 'Vietnam',
    '우즈베크어': 'Vyetnam',
    '인도네시아어': 'Vietnam',
    '한국어': '베트남'
  },
  '인도네시아': {
    '인도네시아어': 'Indonesia',
    '영어': 'Indonesia',
    '우즈베크어': 'Indoneziya',
    '베트남어': 'Indonesia',
    '한국어': '인도네시아'
  },
  '필리핀': {
    '필리핀어': 'Pilipinas',
    '영어': 'Philippines',
    '우즈베크어': 'Filippin',
    '한국어': '필리핀'
  },
  '캄보디아': {
    '캄보디아어': 'កម្ពុជា',
    '영어': 'Cambodia',
    '우즈베크어': 'Kambodja',
    '한국어': '캄보디아'
  },
  '몽골': {
    '몽골어': 'Монгол',
    '영어': 'Mongolia',
    '우즈베크어': 'Mongoliya',
    '한국어': '몽골'
  },
  '미얀마': {
    '미얀마어': 'မြန်မာ',
    '영어': 'Myanmar',
    '우즈베크어': 'Myanma',
    '한국어': '미얀마'
  },
  '네팔': {
    '네팔어': 'नेपाल',
    '영어': 'Nepal',
    '우즈베크어': 'Nepal',
    '한국어': '네팔'
  },
  '방글라데시': {
    '방글라데시어': 'বাংলাদেশ',
    '영어': 'Bangladesh',
    '우즈베크어': 'Bangladesh',
    '한국어': '방글라데시'
  },
  '스리랑카': {
    '스리랑카어': 'ශ්‍රී ලංකාව',
    '영어': 'Sri Lanka',
    '우즈베크어': 'Shri-Lanka',
    '한국어': '스리랑카'
  },
  '태국': {
    '태국어': 'ประเทศไทย',
    '영어': 'Thailand',
    '우즈베크어': 'Tailand',
    '한국어': '태국'
  },
  '파키스탄': {
    '파키스탄어': 'پاکستان',
    '영어': 'Pakistan',
    '우즈베크어': 'Pokiston',
    '한국어': '파키스탄'
  },
  '중국': {
    '영어': 'China',
    '우즈베크어': 'Xitoy',
    '한국어': '중국'
  }
};

/**
 * Get localized country name
 */
export function getLocalizedCountryName(rawCountry: string, language: string): string {
  if (!rawCountry) return '-';
  const clean = rawCountry.trim();
  const found = COUNTRY_TRANSLATIONS[clean];
  if (found) {
    if (found[language]) return found[language];
    if (found['영어']) return found['영어'];
  }
  return clean;
}

const PENDING_SIG_MAP: Record<string, string> = {
  '한국어': '(온라인 전자 서명 대기중)',
  '우즈베크어': '(Onlayn elektron imzo kutilmoqda)',
  '베트남어': '(Đang chờ chữ ký điện tử trực tuyến)',
  '인도네시아어': '(Menunggu Tanda Tangan Elektronik Online)',
  '영어': '(Awaiting Online E-Signature)',
  '필리핀어': '(Naghihintay ng Online E-Signature)',
  '캄보디아어': '(កំពុងរង់ចាំហត្ថលេខាអេឡិចត្រូនិក)',
  '몽골어': '(Цахим гарын үсэг хүлээгдэж байна)',
  '미얀마어': '(အွန်လိုင်း အီလက်ထရွန်းနစ် လက်မှတ်ကို စောင့်ဆိုင်းနေပါသည်)',
  '네팔어': '(अनलाइन ई-हस्ताक्षर पर्खिँदै)',
  '방글라데시어': '(অনলাইন ই-স্বাক্ষরের অপেক্ষায়)',
  '파키스탄어': '(آن لائن ای دستخط کا انتظار ہے)',
  '태국어': '(กำลังรอลายมือชื่ออิเล็กทรอนิกส์)',
  '스리랑카어': '(මාර්ගගත ඊ-අත්සන අපේක්ෂාවෙන්)'
};

const SIG_CLEAR_MAP: Record<string, string> = {
  '한국어': '지우기',
  '우즈베크어': 'Tozalash',
  '베트남어': 'Xóa',
  '인도네시아어': 'Hapus',
  '영어': 'Clear',
  '필리핀어': 'Burahin',
  '캄보디아어': 'លុប',
  '몽골어': 'Арилгах',
  '미얀마어': 'ရှင်းလင်းမည်',
  '네팔어': 'हटाउनुहोस्',
  '방글라데시어': 'মুছুন',
  '파키스탄어': 'صاف کریں',
  '태국어': 'ล้าง',
  '스리랑카어': 'මකන්න'
};

const LOGO_TEXT_MAP: Record<string, string> = {
  '한국어': '세무법인 노벨세무회계 CI',
  '우즈베크어': 'Nobel Tax Law Firm CI',
  '베트남어': 'Nobel Tax Law Firm CI',
  '영어': 'Nobel Tax Law Firm CI'
};

/**
 * Get extra labels for the given language
 */
export function getContractExtraLabels(language: string): CompleteContractExtraLabels {
  const base = EXTRA_CONTRACT_LABELS[language] || EXTRA_CONTRACT_LABELS['영어'] || EXTRA_CONTRACT_LABELS['한국어'];
  return {
    ...base,
    pendingSigText: PENDING_SIG_MAP[language] || PENDING_SIG_MAP['영어'] || '(Awaiting E-Signature)',
    sigClearText: SIG_CLEAR_MAP[language] || SIG_CLEAR_MAP['영어'] || 'Clear',
    logoText: LOGO_TEXT_MAP[language] || 'Nobel Tax Law Firm CI'
  };
}

/**
 * Format date for the given language
 */
export function formatContractDate(signedDate: string | undefined | null, language: string): string {
  const d = signedDate ? new Date(signedDate) : new Date();
  if (isNaN(d.getTime())) return signedDate || '';

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  if (language === '한국어') {
    return `${year}년 ${month}월 ${day}일`;
  }
  if (language === '우즈베크어') {
    const uzMonths = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
    return `${year}-yil ${day}-${uzMonths[month - 1]}`;
  }
  if (language === '베트남어') {
    return `Ngày ${day} tháng ${month} năm ${year}`;
  }
  if (language === '영어' || language === '필리핀어') {
    const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${enMonths[month - 1]} ${day}, ${year}`;
  }
  if (language === '인도네시아어') {
    const idMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${day} ${idMonths[month - 1]} ${year}`;
  }

  // Standard clean ISO-like format for other languages
  return `${year}. ${String(month).padStart(2, '0')}. ${String(day).padStart(2, '0')}`;
}
