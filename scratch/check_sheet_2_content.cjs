const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '2023년 귀속 소득세액공제신고서_.xlsx');
  await wb.xlsx.readFile(filePath);
  
  // Let's get the second sheet by index (0-based)
  const sheet = wb.worksheets[1]; // position 2
  console.log(`Sheet name: ${sheet.name}, rows: ${sheet.rowCount}`);

  // Let's print header rows 4-6
  for (let r = 4; r <= 6; r++) {
    const row = sheet.getRow(r);
    console.log(`--- Row ${r} ---`);
    for (let c = 1; c <= 38; c++) {
      const cell = row.getCell(c);
      const val = cell.value;
      if (val !== null && val !== undefined) {
        console.log(`  Cell ${excelColumnName(c)}${r}: ${JSON.stringify(val)}`);
      }
    }
  }

  // Let's print row 307
  console.log(`--- Row 307 ---`);
  const row307 = sheet.getRow(307);
  for (let c = 1; c <= 38; c++) {
    const cell = row307.getCell(c);
    const val = cell.value;
    if (val !== null && val !== undefined) {
      console.log(`  Cell ${excelColumnName(c)}307: ${JSON.stringify(val)}`);
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
