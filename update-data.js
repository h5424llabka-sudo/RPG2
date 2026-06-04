const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'js', 'data.js');
let data = fs.readFileSync(dataFile, 'utf8');

const newNpcDefs = `const NPC_DEFS = {
  // ================================
  // 第1章: 最初の村 (village1)
  // ================================
  village1: [
    { id:'elder', x:7, y:4, dir:'down', color:'#888855', name:'村長', dialogue:[
      'かなとよ、よく来たな。',
      '魔物たちが突然現れ、人々をさらっていったんじゃ。',
      'まずは東にある「次の村」へ向かい、情報を集めるのじゃ！'] },
    { id:'innkeeper', x:5, y:9, dir:'down', color:'#aa7744', name:'宿屋のおじさん', dialogue:['宿屋へようこそ！','一泊10Gで体を休めていけ。'], isInn: true },
    { id:'kid', x:16, y:9, dir:'right', color:'#ffcc66', name:'村の子供', dialogue:['東にあるのが次の村だよ！'] },
  ],
  // ================================
  // 第1章: 次の村 (village2)
  // ================================
  village2: [
    { id:'neighbor', x:14, y:5, dir:'left', color:'#aa8866', name:'近所のおばさん', dialogue:[
      'かなとくん！大変よ！',
      'ままさんは魔物にさらわれてしまったわ。',
      'ここから南の「まが谷のダンジョン」に囚われているらしいの！',
      'お願い、助けてあげて！'] },
    { id:'innkeeper2', x:5, y:9, dir:'down', color:'#aa7744', name:'宿屋のおじさん', dialogue:['宿屋へようこそ！','一泊10Gだよ。'], isInn: true },
    { id:'woodsman', x:10, y:12, dir:'right', color:'#886633', name:'木こりのおじさん', dialogue:['ダンジョンの奥には凶悪な番人がいるらしい。','しっかり準備していくんだぞ。'] },
  ],
  // ================================
  // 第1章: まが谷の廃小屋（ダンジョン）
  // ================================
  dungeon1: [
    { id:'mama', x:10, y:11, dir:'down', color:'#ff88aa', name:'まま', dialogue:[
      'かなと！よかった、来てくれたのね！',
      '魔物にさらわれてここに閉じ込められていたの。',
      '新しいお弁当のレシピを思いついたわ。',
      '一緒に帰りましょう！'], isRescue: true, rescueChar: 'mama', requiresBossDefeated: true },
  ],
};`;

function generateArea(num, w, h, enemies) {
  let tiles = [];
  tiles.push('W'.repeat(w));
  tiles.push('W'.repeat(w));
  for(let i=0; i<h-4; i++) {
    tiles.push('W' + 'G'.repeat(w-2) + 'W');
  }
  tiles.push('W'.repeat(w));
  tiles.push('W'.repeat(w));
  return `  area${num}: { name:'エリア${num}', w:${w}, h:${h}, bgm:'forest',
    enemies:${JSON.stringify(enemies)}, encounterRate:0.04, encounterTiles:['grass'], encounter:true,
    startX:2, startY:10,
    exits:[
      ${num > 1 ? `{ x:1, y:10, map:'area${num-1}', toX:${w-3}, toY:10 },` : ''}
      ${num < 7 ? `{ x:${w-2}, y:10, map:'area${num+1}', toX:2, toY:10 },` : ''}
    ],
    tiles:[
${tiles.map(t => "      '" + t + "',").join('\\n')}
    ].reverse() },`;
}

const newMapDataHeader = `const MAP_DATA = {
  // =============================
  // 最初の村 (village1)
  // =============================
  village1: { name:'最初の村', w:25, h:20, bgm:'village', enemies:[], encounter:false,
    startX:12, startY:17,
    exits: [ { x:12, y:1, map:'area1', toX:5, toY:20 } ], // area1のx:5,y:20へ
    tiles:[
      'WWWWWWWWWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWWWWWWWWW',
      'WGGGGGGGGGGGGGGGGGGGGGGGW',
      'WGHHHGGGGGGGGGGGGGHHHGGGW',
      'WGHHHGGGGGGGGGGGGGHHHGGGW',
      'WGGGGGGRRRRRGGGGGGGGGGGGW',
      'WGGGGGGGGGGGGGGGGGGGGGXGW',
      'WGXGGGGIGGGGGGGGGGGGGGGGW',
      'WGGGGGGGGRGGGGGGGGGGGGGGW',
      'WGGGGGGGGRGGGGGGGGGGGGGGW',
      'WGGGGGIGGRGGGGHHHHGGGGGGW',
      'WGGGGGGGGRGGGGHHHHGGGGGGW',
      'WGGGGGGGGRGGGGGGGGGGGGGGW',
      'WGGGGGGGGGGGGGGGGGGGGGGGW',
      'WGGGGGGGGGGGGGGGGGGGGGXGW',
      'WGGGGGGGGGGGGGGGGGGGGGGGW',
      'WGGGGGGGGGGGGGGGGGGGGGGGW',
      'WGGGGGGGGGGGGGGGGGGGGGGW',
      'WGGGGGGGGGGEGGGGGGGGGGGW',
      'WWWWWWWWWWWWWWWWWWWWWWWWW',
    ].reverse() },
  // =============================
  // 次の村 (village2)
  // =============================
  village2: { name:'次の村', w:25, h:20, bgm:'village', enemies:[], encounter:false,
    startX:12, startY:17,
    exits: [ { x:12, y:1, map:'area1', toX:24, toY:20 } ], // area1のx:24,y:20へ
    tiles:[
      'WWWWWWWWWWWWWWWWWWWWWWWWW',
      'WGGGGGGGGGGGGGGGGGGGGGGGW',
      'WGGGGGGGGGGGGGGGGGGGGGGGW',
      'WGHHHGGGGGGGGGGGGGGGGGGGW',
      'WGHHHGGGGRRRRRRRGGGGGGGGW',
      'WGGGRRGGGGGGGGGGGGGGGGGGW',
      'WGGGGRGGGGGGGGGGGGGGGGGGW',
      'WXGGGGGGGGGGGGGGGGGGGGGGW',
      'WGGGGGGGGGGRGGGGIGGGGGGGW',
      'WGGGGGGGGGGRGGGGHHGGGGGGW',
      'WGGGGGGGGGGRGGGGHHGGGGGGW',
      'WGGGGGGGGGGGGGGGGGGGGGGGW',
      'WGGGGGGGGGGGGGGGGGGGGGGGW',
      'WGGGGGGGGGGGGGGGGGGGGGGGW',
      'WGGGGGGGGGGGGGGGGGGGGGGGW',
      'WGGGGGGGGGGGGGGGGGGGGGGGW',
      'WGGGGGGGGGGGGGGGGGGGGGGGW',
      'WGGGGGGGGGGEGGGGGGGGGGGGW',
      'WGGGGGGGGGGGGGGGGGGGGGGGW',
      'WWWWWWWWWWWWWWWWWWWWWWWWW',
    ].reverse() },
  // =============================
  // まが谷の廃小屋（ダンジョン、w:20 h:14）
  // =============================
  dungeon1: { name:'まが谷の廃小屋', w:20, h:14, bgm:'tower',
    enemies:['ghost'], encounterRate:0.05, encounter:true,
    startX:10, startY:2,
    exits:[
      { x:10, y:1, map:'area1', toX:15, toY:5 },
    ],
    boss:{ id:'dungeon1Boss', x:10, y:9, enemy:'boss', defeated:false,
      preText:['邪悪な魔力が充満している…','「魔力充電鬼」が現れた！'],
      postText:['魔力充電鬼が消滅した！','奥の部屋の鎖が解けた！','ままを助けに行こう！'] },
    tiles:[
      'LLLLLLLLLLLLLLLLLLLL',
      'LFFFFFFFFFFFFFFFFFFL',
      'LFFFFFFFFFFFFFFFFFFL',
      'LLLLLLLLLLFLLLLLLLLL',
      'LFFFFFFFFFFFFFFFFFFL',
      'LFFFFFFFFFFFFFFFFFFL',
      'LFFFFFFFFFFFFFFFFFFL',
      'LFFFFFFFFFFFFFFFFFFL',
      'LFFFFFFFFFFFFFFFFFFL',
      'LFFFFFFFFFFFFFFFFFFL',
      'LFFFFFFFFFFFFFFFFFFL',
      'LFFFFFFFFFFFFFFFFFFL',
      'LLLLLLLLLLELLLLLLLLL',
      'LLLLLLLLLLLLLLLLLLLL',
    ].reverse() },
  // =============================
  // エリア１（フィールド）
  // =============================
  area1: { name:'エリア１', w:30, h:25, bgm:'forest',
    enemies:['slime', 'ghost'], encounterRate:0.04, encounterTiles:['grass'], encounter:true,
    startX:5, startY:19, // 初期スポーンは村1の前のイメージ
    exits:[
      { x:5,  y:20, map:'village1', toX:12, toY:2 }, // 上の方(house)
      { x:24, y:20, map:'village2', toX:12, toY:2 }, // 右上の方(house)
      { x:15, y:5,  map:'dungeon1', toX:10, toY:2 }, // 下の方(house)
      { x:28, y:12, map:'area2',    toX:2,  toY:10 }, // 右端からエリア2へ
    ],
    tiles:[
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'WWWWWWGGGGGGGGGGGGGGGGGGWWWWWW',
      'WWWWGGGGGGGGGGGGGGGGGGGGGGWWWW',
      'WWGGGHGGGGGGGGGGGGGGGGHGGGGGWW',
      'WWGGGGGGGGGGGGGGGGGGGGGGGGGGWW',
      'WWGGGGGGGGGGGGGGGGGGGGGGGGGGWW',
      'WWGGGGGGTTTTTTTTTTTTGGGGGGGGWW',
      'WWGGGGGGTTTTTTTTTTTTGGGGGGGGWW',
      'WWGGGGGGTTTTTTTTTTTTGGGGGGGGWW',
      'WWGGGGGGGGGGGGGGGGGGGGGGGGGGWW',
      'WWGGGGGGGGGGGGGGGGGGGGGGGGGGWW',
      'WWGGGGGGGGGGGGGGGGGGGGGGGGGGWW',
      'WWGGGGGGEGGGGGGGGGGGGGGGGGGGWW',
      'WWGGGGGGGGGGGGGGGGGGGGGGGGGGWW',
      'WWGGGGGGGGGGGGGGGGGGGGGGGGGGWW',
      'WWGGGGGGGGGGGGGGGGGGGGGGGGGGWW',
      'WWGGGGGGGGGGGGGGGGGGGGGGGGGGWW',
      'WWGGGGGGGGGGGGGGGGGGGGGGGGGGWW',
      'WWGGGGGGGGGGGGGHGGGGGGGGGGGGWW',
      'WWWWGGGGGGGGGGGGGGGGGGGGGGWWWW',
      'WWWWWWGGGGGGGGGGGGGGGGGGWWWWWW',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ].reverse() },
`;

const areas = [
  generateArea(2, 20, 20, ['slime_lv2', 'wolf']),
  generateArea(3, 20, 20, ['ghost_lv2', 'fairy']),
  generateArea(4, 20, 20, ['wolf_lv2', 'slime_lv3']),
  generateArea(5, 20, 20, ['fairy_lv2', 'ghost_lv3']),
  generateArea(6, 20, 20, ['wolf_lv3', 'fairy_lv3']),
  generateArea(7, 20, 20, ['boss'])
];

const newMapData = newMapDataHeader + '\\n' + areas.join('\\n') + '\\n};\n';

// Replace NPC_DEFS
data = data.replace(/const NPC_DEFS = \{[\s\S]*?\n\};\n/, newNpcDefs + '\n');
// Replace MAP_DATA
data = data.replace(/const MAP_DATA = \{[\s\S]*?\n\};\n/, newMapData);

fs.writeFileSync(dataFile, data, 'utf8');
console.log('Successfully updated data.js');
