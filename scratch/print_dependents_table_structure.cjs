const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '2023년 귀속 소득세액공제신고서_.xlsx');
  await wb.xlsx.readFile(filePath);
  
  const sheet = wb.worksheets[1];
  console.log(`Sheet name: ${sheet.name}`);

  for (let r = 16; r <= 35; r++) {
    const row = sheet.getRow(r);
    const valB = row.getCell(2).value;
    const valC = row.getCell(3).value;
    const valR = row.getCell(18).value; // Col R is Col 18
    let textB = getCellText(valB);
    let textC = getCellText(valC);
    let textR = getCellText(valR);
    console.log(`Row ${r}: B="${textB}" | C="${textC}" | R="${textR}"`);
  }
}

function getCellText(val) {
  if (val && typeof val === 'object' && val.richText) {
    return val.richText.map(t => t.text).join('').replace(/\s+/g, ' ').trim();
  } else if (val !== null && val !== undefined) {
    return String(val).replace(/\s+/g, ' ').trim();
  }
  return '';
}

run().catch(console.error);
