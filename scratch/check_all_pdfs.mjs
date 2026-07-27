import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock browser globals for Node.js
global.DOMMatrix = class DOMMatrix {
  constructor() {
    this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
  }
};
Object.defineProperty(global, 'crypto', {
  value: (await import('crypto')).webcrypto,
  writable: true,
  configurable: true
});

async function run() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const workerPath = path.resolve(__dirname, '..', 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  const years = ['2022', '2023', '2024', '2025'];
  for (const yr of years) {
    try {
      const pdfPath = path.join(__dirname, '..', 'public', `${yr}.pdf`);
      if (!fs.existsSync(pdfPath)) continue;

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
      
      console.log(`=== ${yr}.pdf ===`);
      // Search for any line containing "감면"
      const lines = fullText.split('\n');
      for (const line of lines) {
        if (line.includes('감면')) {
          console.log('FOUND LINE:', line);
        }
      }
    } catch (err) {
      console.error(`Error parsing ${yr}.pdf:`, err);
    }
  }
}

run();
