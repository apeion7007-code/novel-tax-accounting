const ExcelJS = require('exceljs');
const path = require('path');

function getCellText(value) {
  if (!value) return '';
  if (typeof value === 'object') {
    if (value.richText) {
      return value.richText.map(t => t.text).join('');
    }
    if (value.text) return value.text;
    return JSON.stringify(value);
  }
  return String(value);
}

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', '2.국세기본법 제16호의2 과세표준및세액의결정청구서,경정청구서.xlsx');
  await wb.xlsx.readFile(filePath);
  
  const sheet = wb.worksheets[0];
  console.log('--- Top Part (Rows 4-9) ---');
  for (let r = 4; r <= 9; r++) {
    const row = sheet.getRow(r);
    let cellsText = [];
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      const txt = getCellText(cell.value);
      if (txt) {
        cellsText.push(`Col ${col}(${cell.address}): "${txt}"`);
      }
    });
    console.log(`Row ${r}:`, cellsText.join(' | '));
  }

  console.log('\n--- Bottom Part (Rows 28-35) ---');
  for (let r = 28; r <= 35; r++) {
    const row = sheet.getRow(r);
    let cellsText = [];
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      const txt = getCellText(cell.value);
      if (txt) {
        cellsText.push(`Col ${col}(${cell.address}): "${txt}"`);
      }
    });
    console.log(`Row ${r}:`, cellsText.join(' | '));
  }
}

run().catch(console.error);
