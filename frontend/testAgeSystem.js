/**
 * Verification of Age System and Game Registry in Gyannn
 */
const fs = require('fs');
const assert = require('assert');

const content = fs.readFileSync('src/config/gameRegistry.ts', 'utf8');
const entries = content.split(/\{\s*id:\s*'/).slice(1);
const ageGroups = { 5: [], 6: [], 7: [], 8: [] };

for (const e of entries) {
  const id = e.split("'")[0];
  const ageMatch = e.match(/ageGroups:\s*\[([^\]]+)\]/);
  if (ageMatch) {
    const ages = ageMatch[1].split(',').map(s => parseInt(s.trim(), 10));
    ages.forEach(a => {
      if (ageGroups[a]) ageGroups[a].push(id);
    });
  }
}

console.log('=== GYANNN AGE SYSTEM MAPPING AUDIT ===');
console.log('Age 5 Games (' + ageGroups[5].length + '):', ageGroups[5]);
console.log('Age 6 Games (' + ageGroups[6].length + '):', ageGroups[6]);
console.log('Age 7 Games (' + ageGroups[7].length + '):', ageGroups[7]);
console.log('Age 8 Games (' + ageGroups[8].length + '):', ageGroups[8]);

assert.ok(ageGroups[5].length >= 8, 'Age 5 must have foundational games');
assert.ok(ageGroups[6].length >= 10, 'Age 6 must have intermediate games');
assert.ok(ageGroups[7].length >= 10, 'Age 7 must have advanced games');
assert.strictEqual(ageGroups[8].length, 6, 'Age 8 must have exactly 6 chosen challenging games');

// Verify that the 6 chosen games exist in Age 7 or Age 6 as well
for (const g of ageGroups[8]) {
  const inOtherAge = ageGroups[6].includes(g) || ageGroups[7].includes(g);
  assert.ok(inOtherAge, `Game ${g} must be reused from Age 6 or 7 without removing it`);
}

console.log('\n[PASS] Age 8 reuses 6 challenging games without removing them from Age 6 or 7!');
console.log('Age 8 games:', ageGroups[8].join(', '));
