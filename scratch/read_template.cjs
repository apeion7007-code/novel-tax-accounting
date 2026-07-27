const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '2.국세기본법 제16호의2 과세표준및세액의결정청구서,경정청구서.xlsx');
  await wb.xlsx.readFile(filePath);
  const sheet = wb.getWorksheet(1);
  console.log(`Sheet name: ${sheet.name}, rows: ${sheet.rowCount}, cols: ${sheet.columnCount}`);

  for (let r = 1; r <= 30; r++) {
    const rowValues = [];
    for (let c = 1; c <= 15; c++) {
      const cell = sheet.getRow(r).getCell(c);
      const val = cell.value;
      let text = '';
      if (val && typeof val === 'object' && val.richText) {
        text = val.richText.map(t => t.text).join('');
      } else if (val !== null && val !== undefined) {
        text = String(val);
      }
      rowValues.push(`[${c}:${text.replace(/\s+/g, ' ').trim()}]`);
    }
    console.log(`Row ${r}: ${rowValues.join(' | ')}`);
  }
}

run().catch(console.error);
