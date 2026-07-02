const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const csvPath = 'd:\\webviettel\\goicuocviettel.csv';

const results = [];

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log(`Parsed ${results.length} rows from CSV.`);
    if (results.length > 0) {
      console.log("First row fields:", Object.keys(results[0]));
      console.log("First row sample:", JSON.stringify(results[0], null, 2));
      console.log("Last row sample:", JSON.stringify(results[results.length - 1], null, 2));
    }
  });
