const gedcom = require('gedcom');
const fs = require('fs');

const content = fs.readFileSync('sample-family.ged', 'utf8');
const parsed = gedcom.parse(content);

console.log('Root type:', parsed.type);
console.log('Children count:', parsed.children?.length);

// Find INDI records
const indis = parsed.children?.filter(c => c.type === 'INDI') || [];
console.log('\nFound', indis.length, 'INDI records');

if (indis.length > 0) {
  console.log('\nFirst INDI:', JSON.stringify(indis[0], null, 2));
}

// Find FAM records
const fams = parsed.children?.filter(c => c.type === 'FAM') || [];
console.log('\nFound', fams.length, 'FAM records');

if (fams.length > 0) {
  console.log('\nFirst FAM:', JSON.stringify(fams[0], null, 2));
}
