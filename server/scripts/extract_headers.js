const xlsx = require('xlsx');

const files = [
  'c:\\Users\\analistasistema\\Downloads\\Listado de Requisiciones de Personal.xlsx',
  'c:\\Users\\analistasistema\\Downloads\\Lista de Registros de Contratacion.xlsx',
  'c:\\Users\\analistasistema\\Downloads\\Lista de Registros de Apirantes.xlsx',
  'c:\\Users\\analistasistema\\Downloads\\Lista de Hoja de Vida (1).xlsx'
];

files.forEach(file => {
  try {
    console.log(`\nReading file: ${file}`);
    const workbook = xlsx.readFile(file);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convert logic to safely get headers without printing whole file
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (data.length > 0) {
      console.log('Headers:');
      console.log(JSON.stringify(data[0], null, 2));
      
      // Let's also print 1 sample row to see data examples
      if (data.length > 1) {
        console.log('Sample row:');
        console.log(JSON.stringify(data[1], null, 2));
      }
    } else {
      console.log('File is empty.');
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});
