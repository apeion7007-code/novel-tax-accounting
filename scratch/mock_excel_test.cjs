const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Mock data representing a typical regForm
const regForm = {
  name: "TEST USER",
  foreignerNumber: "960126-1234567",
  residentAddress: "2022-04-01", // employment date
  nationality: "인도네시아",
  visaType: "E9",
  years: [
    {
      year: "2023",
      active: true,
      workPlace: "예인산업",
      businessNumber: "606-33-10056"
    }
  ]
};

// Simplified version of the SME age calculation in excelGenerator.ts
function runCalc() {
  const latestYrData = regForm.years[regForm.years.length - 1];
  const companyName = latestYrData.workPlace || '';
  const bNum = latestYrData.businessNumber || latestYrData.companyRegNum || '';

  const rrnVal = regForm.foreignerNumber ? regForm.foreignerNumber.replace(/-/g, '').trim() : '';
  let birthYear = 0;
  let birthMonth = 0;
  let birthDay = 0;
  
  if (rrnVal.length >= 7) {
    const yy2 = Number(rrnVal.substring(0, 2));
    const mm2 = Number(rrnVal.substring(2, 4));
    const dd2 = Number(rrnVal.substring(4, 6));
    const genderChar = rrnVal.charAt(6);
    if (['1', '2', '5', '6'].includes(genderChar)) {
      birthYear = 1900 + yy2;
    } else if (['3', '4', '7', '8'].includes(genderChar)) {
      birthYear = 2000 + yy2;
    } else {
      birthYear = (yy2 > 30) ? 1900 + yy2 : 2000 + yy2;
    }
    birthMonth = mm2;
    birthDay = dd2;
  }

  let ageAtEmployment = '';
  if (birthYear > 0 && regForm.residentAddress) {
    const empParts = regForm.residentAddress.split('-');
    if (empParts.length === 3) {
      const empYear = Number(empParts[0]);
      const empMonth = Number(empParts[1]);
      const empDay = Number(empParts[2]);
      let age = empYear - birthYear;
      if (empMonth < birthMonth || (empMonth === birthMonth && empDay < birthDay)) {
        age--;
      }
      ageAtEmployment = String(age);
    }
  }

  console.log('rrnVal:', rrnVal);
  console.log('birthYear:', birthYear);
  console.log('ageAtEmployment:', ageAtEmployment);
}

runCalc();
