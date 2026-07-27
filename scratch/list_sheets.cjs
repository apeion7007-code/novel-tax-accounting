const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '2023년 귀속 소득세액공제신고서_.xlsx');
  await wb.xlsx.readFile(filePath);
  
  console.log('Worksheets:');
  wb.worksheets.forEach((sheet, idx) => {
    console.log(`  - Index: ${idx + 1}, Name: "${sheet.name}", Rows: ${sheet.rowCount}`);
  });
}

run().catch(console.error);
