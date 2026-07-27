const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '중소기업 취업자 소득세 감면 대상 명세서.xlsx');
  await wb.xlsx.readFile(filePath);
  
  const sheet = wb.worksheets[0];
  console.log(`Sheet name: ${sheet.name}`);
  console.log(`Merged Ranges:`);
  
  const merges = sheet.model.merges || [];
  merges.forEach(m => {
    console.log(`  - ${m}`);
  });
}

run().catch(console.error);
