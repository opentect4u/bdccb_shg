const fs = require('fs');
const src = 'C:\\Users\\ssspl\\.gemini\\antigravity-ide\\brain\\b67d9982-cbec-4506-ae2c-5e9768ff3490\\media__1786445710879.jpg';
const dest1 = 'd:\\Sayantika\\bdccb_shg\\bdccb_shg\\bdccb_shg_frontend\\src\\Assets\\Images\\bdccb_full_logo.jpg';
const dest2 = 'd:\\Sayantika\\bdccb_shg\\bdccb_shg\\bdccb_shg_frontend\\public\\bdccb_full_logo.jpg';
if (fs.existsSync(src)) {
	fs.copyFileSync(src, dest1);
	fs.copyFileSync(src, dest2);
	console.log('SUCCESS_COPIED');
}
