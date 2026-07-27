const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '2.국세기본법 제16호의2 과세표준및세액의결정청구서,경정청구서.xlsx');
  await wb.xlsx.readFile(filePath);
  const sheet = wb.worksheets[0];

  for (let r = 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= sheet.columnCount; c++) {
      const val = row.getCell(c).value;
      let text = '';
      if (val && typeof val === 'object' && val.richText) {
        text = val.richText.map(t => t.text).join('');
      } else if (val !== null && val !== undefined) {
        text = String(val);
      }
      if (text.includes('귀속') || text.includes('년') || text.includes('기간') || text.includes('대상')) {
        console.log(`Row ${r}, Col ${excelColumnName(c)}: "${text}"`);
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
