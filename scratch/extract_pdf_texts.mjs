import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const workerPath = path.resolve(__dirname, '..', 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
    
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
