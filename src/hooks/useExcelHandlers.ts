import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { generateConsolidatedExcel } from '../utils/excelGenerator';
import { calculateCombinedRefund } from '../utils/combinedTaxCalculator';

export function useExcelHandlers(
  regForm: any,
  selectedFeeRate: number,
  targetYears: string[],
  invoiceLanguage: string,
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void,
  handleSaveConsultInfo: () => Promise<void>
) {
  const triggerConsolidatedExcelDownload = async () => {
    try {
      await generateConsolidatedExcel(regForm, showToast);

      showToast('통합 경정청구 명세서 엑셀 다운로드가 완료되었습니다.', 'success');
      handleSaveConsultInfo();
    } catch (err: any) {
      console.error('Error generating consolidated Excel:', err);
      showToast('엑셀 생성 실패: ' + err.message, 'error');
    }
  };

  const triggerExcelDownload = async () => {
    showToast('엑셀 파일을 작성하고 있습니다. 잠시만 기다려 주세요...', 'info');
    try {
      // 1. Calculate Age at Employment (만 나이)
      const rrn = regForm.foreignerNumber ? regForm.foreignerNumber.replace(/-/g, '').trim() : '';
      let birthYear = 0;
      let birthMonth = 0;
      let birthDay = 0;
      if (rrn.length >= 7) {
        const yy = Number(rrn.substring(0, 2));
        const mm = Number(rrn.substring(2, 4));
        const dd = Number(rrn.substring(4, 6));
        const genderChar = rrn.charAt(6);
        
        if (['1', '2', '5', '6'].includes(genderChar)) {
          birthYear = 1900 + yy;
        } else if (['3', '4', '7', '8'].includes(genderChar)) {
          birthYear = 2000 + yy;
        } else {
          birthYear = (yy > 30) ? 1900 + yy : 2000 + yy;
        }
        birthMonth = mm;
        birthDay = dd;
      }

      let ageAtEmployment = '';
      if (birthYear > 0 && regForm.residentAddress) {
        const empParts = regForm.residentAddress.split('-');
        if (empParts.length === 3) {
          const empYear = Number(empParts[0]);
          const empMonth = Number(empParts[1]);
          const empDay = Number(empParts[2]);
          
          let age = empYear - birthYear;
          if (empMonth < birthMonth || (empMonth === birthMonth && empDay < birthDay)) {
            age--;
          }
          ageAtEmployment = String(age);
        }
      }

      // 2. Resolve Reduction Start & End Date
      let reductionStart = '';
      let reductionEnd = '';
      if (regForm.residentAddress) {
        const empParts = regForm.residentAddress.split('-');
        if (empParts.length === 3) {
          const empYear = Number(empParts[0]);
          const empMonth = Number(empParts[1]);
          reductionStart = regForm.residentAddress; // 시작일은 취업일 그 자체
          const endMonthDate = new Date(empYear + 5, empMonth, 0); // 5년 후 취업월의 말일
          const ey = endMonthDate.getFullYear();
          const em = String(endMonthDate.getMonth() + 1).padStart(2, '0');
          const ed = String(endMonthDate.getDate()).padStart(2, '0');
          reductionEnd = `${ey}-${em}-${ed}`;
        }
      }
      if (!reductionStart) {
        reductionStart = regForm.taxReductionApplyDateStart || '';
        reductionEnd = regForm.taxReductionApplyDateEnd || '';
      }

      // 3. Resolve Company Details (Last/Recent Active Employer)
      let companyName = '';
      let businessNumber = '';
      for (let i = (regForm.years || []).length - 1; i >= 0; i--) {
        const yrData = regForm.years[i];
        if (yrData?.active && yrData.workPlace) {
          companyName = yrData.workPlace;
          businessNumber = yrData.businessNumber || yrData.companyRegNum || '';
          break;
        }
      }
      if (!companyName && (regForm.years || []).length > 0) {
        const lastItem = regForm.years[regForm.years.length - 1];
        companyName = lastItem.workPlace || '';
        businessNumber = lastItem.businessNumber || lastItem.companyRegNum || '';
      }

      // 4. Load Excel Template
      const response = await fetch('/중소기업 취업자 소득세 감면 대상 명세서.xlsx');
      if (!response.ok) {
        throw new Error('엑셀 템플릿 파일을 찾을 수 없습니다. public 폴더를 확인해 주세요.');
      }
      const arrayBuffer = await response.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('엑셀 템플릿의 첫 번째 시트를 불러올 수 없습니다.');
      }

      // 5. Force column widths to prevent text wrapping/cutting off
      worksheet.getColumn('A').width = 9.5;
      worksheet.getColumn('B').width = 16.5;
      worksheet.getColumn('C').width = 13.0;
      worksheet.getColumn('D').width = 10.0;
      worksheet.getColumn('E').width = 12.0;
      worksheet.getColumn('F').width = 16.0;
      worksheet.getColumn('G').width = 13.0;
      worksheet.getColumn('H').width = 12.0;
      worksheet.getColumn('I').width = 12.0;

      // 6. Force row heights to prevent overlapping and provide spaces
      worksheet.getRow(4).height = 28;
      worksheet.getRow(5).height = 28;
      worksheet.getRow(6).height = 28;
      worksheet.getRow(9).height = 25;
      worksheet.getRow(10).height = 25;

      for (let r = 11; r <= 18; r++) {
        worksheet.getRow(r).height = 22;
      }

      worksheet.getRow(20).height = 40;
      worksheet.getRow(22).height = 30;
      worksheet.getRow(23).height = 35;
      worksheet.getRow(24).height = 35;

      worksheet.getRow(27).height = 22;
      worksheet.getRow(28).height = 28;
      worksheet.getRow(29).height = 28;
      worksheet.getRow(30).height = 38;
      worksheet.getRow(31).height = 38;

      // 7. Configure Page Setup for 1-Page Scaling with narrow margins
      worksheet.pageSetup = {
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        orientation: 'portrait',
        paperSize: 9, // A4
        margins: {
          left: 0.4,
          right: 0.4,
          top: 0.4,
          bottom: 0.4,
          header: 0.2,
          footer: 0.2
        }
      };

      // 8. Fill Company Details
      worksheet.getCell('C4').value = "상 호 : " + companyName;
      worksheet.getCell('G4').value = "사업자등록번호 : " + businessNumber;
      worksheet.getCell('C5').value = "사업장소재지 : " + (regForm.companyAddress || '');
      worksheet.getCell('G5').value = "주업종코드 : " + (regForm.companyIndustry || '');
      worksheet.getCell('C6').value = "(전화번호 : " + (regForm.companyPhone || '') + ")";

      // 9. Fill Employee details (Row 11 / Row 12)
      worksheet.getCell('A11').value = regForm.name ? regForm.name.toUpperCase() : '';
      worksheet.getCell('B11').value = regForm.foreignerNumber || '';
      worksheet.getCell('C11').value = regForm.residentAddress || '';
      worksheet.getCell('D11').value = '청년';
      worksheet.getCell('E11').value = ageAtEmployment || '';
      worksheet.getCell('F11').value = '-';
      worksheet.getCell('G11').value = '-';
      
      // Start/End Dates are written into Row 12 H/I
      worksheet.getCell('H12').value = reductionStart || '';
      worksheet.getCell('I12').value = reductionEnd || '';

      // 10. Fill Bottom metadata (Date & Signature)
      const today = new Date();
      const currentYearStr = String(today.getFullYear());
      const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');
      const currentDayStr = String(today.getDate()).padStart(2, '0');

      worksheet.getCell('A22').value = `${currentYearStr}년         ${currentMonthStr}월         ${currentDayStr}일`;
      
      // Set richText signature
      worksheet.getCell('A23').value = {
        richText: [
          { text: "원천징수의무자                  " },
          { font: { size: 10, bold: true, name: "돋움" }, text: companyName },
          { text: "                  " },
          { font: { size: 8, color: { argb: "FF7F7F7F" }, name: "돋움" }, text: "(서명 또는 인)" }
        ]
      };

      // 11. Generate and download workbook xlsx buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const cleanCustomerName = regForm.name.trim();
      link.download = `${cleanCustomerName} 중소기업 감면 명세서.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('감면 명세서 엑셀 다운로드가 완료되었습니다.', 'success');
      
      // Automatically trigger database save to sync company details
      handleSaveConsultInfo();
    } catch (err: any) {
      console.error('Error generating Excel from template:', err);
      showToast('엑셀 생성 실패: ' + err.message, 'error');
    }
  };

  const triggerKoreanInvoiceDownload = async () => {
    showToast(`${invoiceLanguage} 청구서 엑셀 파일을 작성하고 있습니다...`, 'info');
    try {
      let totalRefundSum = 0;
      let totalFeeSum = 0;
      const activeYearBreakdowns: { year: string; type: 'wage' | 'free'; refund: number; fee: number }[] = [];

      targetYears.forEach(yr => {
        const matchingWageDataList = (regForm.years || []).filter((y: any) => String(y.year) === yr && y.active);
        const freeData = regForm.freelancerYears?.[yr];
        const hasWage = matchingWageDataList.length > 0;
        const hasFree = freeData?.active;

        if (hasWage && hasFree) {
          const combined = calculateCombinedRefund(regForm, yr, selectedFeeRate);
          const wageRefund = matchingWageDataList.reduce((sum: number, y: any) => sum + Number(y.refundExpectNational || 0) + Number(y.refundExpectLocal || 0), 0);
          const wageFee = Math.round(wageRefund * (selectedFeeRate / 100));
          const businessRefund = combined.wageFreeRefund - wageRefund;
          const businessFee = combined.fee - wageFee;

          if (wageRefund > 0) {
            totalRefundSum += wageRefund;
            totalFeeSum += wageFee;
            activeYearBreakdowns.push({ year: yr, type: 'wage', refund: wageRefund, fee: wageFee });
          }
          if (businessRefund > 0) {
            totalRefundSum += businessRefund;
            totalFeeSum += businessFee;
            activeYearBreakdowns.push({ year: yr, type: 'free', refund: businessRefund, fee: businessFee });
          }
        } else if (hasWage) {
          const wageRefund = matchingWageDataList.reduce((sum: number, y: any) => sum + Number(y.refundExpectNational || 0) + Number(y.refundExpectLocal || 0), 0);
          const wageFee = matchingWageDataList.reduce((sum: number, y: any) => sum + Number(y.expectedFeeAmt || 0), 0);
          if (wageRefund > 0) {
            totalRefundSum += wageRefund;
            totalFeeSum += wageFee;
            activeYearBreakdowns.push({ year: yr, type: 'wage', refund: wageRefund, fee: wageFee });
          }
        } else if (hasFree) {
          const combined = calculateCombinedRefund(regForm, yr, selectedFeeRate);
          if (combined.wageFreeRefund > 0) {
            totalRefundSum += combined.wageFreeRefund;
            totalFeeSum += combined.fee;
            activeYearBreakdowns.push({ year: yr, type: 'free', refund: combined.wageFreeRefund, fee: combined.fee });
          }
        }
      });

      if (activeYearBreakdowns.length === 0) {
        throw new Error('환급이 예상되는 연도가 없습니다. 정산 데이터를 확인해 주세요.');
      }

      // Multi-language translation dictionaries
      const translations: Record<string, Record<string, string>> = {
        '한국어': {
          title: '환급금 정산 청구서',
          sec1: '1. 고객 정보',
          name: '고객 성명',
          rrn: '주민등록번호',
          company: '소속 회사',
          sec2: '2. 환급금 및 수수료 내역',
          year: '정산 연도',
          expect: '예상 환급액 (국세+지방세)',
          fee: '대행 수수료',
          total: '합 계',
          sec3: '3. 입금 계좌 및 수납 안내',
          bank: '입금 은행',
          acc: '계좌 번호',
          owner: '예 금 주',
          footnote: '※ 대행 수수료 입금이 확인된 후, 세무서 국세청 경정청구 최종 접수가 진행됩니다.\n※ 입금하실 때는 반드시 고객님 본인 성명으로 입금해 주시기 바랍니다.',
          filePrefix: '청구서',
          wageLabel: '근로소득',
          freeLabel: '사업소득(3.3%)',
          feeNoticePrefix: '★ 고객님께서 납부하실 총 대행수수료는 ',
          feeNoticeSuffix: '원 입니다.'
        },
        '베트남어': {
          title: 'Hóa đơn thanh toán tiền hoàn thuế',
          sec1: '1. Thông tin khách hàng',
          name: 'Họ và tên khách hàng',
          rrn: 'Số đăng ký người nước ngoài (RRN)',
          company: 'Công ty sở thuộc',
          sec2: '2. Chi tiết tiền hoàn thuế và phí dịch vụ',
          year: 'Năm quyết toán',
          expect: 'Số tiền hoàn thuế dự kiến (Thuế quốc gia + Thuế địa phương)',
          fee: 'Phí dịch vụ đại lý',
          total: 'Tổng cộng',
          sec3: '3. Thông tin tài khoản ngân hàng và hướng dẫn thanh toán',
          bank: 'Ngân hàng chuyển tiền',
          acc: 'Số tài khoản',
          owner: 'Chủ tài khoản',
          footnote: '※ Phí dịch vụ đại lý sau khi được xác nhận thanh toán, thủ tục nộp hồ sơ hoàn thuế lên cơ quan thuế mới được tiến hành.\n※ Khi chuyển tiền, vui lòng ghi đúng họ và tên của khách hàng.',
          filePrefix: 'Hoa_Don',
          wageLabel: 'Thu nhập từ lương',
          freeLabel: 'Thu nhập tự do (3.3%)',
          feeNoticePrefix: '★ Tổng phí dịch vụ quý khách cần thanh toán: ',
          feeNoticeSuffix: '원.'
        },
        '인도네시아어': {
          title: 'Faktur Pembayaran Pengembalian Pajak',
          sec1: '1. Informasi Pelanggan',
          name: 'Nama Pelanggan',
          rrn: 'Nomor Registrasi Penduduk (RRN)',
          company: 'Nama Perusahaan',
          sec2: '2. Rincian Pengembalian Pajak & Biaya Jasa',
          year: 'Tahun Penyelesaian',
          expect: 'Estimasi Pengembalian Pajak (Pajak Nasional + Daerah)',
          fee: 'Biaya Jasa Agen',
          total: 'Total',
          sec3: '3. Informasi Rekening Bank & Panduan Pembayaran',
          bank: 'Nama Bank',
          acc: 'Nomor Rekening',
          owner: 'Nama Pemilik Rekening',
          footnote: '※ Setelah pembayaran biaya jasa agen dikonfirmasi, pengajuan pengembalian pajak ke Kantor Pajak akan diproses.\n※ Saat mentransfer, harap pastikan menggunakan nama asli pelanggan.',
          filePrefix: 'Faktur',
          wageLabel: 'Pendapatan gaji',
          freeLabel: 'Pekerja bebas (3.3%)',
          feeNoticePrefix: '★ Total biaya jasa agen yang harus dibayar: ',
          feeNoticeSuffix: '원.'
        },
        '몽골어': {
          title: 'Татварын буцаан олголтын нэхэмжлэх',
          sec1: '1. Үйлчлүүлэгчийн мэдээлэл',
          name: 'Үйлчлүүлэгчийн нэр',
          rrn: 'Иргэний бүртгэлийн дугаар (RRN)',
          company: 'Харьяалагдах компани',
          sec2: '2. Буцаан олголт ба үйлчилгээний хөлсний дэлгэрэнгүй',
          year: 'Тооцооны жил',
          expect: 'Хүлээгдэж буй буцаан олголт (Улсын татвар + Орон нутгийн татвар)',
          fee: 'Үйлчилгээний хөлс',
          total: 'Нийлбэр',
          sec3: '3. Дансны мэдээлэл ба төлбөрийн заавар',
          bank: 'Хүлээн авагч банк',
          acc: 'Дансны дугаар',
          owner: 'Данс эзэмшигч',
          footnote: '※ Үйлчилгээний хөлсний шилжүүлэг баталгаажсаны дараа, Татварын албанд хийх эцсийн мэдүүлэг боловсруулагдах болно.\n※ Шилжүүлэг хийхдээ үйлчлүүлэгч өөрийн нэрээр шилжүүлнэ үү.',
          filePrefix: 'Nehemjleh',
          wageLabel: 'Цалингийн орлого',
          freeLabel: 'Чөлөөт орлого (3.3%)',
          feeNoticePrefix: '★ Төлөх нийт үйлчилгээний хөлс: ',
          feeNoticeSuffix: '원.'
        },
        '미얀마어': {
          title: 'အခွန်ပြန်အမ်းငွေပေးချေမှုပြေစာ',
          sec1: '1. ဝယ်ယူသူအချက်အလက်',
          name: 'ဝယ်ယူသူအမည်',
          rrn: 'နိုင်ငံသားမှတ်ပုံတင်နံပါတ် (RRN)',
          company: 'ကုမ္ပဏီအမည်',
          sec2: '2. အခွန်ပြန်အမ်းငွေနှင့် ဝန်ဆောင်ခအသေးစိတ်',
          year: 'တွက်ချက်သည့်နှစ်',
          expect: 'ခန့်မှန်းခြေအခွန်ပြန်အမ်းငွေ (နိုင်ငံတော်အခွန် + ဒေသန္တရအခွန်)',
          fee: 'ကိုယ်စားလှယ်ဝန်ဆောင်ခ',
          total: 'စုစုပေါင်း',
          sec3: '3. ဘဏ်အကောင့်အချက်အလက်နှင့် ငွေပေးချေမှုလမ်းညွှန်',
          bank: 'ဘဏ်အမည်',
          acc: 'အကောင့်နံပါတ်',
          owner: 'အကောင့်ပိုင်ရှင်',
          footnote: '※ ဝန်ဆောင်ခလွှဲပြောင်းမှုကို အတည်ပြုပြီးနောက် အခွန်ဦးစီးဌาနသို့ နောက်ဆုံးတင်ပြမှုကို ဆောင်ရွက်ပါမည်।\n※ ငွေလွှဲရာတွင် ဝယ်ယူသူကိုယ်တိုင်၏အမည်ဖြင့် လွှဲပေးပါရန် မေတ္တာရပ်ခံအပ်ပါသည်။',
          filePrefix: 'Invoice',
          feeNoticePrefix: '★ ပေးချေရမည့် စုစုပေါင်း ကိုယ်စားလှယ်ဝန်ဆောင်ခ: ',
          feeNoticeSuffix: '원.'
        },
        '캄보டி아어': {
          title: 'វិក្កយបត្រទូទាត់ប្រាក់សំណងពន្ធ',
          sec1: '1. ព័ត៌មានអតិថិជន',
          name: 'ឈ្មោះអតិថិជន',
          rrn: 'លេខអត្តសញ្ញាណប័ណ្ណ (RRN)',
          company: 'ឈ្មោះក្រុមហ៊ុន',
          sec2: '2. ព័ត៌មានលម្អិតនៃប្រាក់សំណងពន្ធ និងកម្រៃសេវា',
          year: 'ឆ្នាំទូទាត់',
          expect: 'ប្រាក់សំណងពន្ធប៉ាន់ស្មាន (ពន្ធជាតិ + ពន្ធក្នុងតំបន់)',
          fee: 'កម្រៃសេវាតំណាង',
          total: 'សរុប',
          sec3: '3. ព័ត៌មានគណនីធនាគារ និងការណែនាំអំពីការបង់ប្រាក់',
          bank: 'ឈ្មោះធនាគារ',
          acc: 'លេខគណនី',
          owner: 'ឈ្មោះម្ចាស់គណនី',
          footnote: '※ បន្ទាប់ពីការបង់ប្រាក់កម្រៃសេវាតំណាងត្រូវបានបញ្ជាក់ ការដាក់ពាក្យសុំសំណងពន្ធចុងក្រោយទៅកាន់ការិយាល័យពន្ធដារនឹងត្រូវដំណើរការ।\n※ ពេលផ្ទេរប្រាក់ សូមប្រាកដថាប្រើប្រាស់ឈ្មោះពិតរបស់អតិថិជន।',
          filePrefix: 'Invoice_KH',
          feeNoticePrefix: '★ កម្រៃសេវាតំណាងសរុបដែលត្រូវបង់: ',
          feeNoticeSuffix: '원.'
        },
        '네팔어': {
          title: 'कर फिर्ता भुक्तानी इनभ्वाइस',
          sec1: '1. ग्राहक विवरण',
          name: 'ग्राहकको नाम',
          rrn: 'नागरिकता दर्ता नम्बर (RRN)',
          company: 'सम्बद्ध कम्पनी',
          sec2: '2. कर फिर्ता र सेवा शुल्क विवरण',
          year: 'आवधिक वर्ष',
          expect: 'अनुमानित कर फिर्ता (राष्ट्रिय कर + स्थानीय कर)',
          fee: 'एजेन्सी सेवा शुल्क',
          total: 'जम्मा',
          sec3: '3. bank खाता विवरण र भुक्तानी निर्देशन',
          bank: 'बैंकको नाम',
          acc: 'खाता नम्बर',
          owner: 'खातावालाको नाम',
          footnote: '※ सेवा शुल्क भुक्तानी पुष्टि भएपछि मात्र कर कार्यालयमा अन्तिम आवेदन प्रक्रिया अघि बढाइनेछ।\n※ रकम जम्मा गर्दा कृपया ग्राहककै नामबाट जम्मा गरिदिनुहोला।',
          filePrefix: 'Invoice_NP',
          feeNoticePrefix: '★ भुक्तानी गर्नुपर्ने जम्मा सेवा शुल्क: ',
          feeNoticeSuffix: '원.'
        }
      };

      const t = translations[invoiceLanguage] || translations['한국어'];
      const currentFont = invoiceLanguage === '한국어' ? '맑은 고딕' : 'Segoe UI';

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Invoice');
      worksheet.views = [{ showGridLines: true }];

      // Define default column widths
      worksheet.getColumn('A').width = 4;
      worksheet.getColumn('B').width = 30;
      worksheet.getColumn('C').width = 24;
      worksheet.getColumn('D').width = 24;
      worksheet.getColumn('E').width = 4;

      // Styling Helpers
      const thinBorder = {
        top: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin' as const, color: { argb: 'FFCBD5E1' } }
      };

      // 1. Title
      worksheet.mergeCells('B2:D2');
      const titleCell = worksheet.getCell('B2');
      titleCell.value = t.title;
      titleCell.font = { name: currentFont, size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' } // Dark Navy
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 45;

      // 2. Client Info Section
      worksheet.getCell('B4').value = t.sec1;
      worksheet.getCell('B4').font = { name: currentFont, size: 11, bold: true };
      
      const infoLabels = [t.name, t.rrn, t.company];
      
      const companyNamesList: string[] = [];
      (regForm.years || []).forEach((yrData: any) => {
        if (yrData?.active && yrData.workPlace && yrData.workPlace.trim()) {
          const nameTrim = yrData.workPlace.trim();
          if (!companyNamesList.includes(nameTrim)) {
            companyNamesList.push(nameTrim);
          }
        }
      });
      let companyName = companyNamesList.join(', ');
      if (!companyName && (regForm.years || []).length > 0) {
        const lastItem = regForm.years[regForm.years.length - 1];
        companyName = lastItem.workPlace || '';
      }

      // Mask RRN
      const rawRrn = regForm.foreignerNumber || '';
      let maskedRrn = rawRrn;
      if (rawRrn.replace(/-/g, '').length >= 7) {
        const clean = rawRrn.replace(/-/g, '');
        maskedRrn = clean.substring(0, 6) + '-' + clean.charAt(6) + '******';
      }

      const infoValues = [regForm.name || '', maskedRrn, companyName];

      for (let i = 0; i < 3; i++) {
        const rNum = 5 + i;
        const row = worksheet.getRow(rNum);
        row.height = 24;

        const lblCell = worksheet.getCell("B" + rNum);
        lblCell.value = infoLabels[i];
        lblCell.font = { name: currentFont, size: 10, bold: true };
        lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        lblCell.border = thinBorder;
        lblCell.alignment = { vertical: 'middle', horizontal: 'center' };

        worksheet.mergeCells("C" + rNum + ":D" + rNum);
        const valCell = worksheet.getCell("C" + rNum);
        valCell.value = infoValues[i];
        valCell.font = { name: currentFont, size: 10 };
        valCell.border = thinBorder;
        valCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        
        // Add border to merged cells manually
        worksheet.getCell("D" + rNum).border = thinBorder;
      }

      // 3. Calculation Table
      const startTableIdx = 9;
      worksheet.getCell("B" + startTableIdx).value = t.sec2;
      worksheet.getCell("B" + startTableIdx).font = { name: currentFont, size: 11, bold: true };

      // Header Row
      const headerRowIndex = startTableIdx + 1;
      worksheet.getRow(headerRowIndex).height = 26;
      
      const headers = [t.year, t.expect, t.fee + " (" + selectedFeeRate + "%)"];
      const headerCols = ['B', 'C', 'D'];
      
      for (let i = 0; i < 3; i++) {
        const cell = worksheet.getCell(headerCols[i] + headerRowIndex);
        cell.value = headers[i];
        cell.font = { name: currentFont, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }; // Blue
        cell.border = thinBorder;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Data Rows
      let currentIdx = headerRowIndex + 1;
      activeYearBreakdowns.forEach(item => {
        worksheet.getRow(currentIdx).height = 24;
        
        // Year Label
        const cellY = worksheet.getCell("B" + currentIdx);
        const suffix = item.type === 'wage' ? t.wageLabel : t.freeLabel;
        cellY.value = item.year + (invoiceLanguage === '한국어' ? '년 ' : ' ') + suffix;
        cellY.font = { name: currentFont, size: 10 };
        cellY.border = thinBorder;
        cellY.alignment = { vertical: 'middle', horizontal: 'center' };

        // Refund
        const cellR = worksheet.getCell("C" + currentIdx);
        cellR.value = item.refund;
        cellR.numFmt = '#,##0"원"';
        cellR.font = { name: currentFont, size: 10 };
        cellR.border = thinBorder;
        cellR.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };

        // Fee
        const cellF = worksheet.getCell("D" + currentIdx);
        cellF.value = item.fee;
        cellF.numFmt = '#,##0"원"';
        cellF.font = { name: currentFont, size: 10, bold: true };
        cellF.border = thinBorder;
        cellF.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };

        currentIdx++;
      });

      // Total Row
      worksheet.getRow(currentIdx).height = 26;
      
      const cellTotLbl = worksheet.getCell("B" + currentIdx);
      cellTotLbl.value = t.total;
      cellTotLbl.font = { name: currentFont, size: 10, bold: true };
      cellTotLbl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cellTotLbl.border = thinBorder;
      cellTotLbl.alignment = { vertical: 'middle', horizontal: 'center' };

      const cellTotR = worksheet.getCell("C" + currentIdx);
      cellTotR.value = totalRefundSum;
      cellTotR.numFmt = '#,##0"원"';
      cellTotR.font = { name: currentFont, size: 10, bold: true };
      cellTotR.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cellTotR.border = thinBorder;
      cellTotR.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };

      const cellTotF = worksheet.getCell("D" + currentIdx);
      cellTotF.value = totalFeeSum;
      cellTotF.numFmt = '#,##0"원"';
      cellTotF.font = { name: currentFont, size: 10, bold: true, color: { argb: 'FFEF4444' } }; // Red
      cellTotF.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cellTotF.border = thinBorder;
      cellTotF.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };

      // Move to next row for the highlight callout
      currentIdx++;
      
      // Total Fee Highlight Callout Row
      worksheet.getRow(currentIdx).height = 30;
      worksheet.mergeCells("B" + currentIdx + ":D" + currentIdx);
      
      for (const col of ['B', 'C', 'D']) {
        const cell = worksheet.getCell(col + currentIdx);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Light Red Background
        cell.border = {
          top: { style: 'thin' as const, color: { argb: 'FFFCA5A5' } },
          bottom: { style: 'thin' as const, color: { argb: 'FFFCA5A5' } },
          left: col === 'B' ? { style: 'thin' as const, color: { argb: 'FFFCA5A5' } } : undefined,
          right: col === 'D' ? { style: 'thin' as const, color: { argb: 'FFFCA5A5' } } : undefined
        };
      }

      const cellFeeNotice = worksheet.getCell("B" + currentIdx);
      cellFeeNotice.value = {
        richText: [
          { font: { name: currentFont, size: 10, bold: true, color: { argb: 'FF1E293B' } }, text: t.feeNoticePrefix || '★ 고객님께서 납부하실 총 대행수수료는 ' },
          { font: { name: currentFont, size: 11, bold: true, color: { argb: 'FFEF4444' } }, text: Number(totalFeeSum).toLocaleString() },
          { font: { name: currentFont, size: 10, bold: true, color: { argb: 'FF1E293B' } }, text: t.feeNoticeSuffix || '원 입니다.' }
        ]
      };
      cellFeeNotice.alignment = { vertical: 'middle', horizontal: 'center' };

      // Add a gap row after the callout
      currentIdx += 2;

      // 4. Bank Transfer Info Section
      worksheet.getCell("B" + currentIdx).value = t.sec3;
      worksheet.getCell("B" + currentIdx).font = { name: currentFont, size: 11, bold: true };

      currentIdx++;
      
      const bankLabels = [t.bank, t.acc, t.owner];
      const bankValues = ['IBK 기업은행', '540-049052-04-010', '한결금융컨설팅'];

      for (let i = 0; i < 3; i++) {
        const rNum = currentIdx + i;
        worksheet.getRow(rNum).height = 24;

        const lblCell = worksheet.getCell("B" + rNum);
        lblCell.value = bankLabels[i];
        lblCell.font = { name: currentFont, size: 10, bold: true };
        lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        lblCell.border = thinBorder;
        lblCell.alignment = { vertical: 'middle', horizontal: 'center' };

        worksheet.mergeCells("C" + rNum + ":D" + rNum);
        const valCell = worksheet.getCell("C" + rNum);
        valCell.value = bankValues[i];
        valCell.font = { name: currentFont, size: 10, bold: i === 1 }; // Account number bold
        valCell.border = thinBorder;
        valCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

        worksheet.getCell("D" + rNum).border = thinBorder;
      }

      currentIdx += 3;
      
      // Guide text row
      worksheet.getRow(currentIdx).height = 45;
      worksheet.mergeCells("B" + currentIdx + ":D" + currentIdx);
      const guideCell = worksheet.getCell("B" + currentIdx);
      guideCell.value = t.footnote;
      guideCell.font = { name: currentFont, size: 9, color: { argb: 'FF64748B' }, italic: true };
      guideCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      
      // Page Setup for clean print preview
      worksheet.pageSetup = {
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        orientation: 'portrait',
        paperSize: 9 // A4
      };

      // Generate file buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const cleanCustomerName = regForm.name.trim();
      link.download = `${cleanCustomerName} 청구서.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`${invoiceLanguage} 청구서 다운로드가 완료되었습니다.`, 'success');
    } catch (err: any) {
      console.error('Error generating invoice Excel:', err);
      showToast('청구서 생성 실패: ' + err.message, 'error');
    }
  };

  return {
    triggerConsolidatedExcelDownload,
    triggerExcelDownload,
    triggerKoreanInvoiceDownload
  };
}
