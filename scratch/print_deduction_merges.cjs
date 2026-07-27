const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '2023년 귀속 소득세액공제신고서_.xlsx');
  await wb.xlsx.readFile(filePath);
  
  const sheet = wb.worksheets[1];
  console.log(`Sheet name: ${sheet.name}`);
  console.log(`Merged Ranges for Row 307 (or near):`);
  
  const merges = sheet.model.merges || [];
  merges.forEach(m => {
    if (m.includes('307') || m.includes('308')) {
      console.log(`  - ${m}`);
    }
  });
}

run().catch(console.error);
