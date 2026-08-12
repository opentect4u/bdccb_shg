const fs = require('fs');
const path = require('path');

const logoSrcPath = 'C:\\Users\\ssspl\\.gemini\\antigravity-ide\\brain\\b67d9982-cbec-4506-ae2c-5e9768ff3490\\bdccb_logo_emblem_1786434981471.png';
const logoSrcPath2 = 'C:\\Users\\ssspl\\.gemini\\antigravity-ide\\brain\\b67d9982-cbec-4506-ae2c-5e9768ff3490\\media__1786437576215.png';
const fullLogoSrcPath = 'C:\\Users\\ssspl\\.gemini\\antigravity-ide\\brain\\b67d9982-cbec-4506-ae2c-5e9768ff3490\\media__1786445710879.jpg';

const targetLogoPublic = path.join(__dirname, 'public', 'bdccb_logo_emblem.png');
const targetLogoAssets = path.join(__dirname, 'src', 'Assets', 'Images', 'bdccb_logo_emblem.png');

const targetFullLogoPublic = path.join(__dirname, 'public', 'bdccb_full_logo.png');
const targetFullLogoAssets = path.join(__dirname, 'src', 'Assets', 'Images', 'bdccb_full_logo.png');

try {
	let logoFile = fs.existsSync(logoSrcPath) ? logoSrcPath : logoSrcPath2;
	if (fs.existsSync(logoFile)) {
		const logoData = fs.readFileSync(logoFile);
		fs.writeFileSync(targetLogoPublic, logoData);
		fs.writeFileSync(targetLogoAssets, logoData);
	}
	if (fs.existsSync(fullLogoSrcPath)) {
		const fullLogoData = fs.readFileSync(fullLogoSrcPath);
		fs.writeFileSync(targetFullLogoPublic, fullLogoData);
		fs.writeFileSync(targetFullLogoAssets, fullLogoData);
		console.log('BDCCB Full Logo & Emblem copied successfully!');
	}
} catch (err) {
	console.error('Error copying logo file:', err);
}
