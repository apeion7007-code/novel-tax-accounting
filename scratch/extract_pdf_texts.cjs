const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const pdfjsLib = require('pdfjs-dist');
    
    // Set worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.js');
    
    const pdfPath = path.join(__dirname, '..', 'public', '2023.pdf');
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    fs.writeFileSync(path.join(__dirname, 'extracted_2023_pdf_text.txt'), fullText);
    console.log('2023 PDF extracted successfully!');
  } catch (err) {
    console.error(err);
  }
}

run();
