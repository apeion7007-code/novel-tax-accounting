const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '2023년 귀속 소득세액공제신고서_.xlsx');
  await wb.xlsx.readFile(filePath);
  
  const sheet = wb.worksheets[1];

  for (let r = 1; r <= 332; r++) {
    const val = sheet.getRow(r).getCell(1).value;
    let text = '';
    if (val && typeof val === 'object' && val.richText) {
      text = val.richText.map(t => t.text).join('');
    } else if (val !== null && val !== undefined) {
      text = String(val);
    }
    if (text.includes('인적 공제') || text.includes('인적공제')) {
      console.log(`Row ${r}: "${text}"`);
    }
  }
}

run().catch(console.error);
