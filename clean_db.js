const fs = require('fs');
const path = 'C:/Users/analistasistema/Desktop/export_temp.sql';
const outPath = 'C:/Users/analistasistema/Desktop/railway_FINAL_AUTO.sql';

// Read as buffer to handle encoding better
let buffer = fs.readFileSync(path);
let data;

// Check for UTF-16LE BOM
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    data = buffer.toString('utf16le');
} else {
    data = buffer.toString('utf8');
}

// Remove BOM if present at the start of string
if (data.charCodeAt(0) === 0xFEFF) {
    data = data.slice(1);
}

// 1. Force Collation change everywhere
data = data.replace(/utf8mb4_uca1400_ai_ci/g, 'utf8mb4_unicode_ci');

// 2. Remove any database creation or selection - we'll handle this manually
data = data.replace(/CREATE DATABASE [^;]+;/gi, '');
data = data.replace(/USE [^;]+;/gi, '');

// 3. Remove conflicting constraint names
data = data.replace(/CONSTRAINT `[^`]+`/g, '');

// 4. Wrap with safety checks
const finalData = 'SET FOREIGN_KEY_CHECKS = 0;\nSET NAMES utf8mb4;\n' + data + '\nSET FOREIGN_KEY_CHECKS = 1;';

fs.writeFileSync(outPath, finalData, 'utf8');
console.log('Cleaned file generated at ' + outPath);
