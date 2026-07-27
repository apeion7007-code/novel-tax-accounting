const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '2023년 귀속 소득세액공제신고서_.xlsx');
  await wb.xlsx.readFile(filePath);
  
  const sheet = wb.worksheets[1];

  for (let r = 310; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= 38; c++) {
      const val = row.getCell(c).value;
      let text = '';
      if (val && typeof val === 'object' && val.richText) {
        text = val.richText.map(t => t.text).join('');
      } else if (val !== null && val !== undefined) {
        text = String(val);
      }
      if (text.includes('서명') || text.includes('귀하') || text.includes('년') || text.includes('신고인')) {
        console.log(`Row ${r}, Col ${excelColumnName(c)}: "${text.substring(0, 40)}"`);
      }
    }
  }
}

function excelColumnName(col) {
  let name = '';
  while (col > 0) {
    let temp = (col - 1) % 26;
    name = String.fromCharCode(65 + temp) + name;
    col = Math.floor((col - temp) / 26);
  }
  return name;
}

run().catch(console.error);
