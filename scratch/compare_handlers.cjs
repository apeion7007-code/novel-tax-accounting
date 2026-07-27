const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'App.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

// Find handleSingleYearPdfUpload
const singleUploadStart = content.indexOf('const handleSingleYearPdfUpload = async');
const singleUploadEnd = content.indexOf('const handleFreelancerSingleYearPdfUpload = async');
const singleUploadCode = content.substring(singleUploadStart, singleUploadEnd);

// Find handleReanalyzeYearPdf
const reanalyzeStart = content.indexOf('const handleReanalyzeYearPdf = async');
const reanalyzeEnd = content.indexOf('const handleFreelancerSingleYearPdfUpload = async'); // wait, let's search for the end
const reanalyzeCode = content.substring(reanalyzeStart, reanalyzeStart + 2000);

console.log('=== SINGLE YEAR PDF UPLOAD ===');
console.log(singleUploadCode.substring(0, 1500));

console.log('\n=== REANALYZE YEAR PDF ===');
console.log(reanalyzeCode.substring(0, 1500));
