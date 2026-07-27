const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '2.국세기본법 제16호의2 과세표준및세액의결정청구서,경정청구서.xlsx');
  await wb.xlsx.readFile(filePath);
  const sheet = wb.worksheets[0];

  for (let r = 1; r <= 3; r++) {
    console.log(`Row ${r}:`);
    for (let c = 1; c <= 15; c++) {
      const val = sheet.getRow(r).getCell(c).value;
      if (val) {
        console.log(`  Cell ${excelColumnName(c)}${r}: ${JSON.stringify(val)}`);
      }
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
