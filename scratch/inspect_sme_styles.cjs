const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '중소기업 취업자 소득세 감면 대상 명세서.xlsx');
  await wb.xlsx.readFile(filePath);
  
  const sheet = wb.worksheets[0];
  console.log(`Sheet name: ${sheet.name}`);

  const checkCells = [
    { name: 'Row 4, Col 3 (Company Name)', r: 4, c: 3 },
    { name: 'Row 4, Col 7 (Biz Number)', r: 4, c: 7 },
    { name: 'Row 5, Col 3 (Address)', r: 5, c: 3 },
    { name: 'Row 5, Col 7 (Industry Code)', r: 5, c: 7 },
    { name: 'Row 11, Col 1 (Employee Name)', r: 11, c: 1 },
    { name: 'Row 11, Col 2 (RRN)', r: 11, c: 2 },
  ];

  for (const item of checkCells) {
    const cell = sheet.getRow(item.r).getCell(item.c);
    console.log(`--- ${item.name} ---`);
    console.log(`  Value: "${cell.value}"`);
    console.log(`  Alignment:`, cell.alignment);
    console.log(`  Font size:`, cell.font ? cell.font.size : 'none');
  }

  for (let r of [4, 5, 6, 11, 12]) {
    console.log(`Row ${r} height: ${sheet.getRow(r).height}`);
  }
}

run().catch(console.error);
