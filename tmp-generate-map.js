function g(char, count) { return char.repeat(count); }
const village = [
  g('L',25),
  'L' + g('G',23) + 'L',
  'L' + 'HH' + g('G',4) + 'HH' + g('G',11) + 'L',
  'L' + 'HHG' + 'RRG' + g('G',6) + 'HH' + 'RRRRRR' + 'RG' + g('G',5) + 'L',
  'L' + g('G',3) + 'RRG' + g('G',12) + 'R' + g('G',5) + 'L',
  'L' + g('G',4) + 'R' + g('G',12) + 'R' + g('G',5) + 'L',
  'L' + 'X' + g('G',3) + 'R'.repeat(6) + 'G'.repeat(4) + 'R' + 'G'.repeat(2) + 'XX' + 'G' + 'L',
  'L' + g('G',8) + 'R' + g('G',4) + 'I' + g('G',4) + 'L',
  'L' + g('G',8) + 'R' + g('G',4) + 'H'.repeat(2) + g('G',3) + 'L',
  'L' + g('G',8) + 'R' + g('G',4) + 'H'.repeat(2) + g('G',3) + 'L',
  'L' + g('G',21) + 'L',
  'L' + g('G',21) + 'L',
  'L' + g('G',21) + 'L',
  'L' + g('G',21) + 'L',
  'L' + g('G',21) + 'L',
  'L' + g('G',21) + 'L',
  'L' + g('G',21) + 'L',
  'L' + g('L',11) + 'E' + g('L',12),
];
const forest = [
  'L' + g('L',11) + 'E' + g('L',12),
  'L' + g('T',10) + g('G',3) + g('T',10) + 'L',
  'L' + g('T',2) + g('G',3) + g('T',4) + g('G',3) + g('T',4) + g('G',4) + 'L',
  'L' + g('T',2) + 'GKK' + g('G',10) + 'KKG' + g('T',4) + 'L',
  'L' + g('T',2) + g('G',5) + g('T',8) + g('G',5) + 'L',
  'L' + g('T',2) + g('G',5) + g('T',3) + g('G',3) + g('T',2) + g('G',5) + 'L',
  'L' + g('T',2) + g('G',17) + 'L',
  'L' + g('T',2) + g('G',3) + g('T',13) + g('G',3) + 'L',
  'L' + g('T',2) + g('G',3) + 'T' + g('G',6) + g('T',3) + g('G',3) + 'L',
  'L' + g('T',2) + g('G',3) + 'T' + g('G',6) + g('T',3) + g('G',3) + 'L',
  'L' + g('T',2) + g('G',7) + g('T',8) + g('G',3) + 'L',
  'L' + g('T',2) + g('G',3) + 'T' + g('G',2) + 'TT' + g('G',2) + 'T' + g('G',3) + 'T' + g('G',3) + 'L',
  'L' + g('T',2) + g('G',17) + 'L',
  'L' + g('T',2) + g('G',3) + g('T',13) + g('G',3) + 'L',
  'L' + g('T',2) + g('G',3) + g('T',13) + g('G',3) + 'L',
  'L' + g('T',2) + g('G',17) + 'L',
  'L' + g('T',10) + 'RR' + g('T',10) + 'L',
  g('L',25),
];
for (const [name, arr] of [['village', village], ['forest', forest]]) {
  console.log(name, arr.length, arr.every(r => r.length === 25));
  arr.forEach((r, i) => console.log(i, r.length, r));
}
