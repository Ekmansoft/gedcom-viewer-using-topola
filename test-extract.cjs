const gedcom = require('gedcom');
const fs = require('fs');

// Test the parser logic
const content = fs.readFileSync('sample-family.ged', 'utf8');
const parsed = gedcom.parse(content);

console.log('Root type:', parsed.type);
console.log('Children count:', parsed.children?.length);

// Extract individuals
const indis = [];
const fams = [];

parsed.children?.forEach((record) => {
  if (record.type === 'INDI') {
    const indi = {
      id: record.data?.xref_id,
      firstName: '',
      lastName: '',
    };
    
    record.children?.forEach((child) => {
      if (child.type === 'NAME') {
        const nameMatch = child.data?.value?.match(/^([^/]*)\s*\/([^/]+)\//);
        if (nameMatch) {
          indi.firstName = nameMatch[1].trim();
          indi.lastName = nameMatch[2].trim();
        }
      } else if (child.type === 'SEX') {
        indi.sex = child.data?.value;
      } else if (child.type === 'FAMS') {
        if (!indi.fams) indi.fams = [];
        indi.fams.push(child.data?.pointer);
      } else if (child.type === 'FAMC') {
        indi.famc = child.data?.pointer;
      }
    });
    
    indis.push(indi);
  } else if (record.type === 'FAM') {
    const fam = {
      id: record.data?.xref_id,
    };
    
    record.children?.forEach((child) => {
      if (child.type === 'HUSB') {
        fam.husb = child.data?.pointer;
      } else if (child.type === 'WIFE') {
        fam.wife = child.data?.pointer;
      } else if (child.type === 'CHIL') {
        if (!fam.children) fam.children = [];
        fam.children.push(child.data?.pointer);
      }
    });
    
    fams.push(fam);
  }
});

console.log('\n=== EXTRACTED DATA ===');
console.log('Individuals:', indis.length);
console.log('Families:', fams.length);
console.log('\nSample individual:', JSON.stringify(indis[0], null, 2));
console.log('\nSample family:', JSON.stringify(fams[0], null, 2));
