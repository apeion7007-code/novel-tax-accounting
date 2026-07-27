const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '2.국세기본법 제16호의2 과세표준및세액의결정청구서,경정청구서.xlsx');
  await wb.xlsx.readFile(filePath);
  const sheet = wb.getWorksheet(1);
  console.log(`Sheet name: ${sheet.name}, rows: ${sheet.rowCount}`);

  for (let r = 1; r <= 20; r++) {
    const row = sheet.getRow(r);
    console.log(`--- Row ${r} (height: ${row.height}) ---`);
    for (let c = 1; c <= 15; c++) {
      const cell = row.getCell(c);
      const colLetter = excelColumnName(c);
      const val = cell.value;
      let text = '';
      if (val && typeof val === 'object' && val.richText) {
        text = val.richText.map(t => t.text).join('');
      } else if (val !== null && val !== undefined) {
        text = JSON.stringify(val);
      }
      const mergedInfo = cell.isMerged ? '(Merged)' : '';
      if (text || cell.isMerged) {
        console.log(`  Cell ${colLetter}${r}: ${text} ${mergedInfo}`);
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
