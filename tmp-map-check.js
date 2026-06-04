const fs = require('fs');
const text = fs.readFileSync('js/data.js', 'utf8');
const lines = text.split(/\r?\n/);
let inMap = false;
let mapName = '';
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!inMap) {
    const m = line.match(/^\s*(\w+): \{/);
    if (m) {
      mapName = m[1];
      inMap = true;
    }
  } else {
    if (/tiles\s*:\s*\[/.test(line)) continue;
    if (/^\s*\},?\s*$/.test(line)) {
      inMap = false;
      continue;
    }
    const m = line.match(/'([^']*)'/);
    if (m && (mapName === 'village' || mapName === 'forest')) {
      const row = m[1];
      console.log(`${mapName} line ${i+1} len=${row.length} ${row}`);
    }
  }
}
