const fs = require('fs');
let content = fs.readFileSync('src/Screens/Admin/LoanDetailsBranchSHG/LoanDetailsBranchSHG.jsx', 'utf8');
content = content.replace(/LoanDetailsBranchSHG/g, 'LoanDetailsBranchGroup');
content = content.replace(/Loan Recovery Of SHG/g, 'Loan Recovery Of Group');
fs.writeFileSync('src/Screens/Admin/LoanDetailsBranchGroup/LoanDetailsBranchGroup.jsx', content, 'utf8');
console.log("Replaced successfully!");
