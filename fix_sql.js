const fs = require('fs');
const path = 'C:/Users/analistasistema/Desktop/export_temp.sql';
const outPath = 'C:/Users/analistasistema/Desktop/railway_TOTAL_FIX.sql';

let data = fs.readFileSync(path, 'utf8');

// Remove BOM
if (data.charCodeAt(0) === 0xFEFF) {
    data = data.slice(1);
}

// Fix Collation
data = data.replace(/utf8mb4_uca1400_ai_ci/g, 'utf8mb4_unicode_ci');

// Remove Duplicate Constraint Names (leave the Foreign Key part)
data = data.replace(/CONSTRAINT `[^`]+`/g, '');

// Remove Database/Use instructions
data = data.replace(/CREATE DATABASE [^;]+;/g, '');
data = data.replace(/USE [^;]+;/g, '');

// Wrap with check overrides
const finalData = 'SET FOREIGN_KEY_CHECKS = 0;\nSET NAMES utf8mb4;\n' + data + '\nSET FOREIGN_KEY_CHECKS = 1;';

fs.writeFileSync(outPath, finalData, 'utf8');
console.log('File generated successfully at ' + outPath);
