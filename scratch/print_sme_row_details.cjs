const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '중소기업 취업자 소득세 감면 대상 명세서.xlsx');
  await wb.xlsx.readFile(filePath);
  
  const sheet = wb.worksheets[0];
  console.log(`Sheet name: ${sheet.name}`);

  const rowsToPrint = [4, 5, 6, 11, 12];
  rowsToPrint.forEach(r => {
    const row = sheet.getRow(r);
    console.log(`--- Row ${r} ---`);
    for (let c = 1; c <= 15; c++) {
      const cell = row.getCell(c);
      const val = cell.value;
      let text = '';
      if (val && typeof val === 'object' && val.richText) {
        text = val.richText.map(t => t.text).join('');
      } else if (val !== null && val !== undefined) {
        text = String(val);
      }
      console.log(`  Cell ${excelColumnName(c)}${r}: "${text}" (isMerged: ${cell.isMerged})`);
    }
  });
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
