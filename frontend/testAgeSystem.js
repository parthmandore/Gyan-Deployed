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

assert.ok(ageGroups[5].length >= 20, `Age 5 must have at least 20 games, found ${ageGroups[5].length}`);
assert.ok(ageGroups[6].length >= 20, `Age 6 must have at least 20 games, found ${ageGroups[6].length}`);
assert.ok(ageGroups[7].length >= 20, `Age 7 must have at least 20 games, found ${ageGroups[7].length}`);
assert.ok(ageGroups[8].length >= 20, `Age 8 must have at least 20 games, found ${ageGroups[8].length}`);

// Check 5-6 union and 7-8 union
const age56 = Array.from(new Set([...ageGroups[5], ...ageGroups[6]]));
const age78 = Array.from(new Set([...ageGroups[7], ...ageGroups[8]]));
assert.ok(age56.length >= 20, `Ages 5-6 union must have >= 20 games, found ${age56.length}`);
assert.ok(age78.length >= 20, `Ages 7-8 union must have >= 20 games, found ${age78.length}`);

console.log('\n[PASS] Phase 5 Age Requirements Satisfied!');
console.log(`Age 5: ${ageGroups[5].length} games`);
console.log(`Age 6: ${ageGroups[6].length} games`);
console.log(`Ages 5-6 unique games: ${age56.length}`);
console.log(`Age 7: ${ageGroups[7].length} games`);
console.log(`Age 8: ${ageGroups[8].length} games`);
console.log(`Ages 7-8 unique games: ${age78.length}`);

