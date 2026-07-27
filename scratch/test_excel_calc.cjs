const rrnVal = "960126-1234567".replace(/-/g, '').trim();
const residentAddress = "2022-04-01"; // example employment date

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

console.log('birthYear:', birthYear);
console.log('birthMonth:', birthMonth);
console.log('birthDay:', birthDay);

let ageAtEmployment = '';
if (birthYear > 0 && residentAddress) {
  const empParts = residentAddress.split('-');
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

console.log('ageAtEmployment:', ageAtEmployment);
