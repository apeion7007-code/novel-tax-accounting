const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '2023년 귀속 소득세액공제신고서_.xlsx');
  await wb.xlsx.readFile(filePath);
  
  const sheet = wb.worksheets[1];
  console.log(`Sheet: ${sheet.name}, RowCount: ${sheet.rowCount}`);

  for (let r = 315; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= 38; c++) {
      const val = row.getCell(c).value;
      if (val) {
        let text = '';
        if (val && typeof val === 'object' && val.richText) {
          text = val.richText.map(t => t.text).join('');
        } else {
          text = String(val);
        }
        console.log(`Row ${r}, Col ${excelColumnName(c)}: "${text.substring(0, 50)}"`);
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
