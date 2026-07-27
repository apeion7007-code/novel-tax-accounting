const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function inspectTemplate(fileName) {
  const wb = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'public', fileName);
  await wb.xlsx.readFile(filePath);
  
  console.log(`\n========================================`);
  console.log(`TEMPLATE: ${fileName}`);
  console.log(`========================================`);
  
  wb.worksheets.forEach((sheet, idx) => {
    console.log(`Worksheet [${idx}]: ${sheet.name}`);
    
    // Print row heights
    const rowHeights = [];
    for (let r = 1; r <= sheet.rowCount; r++) {
      const height = sheet.getRow(r).height;
      if (height !== undefined) {
        rowHeights.push(`Row ${r}: ${height}`);
      }
    }
    console.log(`  Row heights with custom values:`, rowHeights.slice(0, 15).join(', '));
    
    // Find non-empty cells
    const cells = [];
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        const value = cell.value;
        const font = cell.font ? `${cell.font.name || 'default'} ${cell.font.size || 'default'}pt` : 'no font';
        const alignment = cell.alignment ? JSON.stringify(cell.alignment) : 'no alignment';
        
        cells.push({
          address: cell.address,
          row: rowNumber,
          col: colNumber,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          font,
          alignment
        });
      });
    });
    
    console.log(`  Total non-empty cells: ${cells.length}`);
    console.log(`  Sample cells (first 40 non-empty):`);
    cells.slice(0, 40).forEach(c => {
      console.log(`    [${c.address}] Value: "${c.value.substring(0, 50)}" | Font: ${c.font} | Alignment: ${c.alignment}`);
    });
  });
}

async function run() {
  await inspectTemplate('2.국세기본법 제16호의2 과세표준및세액의결정청구서,경정청구서.xlsx');
  await inspectTemplate('2023년 귀속 소득세액공제신고서_.xlsx');
  await inspectTemplate('중소기업 취업자 소득세 감면 대상 명세서.xlsx');
}

run().catch(console.error);
