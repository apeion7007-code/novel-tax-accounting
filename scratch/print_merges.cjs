const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '2.국세기본법 제16호의2 과세표준및세액의결정청구서,경정청구서.xlsx');
  await wb.xlsx.readFile(filePath);
  const sheet = wb.getWorksheet(1);
  console.log(`Sheet name: ${sheet.name}`);
  console.log(`Merged Ranges:`);
  
  // Print all merged ranges
  const merges = sheet.model.merges || [];
  merges.forEach(m => {
    console.log(`  - ${m}`);
  });
}

run().catch(console.error);
