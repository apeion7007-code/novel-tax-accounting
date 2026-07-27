const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '중소기업 취업자 소득세 감면 대상 명세서.xlsx');
  await wb.xlsx.readFile(filePath);
  
  const sheet = wb.worksheets[0];
  console.log('Row 9 cells:');
  sheet.getRow(9).eachCell((cell, col) => {
    console.log(`  Col ${col} (${cell.address}): "${cell.value}"`);
  });
  
  console.log('Row 10 cells:');
  sheet.getRow(10).eachCell((cell, col) => {
    console.log(`  Col ${col} (${cell.address}): "${cell.value}"`);
  });
}

run().catch(console.error);
