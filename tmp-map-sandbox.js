const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync('js/data.js', 'utf8');
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(code + '\nthis.MAP_DATA = MAP_DATA;', sandbox);
for (const key of ['village','forest']) {
  const map = sandbox.MAP_DATA[key];
  console.log(`MAP ${key} tiles ${map.tiles.length} rows`);
  map.tiles.forEach((row, i) => {
    console.log(`${key} ${i} len=${row.length} ${row}`);
  });
}
