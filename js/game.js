const Input = { keys:{}, pressed:{}, update(){ this.pressed = {}; }, isDown(k){ return !!this.keys[k]; }, wasPressed(k){ return !!this.pressed[k]; } };
window.addEventListener('keydown', e => {
  if (!Input.keys[e.key]) Input.pressed[e.key] = true;
  Input.keys[e.key] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', e => { delete Input.keys[e.key]; });
const DIRECTION_VECTORS = {
  ArrowLeft:  { dx: -1, dy: 0, dir: 'left' },
  ArrowRight: { dx:  1, dy: 0, dir: 'right' },
  ArrowUp:    { dx:  0, dy: 1, dir: 'up' },
  ArrowDown:  { dx:  0, dy: -1, dir: 'down' },
};
function isConfirm() { return Input.wasPressed('z') || Input.wasPressed('Z') || Input.wasPressed('Enter'); }
function isCancel() { return Input.wasPressed('x') || Input.wasPressed('X') || Input.wasPressed('Escape'); }
function getMovementInput() {
  for (const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown']) {
    if (Input.isDown(key)) return DIRECTION_VECTORS[key];
  }
  return null;
}
function canTriggerEncounter(map, tx, ty) {
  if (typeof GameState !== 'undefined' && GameState.debugNoEncounter) return false;
  const tile = getTile(map, tx, ty);
  if (!map.encounter || !map.encounterRate) return false;
  if (Array.isArray(map.encounterTiles)) return map.encounterTiles.includes(tile);
  return tile === 'grass';
}

function getRandomEnemyEncounter(baseEnemies) {
  if (!baseEnemies || baseEnemies.length === 0) return [];
  const pattern = Math.random();
  let enemyTypes = [];
  if (pattern < 0.60) {
    const base = baseEnemies[Math.floor(Math.random() * baseEnemies.length)];
    const level = Math.random() < 0.5 ? '' : (Math.random() < 0.5 ? '_lv2' : '_lv3');
    enemyTypes = [base + level];
  } else if (pattern < 0.80) {
    const base = baseEnemies[Math.floor(Math.random() * baseEnemies.length)];
    const level = Math.random() < 0.5 ? '' : '_lv2';
    enemyTypes = [base + level, base + level];
  } else if (pattern < 0.90) {
    const b1 = baseEnemies[Math.floor(Math.random() * baseEnemies.length)];
    const b2 = baseEnemies[Math.floor(Math.random() * baseEnemies.length)];
    enemyTypes = [b1, b2];
  } else {
    const b1 = baseEnemies[Math.floor(Math.random() * baseEnemies.length)];
    const b2 = baseEnemies[Math.floor(Math.random() * baseEnemies.length)];
    const b3 = baseEnemies[Math.floor(Math.random() * baseEnemies.length)];
    enemyTypes = [b1, b2, b3];
  }
  return enemyTypes;
}
function isEntityBlocking(map, tx, ty) {
  if (map.npcs.some(n => n.alive && n.x === tx && n.y === ty)) return true;
  if (map.boss && !map.boss.defeated && map.boss.x === tx && map.boss.y === ty) return true;
  if (map.chests && map.chests.some(c => !c.opened && c.x === tx && c.y === ty)) return true;
  return false;
}

function getAreaEnemies(x, y) {
  // 魔王の島 (北東)
  if (y > 85 && x > 65) return ['wolf_lv3', 'fairy_lv3'];
  // 大陸6 (北西)
  if (y > 80 && x <= 65) return ['fairy_lv2', 'ghost_lv3'];
  // 大陸5 (東)
  if (y > 50 && x > 75) return ['wolf_lv2', 'slime_lv3'];
  // 大陸4 (西)
  if (y > 55 && x <= 45) return ['ghost_lv2', 'fairy'];
  // 大陸3 (中央)
  if (y > 40 && x > 45 && x <= 75) return ['slime_lv2', 'wolf'];
  // 大陸2 (南東)
  if (y <= 40 && x > 60) return ['slime_lv2', 'wolf'];
  // 大陸1 (南西 - 初期エリア)
  return ['slime', 'ghost'];
}

const GameState = {
  scene:'title', currentMap:null, camera:{x:0,y:0}, party:[], rescuedChars:[], gold:30, totalExp:0,
  defeatedBosses:{}, mapProgress:{}, player:{x:12,y:1,dir:'down',moveTimer:0,walkanim:0}, followers:[], followerHistory:[], dialogue:null, battleData:null, menu:null, stepCount:0, shopOpen:false, endingTriggered:false,
  // ストーリー進行管理
  chapter: 1,
  unlockedSystems: [],
  // Step2: やり込みシステム用フィールド
  inventory: {},   // { itemId: count } 素材アイテム所持数
  gadgets:   {},   // { charKey: gadgetId } 装備中ガジェット
  bentoBag:  [],   // [{ recipeId, name }]  所持お弁当リスト
  photoCollection: {}, // { cardId: { level, count } } 所持写真カード
  albumSlots: [null, null, null], // 装着中の写真カードID（最大3スロット）
};

function initPartyMember(key) {
  const s = CHARACTER_STATS[key];
  return { key, ...s, hp:s.maxHp, mp:s.maxMp, level:1, exp:0, buffAtk:0, buffDef:0, isGuarding:false, isStunned:false, isBlind:false, xpToNext:30 };
}
function initGame() {
  GameState.party = [initPartyMember('kanato')];
  GameState.rescuedChars = ['kanato'];
  GameState.gold = 30;
  GameState.totalExp = 0;
  GameState.defeatedBosses = {};
  GameState.mapProgress = {};
  GameState.followerHistory = [];
  GameState.followers = [];
  GameState.endingTriggered = false;
  // ストーリー進行フラグの初期化
  GameState.chapter = 1;
  GameState.unlockedSystems = [];
  // Step2: やり込みシステムの初期化
  GameState.inventory = {};
  GameState.gadgets   = {};
  GameState.bentoBag  = [];
  GameState.photoCollection = {};
  GameState.albumSlots = [null, null, null];
  loadMap('village1');
}


function loadMap(mapId) {
  const def = MAP_DATA[mapId];
  if (!def) return;
  def.id = mapId;
  const map = buildMap(def);
  GameState.currentMap = map;
  const startX = GameState.mapProgress[mapId+'_startX'] || def.startX;
  const startY = GameState.mapProgress[mapId+'_startY'] || def.startY;
  GameState.player = { x:startX, y:startY, dir:'down', moveTimer:0, walkanim:0, ignoreExit:true };
  GameState.followerHistory = [];
  GameState.followers = GameState.party.slice(1).map((m,i)=>({ key:m.key, x:startX, y:startY+1+i, dir:'down', walkanim:0 }));
  if (def.boss) { map.boss = { ...def.boss, defeated: !!GameState.defeatedBosses[mapId+'_boss'] }; }
  updateCamera();
}

function updateCamera() {
  const p=GameState.player; const map = GameState.currentMap;
  GameState.camera.x = Math.min(Math.max(0, p.x - Math.floor(VIEW_W/2)), map.w - VIEW_W);
  GameState.camera.y = Math.min(Math.max(0, p.y - Math.floor(VIEW_H/2)), map.h - VIEW_H);
}

const MOVE_DELAY = 150;
function updateMap(dt) {
  const gs = GameState;
  
  // デバッグ用: Cキーで最強モード
  if (Input.wasPressed('c') || Input.wasPressed('C')) {
    gs.party.forEach(m => {
      m.level = 99;
      m.maxHp = 999; m.hp = 999;
      m.maxMp = 999; m.mp = 999;
      m.atk = 999; m.def = 999; m.spd = 999;
    });
    startDialogue(['【デバッグ】', '味方全員が最強になった！']);
  }
  
  if (Input.wasPressed('d') || Input.wasPressed('D')) {
    gs.debugNoEncounter = !gs.debugNoEncounter;
    startDialogue(['【デバッグ】', gs.debugNoEncounter ? '敵が出現しなくなりました！' : '敵が出現するようになりました！']);
  }
  
  const p = gs.player;
  const map = gs.currentMap;
  const hasTurtle = gs.rescuedChars.includes('turtle');
  p.moveTimer = Math.max(0, p.moveTimer - dt);
  if (p.moveTimer <= 0) {
    const move = getMovementInput();
    if (move) {
      const { dx, dy, dir } = move;
      p.dir = dir;
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (isPassable(map, nx, ny, hasTurtle) && !isEntityBlocking(map, nx, ny)) {
        gs.followerHistory.unshift({ x:p.x, y:p.y, dir:p.dir });
        if (gs.followerHistory.length > 10) gs.followerHistory.pop();
        p.x = nx; p.y = ny;
        p.walkanim = (p.walkanim + 1) % 3;
        p.moveTimer = MOVE_DELAY;
        gs.stepCount++;
        updateCamera();
        gs.followers.forEach((f, idx) => {
          const hist = gs.followerHistory[idx];
          if (hist) {
            f.x = hist.x;
            f.y = hist.y;
            f.dir = hist.dir;
            f.walkanim = p.walkanim;
          }
        });
        if (canTriggerEncounter(map, nx, ny) && Math.random() < map.encounterRate) {
          let baseEnemies = map.enemies;
          if (map.id === 'world') {
            baseEnemies = getAreaEnemies(nx, ny);
          }
          startBattle(getRandomEnemyEncounter(baseEnemies)); return; 
        }
        const tile = getTile(map, nx, ny);
        if (tile === 'exit') {
          if (p.ignoreExit) {
            // マップに入った直後の出口は無視
          } else {
            // exits配列（複数出口対応）> exitTo > nextMap の順で探索
            const posExit = (map.exits || []).find(e => e.x === nx && e.y === ny);
            const dest = posExit || map.exitTo || map.nextMap;
            if (dest) {
              gs.mapProgress[dest.map + '_startX'] = dest.toX;
              gs.mapProgress[dest.map + '_startY'] = dest.toY;
              loadMap(dest.map);
            }
            return;
          }
        } else {
          p.ignoreExit = false;
        }
      }
    }
  }
  if (gs.interactCooldown > 0) gs.interactCooldown -= dt;
  if (isConfirm() && !(gs.interactCooldown > 0)) {
    const facingX = p.x + (p.dir==='right'?1:p.dir==='left'?-1:0);
    const facingY = p.y + (p.dir==='up'?1:p.dir==='down'?-1:0);
    
    if (map.chests) {
      const chest = map.chests.find(c => c.x === facingX && c.y === facingY && !c.opened);
      if (chest) {
        chest.opened = true;
        let msg = `${chest.item} を手に入れた！`;
        if (chest.item.endsWith('G')) {
          const goldStr = chest.item.replace('G', '');
          const gold = parseInt(goldStr, 10);
          if (!isNaN(gold)) gs.gold += gold;
        } else {
          // アイテムの場合、とりあえずインベントリに入る実装がなければテキストのみ
        }
        startDialogue(['宝箱を開けた！', msg], null, null);
        return;
      }
    }

    const npc = map.npcs.find(n=>n.alive && n.x===facingX && n.y===facingY);
    if (npc) {
      if (npc.requiresBossDefeated && map.boss && !map.boss.defeated) {
        startDialogue(['（まだ強大な魔物の気配がする…！）', '（先にボスを倒さなきゃ！）'], npc, null);
        return;
      }
      startDialogue(npc.dialogue,npc,()=>{
        if (npc.isRescue) {
          const canRescue = !npc.requiresBossDefeated || (map.boss && map.boss.defeated);
          if (canRescue && !gs.rescuedChars.includes(npc.rescueChar)) { 
            rescueCharacter(npc.rescueChar); 
            npc.isRescue=false;
            npc.alive=false;
          }
        }
        if (npc.isInn) {
          if (gs.gold>=10) { gs.gold-=10; gs.party.forEach(m=>{ m.hp=m.maxHp; m.mp=m.maxMp; }); startDialogue(['ぐっすり眠れた！','HP・MPが全回復した！'],null,null); }
          else { startDialogue(['お金が足りないよ！','10Gひつようだよ。'],null,null); }
        }
      });
      return;
    }
    if (map.boss && !map.boss.defeated) {
      const boss=map.boss; const dist=Math.abs(p.x-boss.x)+Math.abs(p.y-boss.y);
      if (dist<=2) {
        startDialogue(boss.preText,null,()=>{
          startBattle(['boss'],true,()=>{
            map.boss.defeated=true; gs.defeatedBosses[map.id+'_boss']=true;
            startDialogue(boss.postText,null,()=>{
              if (map.id==='forest') {
                const dogNpc=map.npcs.find(n=>n.id==='dog'); if (dogNpc) startDialogue(dogNpc.dialogue,dogNpc,()=>{ rescueCharacter('dog'); dogNpc.alive=false; });
              }
            });
          });
        });
      }
    }
  }
  if (isCancel()) openMenu();
}

function rescueCharacter(key) {
  if (GameState.rescuedChars.includes(key)) return;
  GameState.rescuedChars.push(key);
  GameState.party.push(initPartyMember(key));
  const p=GameState.player;
  GameState.followers.push({ key, x:p.x, y:p.y-1, dir:'down', walkanim:0 });
  // 章の進行とシステム解放
  if (key === 'mama' && !GameState.unlockedSystems.includes('kitchen')) {
    GameState.unlockedSystems.push('kitchen');
    GameState.chapter = Math.max(GameState.chapter, 2);
    setTimeout(() => {
      startDialogue([
        '--- お弁当キッチン 解放 ---',
        'ままが帰ってきた！',
        '「お弁当キッチン」がメニューから使えるようになった！',
        '食材を集めてお弁当を作ろう！'
      ], null, null);
    }, 200);
  }
  if (key === 'papa' && !GameState.unlockedSystems.includes('workshop')) {
    GameState.unlockedSystems.push('workshop');
    GameState.chapter = Math.max(GameState.chapter, 4);
    setTimeout(() => {
      startDialogue([
        '--- カラクリ工房 解放 ---',
        'ままの図面をもとに、ぱぱが工房を再組した！',
        '「カラクリ工房」がメニューから使えるようになった！',
        'パーツを集めてガジェットを作ろう！'
      ], null, null);
    }, 200);
  }
}

function startDialogue(lines,npc=null,onClose=null) {
  GameState.scene='dialogue';
  GameState.dialogue={ lines, idx:0, npc, onClose, timer:0, charIdx:0 };
}

function updateDialogue(dt) {
  const d = GameState.dialogue;
  if (!d) { GameState.scene='map'; return; }
  d.timer += dt;
  d.charIdx = Math.min(d.lines[d.idx].length, Math.floor(d.timer/40));
  if (isConfirm()) {
    if (d.charIdx < d.lines[d.idx].length) d.charIdx = d.lines[d.idx].length;
    else if (d.idx < d.lines.length - 1) { d.idx++; d.timer=0; d.charIdx=0; }
    else { GameState.scene='map'; GameState.interactCooldown=300; GameState.dialogue=null; if (d.onClose) d.onClose(); }
  }
}

function startBattle(enemyTypes,isBoss=false,onVictory=null) {
  const enemies = enemyTypes.map(type => { const def=ENEMY_STATS[type]||ENEMY_STATS.ghost; return { ...def, type, hp:def.hp, maxHp:def.hp, isStunned:false, isBlind:false, analyzed:false }; });
  GameState.scene='battle';
  GameState.battleData={ enemies, isBoss, onVictory, turn:'player', phase:'select', selectedCmd:0, selectedMember:0, selectedSkill:0, selectedEnemyIdx:0, targetMode:false, log:['戦闘開始！'], logTimer:0, pendingActions:[], animations:[], shakeTimer:0, flashColor:null, victoryDelay:0, skillMode:false, damageFloating:[] };
}

function updateBattle(dt) {
  const bd = GameState.battleData;
  if (!bd) return;
  bd.logTimer = Math.max(0, bd.logTimer - dt);
  bd.shakeTimer = Math.max(0, bd.shakeTimer - dt);
  if (bd.phase==='victory') {
    if (bd.victoryDelay > 0) bd.victoryDelay -= dt;
    else if (isConfirm()) {
      const totalExp=bd.enemies.reduce((a,e)=>a+(e.exp||10),0);
      const totalGold=bd.enemies.reduce((a,e)=>a+(e.gold||5),0);
      GameState.gold += totalGold;
      GameState.party.forEach(m=>{ m.exp += totalExp; if (m.exp >= m.xpToNext) levelUp(m); });
      GameState.scene='map'; GameState.battleData=null; if (bd.onVictory) bd.onVictory();
    }
    return;
  }
  if (bd.phase==='defeat') { if (isConfirm()) { GameState.scene='gameover'; GameState.battleData=null; } return; }
  if (bd.phase==='select') handleBattleInput();
  else if (bd.phase==='result') { if (bd.logTimer <= 0) { if (bd.pendingActions.length > 0) executeBattleAction(bd.pendingActions.shift()); else startEnemyTurn(); } }
  else if (bd.phase==='enemy') { if (bd.logTimer <= 0) { if (bd.pendingActions.length>0) executeEnemyAction(bd.pendingActions.shift()); else { if (GameState.party.every(m=>m.hp<=0)) { bd.phase='defeat'; addLog('全滅してしまった...'); } else { bd.phase='select'; bd.selectedMember=0; bd.selectedCmd=0; GameState.party.forEach(m=>{m.isGuarding=false;}); } } } }
}

function handleBattleInput() {
  const bd = GameState.battleData;
  const member = GameState.party[bd.selectedMember];
  const aliveEnemies = bd.enemies.filter(e=>e.hp>0);
  if (!bd.targetMode && !bd.skillMode && !bd.itemMode) {
    if (Input.wasPressed('ArrowLeft')) bd.selectedCmd = Math.max(0, bd.selectedCmd-1);
    if (Input.wasPressed('ArrowRight')) bd.selectedCmd = Math.min(COMMANDS.length-1, bd.selectedCmd+1);
    // 5コマンドを2列(3+2)で扱う: 0-2行目上、3-4行目下
    if (Input.wasPressed('ArrowUp')) bd.selectedCmd = Math.max(0, bd.selectedCmd-3);
    if (Input.wasPressed('ArrowDown')) bd.selectedCmd = Math.min(COMMANDS.length-1, bd.selectedCmd+3);
    if (isConfirm()) {
      const cmd = COMMANDS[bd.selectedCmd];
      if (cmd==='たたかう') { bd.targetMode=true; bd.selectedEnemyIdx=0; }
      else if (cmd==='スキル') { bd.skillMode=true; bd.selectedSkill=0; }
      else if (cmd==='ぼうぎょ') { bd.pendingActions.push({type:'guard', member}); nextMemberOrExecute(); }
      else if (cmd==='どうぐ') { bd.itemMode=true; bd.selectedItemIdx=0; }
      else if (cmd==='にげる') {
        if (Math.random() < 0.6) { addLog('うまく逃げられた！'); bd.logTimer = 1200; setTimeout(()=>{ GameState.scene='map'; GameState.battleData=null; }, 1500); }
        else { addLog('逃げられなかった！'); bd.logTimer=800; nextMemberOrExecute(); }
      }
    }
  } else if (bd.itemMode) {
    // どうぐ画面: 所持お弁当一覧から選択
    const bag = GameState.bentoBag;
    if (Input.wasPressed('ArrowUp')) bd.selectedItemIdx = Math.max(0, bd.selectedItemIdx-1);
    if (Input.wasPressed('ArrowDown')) bd.selectedItemIdx = Math.min(Math.max(0, bag.length-1), bd.selectedItemIdx+1);
    if (isConfirm() && bag.length > 0) {
      const bento = bag[bd.selectedItemIdx];
      const recipe = RECIPES.find(r => r.id === bento.recipeId);
      if (recipe) {
        if (recipe.target === 'all') {
          GameState.party.forEach(m => { if (m.hp > 0) recipe.apply(m); });
          addLog(`${recipe.name}を使った！全員に効果！`);
        } else {
          // singleターゲットは現在の選択メンバーに使用
          recipe.apply(member);
          addLog(`${recipe.name}を使った！`);
        }
        bag.splice(bd.selectedItemIdx, 1); // 消費
        bd.selectedItemIdx = Math.min(bd.selectedItemIdx, Math.max(0, bag.length-1));
        bd.itemMode = false;
        nextMemberOrExecute();
      }
    }
    if (isCancel()) bd.itemMode = false;
  } else if (bd.targetMode) {
    if (Input.wasPressed('ArrowLeft')) bd.selectedEnemyIdx = Math.max(0, bd.selectedEnemyIdx-1);
    if (Input.wasPressed('ArrowRight')) bd.selectedEnemyIdx = Math.min(aliveEnemies.length-1, bd.selectedEnemyIdx+1);
    if (isConfirm()) {
      bd.pendingActions.push({type:'attack', member, targetIdx:bd.selectedEnemyIdx}); bd.targetMode=false; nextMemberOrExecute();
    }
    if (isCancel()) bd.targetMode=false;
  } else if (bd.skillMode) {
    const skills = member.skills || [];
    if (Input.wasPressed('ArrowUp')) bd.selectedSkill = Math.max(0, bd.selectedSkill-1);
    if (Input.wasPressed('ArrowDown')) bd.selectedSkill = Math.min(skills.length-1, bd.selectedSkill+1);
    if (isConfirm() && skills[bd.selectedSkill]) {
      const skill = skills[bd.selectedSkill];
      let cost = skill.mpCost;
      if (skill.name === 'フラッシュ' && GameState.gadgets['mama'] === 'hyper_shutter') cost = Math.floor(cost / 2);
      if (member.mp >= cost) { bd.pendingActions.push({ type:'skill', member, skill, targetIdx:bd.selectedEnemyIdx, cost }); bd.skillMode=false; bd.targetMode=false; nextMemberOrExecute(); }
      else addLog('MPが足りない！');
    }
    if (isCancel()) bd.skillMode=false;
  }
}

function nextMemberOrExecute() {
  const bd = GameState.battleData;
  bd.selectedMember++;
  if (bd.selectedMember >= GameState.party.length) {
    bd.pendingActions.sort((a,b)=>(b.member?.spd||0)-(a.member?.spd||0));
    bd.phase='result'; executeBattleAction(bd.pendingActions.shift());
  } else { bd.selectedCmd=0; bd.selectedSkill=0; bd.skillMode=false; }
}

function executeBattleAction(action) {
  const bd = GameState.battleData;
  if (!action) { startEnemyTurn(); return; }
  const m = action.member;
  
  if (m && m.regenTurns > 0 && m.hp > 0 && m.hp < m.maxHp) {
    const heal = Math.floor(m.maxHp * 0.1);
    m.hp = Math.min(m.maxHp, m.hp + heal);
    m.regenTurns--;
    addLog(`${m.name}は甲羅の力でHPが${heal}回復！`);
  }

  const enemies = bd.enemies.filter(e=>e.hp>0);
  if (action.type==='guard') { m.isGuarding=true; addLog(`${m.name}はぼうぎょした！`); bd.logTimer=700; return; }
  if (action.type==='attack') {
    const target = enemies[action.targetIdx % enemies.length]; if (!target) return;
    const buffMulti = GameState.gadgets['kanato'] === 'megaphone' ? 0.5 : 0.3;
    let dmg = Math.max(1, Math.floor(m.atk * (1 + (m.buffAtk||0)*buffMulti) - target.def*0.5 + (Math.random()*6-3)));
    if (m.isBlind) dmg = Math.random() < 0.5 ? Math.floor(dmg*0.5) : 0;
    target.hp = Math.max(0, target.hp - dmg);
    addLog(`${m.name}の攻撃！ ${target.name}に${dmg}のダメージ！`);
    bd.damageFloating.push({damage:dmg, targetIdx:bd.enemies.indexOf(target), timer:1000});
    bd.shakeTimer=300;
    if (target.hp<=0) addLog(`${target.name}をたおした！`);
    bd.logTimer=900; checkBattleEnd(); 
    
    // ガジェット「トゲトゲ合金首輪」の自動追撃
    if (m.key !== 'dog' && GameState.gadgets['dog']==='spike_collar' && Math.random() < 0.15 && target.hp > 0 && bd.phase !== 'victory') {
       const dog = GameState.party.find(p=>p.key==='dog' && p.hp>0 && !p.isStunned);
       if (dog) {
          addLog(`いぬが自動追撃！`);
          bd.pendingActions.unshift({ type:'attack', member:dog, targetIdx: bd.enemies.indexOf(target) });
       }
    }
    return;
  }
  if (action.type==='skill') {
    const skill = action.skill; m.mp -= action.cost !== undefined ? action.cost : skill.mpCost; const target = enemies[action.targetIdx % enemies.length]; addLog(`${m.name}の「${skill.name}」！`);
    switch(skill.effect) {
      case 'heal': { const hAmt = skill.power || 30; m.hp=Math.min(m.maxHp,m.hp+hAmt); addLog(`${m.name}のHPが${hAmt}回復！`); break; }
      case 'healAll': { GameState.party.forEach(p=>{ const ha = skill.power||40; p.hp=Math.min(p.maxHp,p.hp+ha); }); addLog(`パーティ全員のHPが回復した！`); break; }
      case 'buffAtk': { const buffTarget=GameState.party[0]; buffTarget.buffAtk=(buffTarget.buffAtk||0)+1; addLog(`${buffTarget.name}の攻撃力があがった！`); break; }
      case 'buffDef': { m.buffDef=(m.buffDef||0)+2; if (GameState.gadgets['turtle']==='titanium_shell' && m.key==='turtle') { m.regenTurns = 3; } addLog(`${m.name}の防御力が大幅にアップ！`); break; }
      case 'stun': if (target && Math.random() < 0.7) { target.isStunned=true; addLog(`${target.name}は1ターン行動できない！`); } else addLog(`しかし、うまく決まらなかった...`); break;
      case 'blind': enemies.forEach(e=>{ e.isBlind=true; }); addLog(`敵全体が暗闇になった！`); break;
      case 'attack': if (target) { let dmg=Math.max(1, Math.floor(m.atk * (skill.power||1.8) - target.def*0.3)); target.hp=Math.max(0,target.hp-dmg); addLog(`${target.name}に${dmg}のダメージ！`); bd.damageFloating.push({damage:dmg, targetIdx:bd.enemies.indexOf(target), timer:1000}); bd.shakeTimer=400; if (target.hp<=0) addLog(`${target.name}をたおした！`); checkBattleEnd(); } break;
      case 'analyze': if (target) { target.analyzed=true; addLog(`${target.name}の弱点は「${target.weakTo||'???'}」！`); } break;
      case 'randomAll': { let dmgTotal=0; enemies.forEach((e,ei)=>{ const minMul = GameState.gadgets['papa']==='hyper_processor' ? 1.2 : 0.8; const d=Math.max(1, Math.floor(m.atk*(minMul+Math.random()*1.4)-e.def*0.3)); e.hp=Math.max(0,e.hp-d); dmgTotal += d; bd.damageFloating.push({damage:d, targetIdx:bd.enemies.indexOf(e), timer:1000}); if (e.hp<=0) addLog(`${e.name}をたおした！`); }); addLog(`敵全体に合計${dmgTotal}のダメージ！`); bd.shakeTimer=600; checkBattleEnd(); break; }
      case 'protect': addLog(`${m.name}は仲間をかばう体勢をとった！`); m.isProtecting = true; break;
    }
    bd.logTimer = 1000; return;
  }
}

function startEnemyTurn() {
  const bd = GameState.battleData; bd.phase='enemy'; const actions=[];
  bd.enemies.filter(e=>e.hp>0).forEach(e=>{ if (e.isStunned) { e.isStunned=false; actions.push({type:'stunned', enemy:e}); } else actions.push({type:'enemyAttack', enemy:e}); });
  bd.pendingActions = actions;
  if (actions.length>0) executeEnemyAction(bd.pendingActions.shift()); else { bd.phase='select'; bd.selectedMember=0; }
}

function executeEnemyAction(action) {
  const bd = GameState.battleData; if (!action) return;
  if (action.type==='stunned') { addLog(`${action.enemy.name}はしびれて動けない！`); bd.logTimer=700; return; }
  if (action.type==='enemyAttack') {
    const e = action.enemy; const aliveParty = GameState.party.filter(m=>m.hp>0); if (!aliveParty.length) return;
    const target = aliveParty[Math.floor(Math.random()*aliveParty.length)];
    let def = target.def + (target.buffDef||0)*5; if (target.isGuarding) def *= 2;
    let dmg = Math.max(1, Math.floor(e.atk * (0.8+Math.random()*0.4) - def*0.4));
    if (e.isBlind) dmg = Math.random() < 0.5 ? Math.floor(dmg*0.5) : 0;
    target.hp = Math.max(0, target.hp - dmg);
    addLog(`${e.name}の攻撃！ ${target.name}に${dmg}のダメージ！`);
    const memberIdx = GameState.party.indexOf(target);
    if (memberIdx >= 0) bd.damageFloating.push({damage:dmg, targetIdx:10+memberIdx, isPlayer:true, timer:1000});
    bd.logTimer=900;
    if (target.hp<=0) addLog(`${target.name}はたおれた...`);
    if (GameState.party.every(m=>m.hp<=0)) { bd.phase='defeat'; addLog('全滅してしまった...'); }
  }
}

function checkBattleEnd() {
  const bd = GameState.battleData;
  if (bd.enemies.every(e=>e.hp<=0)) { 
    bd.phase='victory'; bd.victoryDelay=1000; addLog('しょうり！'); bd.pendingActions=[]; 
    // Step2: ドロップアイテムを計算し、表示用に保持
    bd.droppedItems = rollDrops(bd.enemies);
  }
}

function addLog(msg) { const bd = GameState.battleData; if (!bd) return; bd.log.push(msg); if (bd.log.length > 5) bd.log.shift(); }

function levelUp(member) {
  member.level++; member.xpToNext = Math.floor(member.xpToNext * 1.4); member.maxHp += 10; member.hp = member.maxHp; member.maxMp += 5; member.mp = member.maxMp; member.atk += 3; member.def += 2; member.spd += 1; if (GameState.battleData) addLog(`${member.name}がLv${member.level}になった！`); }

// ============================================================
// Step2: 素材ドロップ & インベントリ管理
// ============================================================

/** アイテムを所持数に追加する */
function addItem(itemId, count = 1) {
  GameState.inventory[itemId] = (GameState.inventory[itemId] || 0) + count;
}

/** 戦闘で倒した敵からドロップを抽選する */
function rollDrops(enemies) {
  const dropped = {}; // { itemId: count }
  enemies.forEach(e => {
    const drops = e.drops || [];
    drops.forEach(d => {
      if (Math.random() < d.rate) {
        addItem(d.item);
        dropped[d.item] = (dropped[d.item] || 0) + 1;
      }
    });
  });
  return dropped;
}

// ============================================================
// Step3: クラフトシステム
// ============================================================

function craftBento(recipeId) {
  const recipe = RECIPES.find(r => r.id === recipeId);
  if (!recipe) return false;
  for (const [item, cost] of Object.entries(recipe.cost)) {
    if ((GameState.inventory[item] || 0) < cost) return false;
  }
  for (const [item, cost] of Object.entries(recipe.cost)) {
    GameState.inventory[item] -= cost;
  }
  GameState.bentoBag.push({ recipeId: recipe.id, name: recipe.name });
  return true;
}

function craftGadget(gadgetId) {
  const gadget = GADGETS.find(g => g.id === gadgetId);
  if (!gadget) return false;
  for (const [item, cost] of Object.entries(gadget.cost)) {
    if ((GameState.inventory[item] || 0) < cost) return false;
  }
  for (const [item, cost] of Object.entries(gadget.cost)) {
    GameState.inventory[item] -= cost;
  }
  GameState.gadgets[gadget.forChar] = gadget.id;
  return true;
}

function openMenu() {
  // 解放済みシステムに応じてメニュー項目を動的に構築
  const items = ['パーティ確認','もちもの'];
  if (GameState.unlockedSystems.includes('workshop')) items.push('カラクリ工房');
  if (GameState.unlockedSystems.includes('kitchen'))  items.push('お弁当キッチン');
  if (GameState.unlockedSystems.includes('gacha'))    items.push('思い出の現像');
  items.push('もどる');
  GameState.scene='menu';
  GameState.menu={ selected:0, items, subMode:null, subSelected:0 };
}


function updateMenu() {
  const m = GameState.menu;
  if (!m) { GameState.scene='map'; return; }
  if (!m.subMode) {
    if (Input.wasPressed('ArrowUp')) m.selected = Math.max(0, m.selected-1);
    if (Input.wasPressed('ArrowDown')) m.selected = Math.min(m.items.length-1, m.selected+1);
    if (isConfirm()) {
      if (m.items[m.selected] === 'もどる' || m.items[m.selected] === 'とじる') { GameState.scene='map'; GameState.menu=null; }
      else if (m.items[m.selected] === 'パーティ確認') m.subMode='party';
      else if (m.items[m.selected] === 'もちもの') m.subMode='items';
      else if (m.items[m.selected] === 'お弁当キッチン') { m.subMode='kitchen'; m.subSelected = 0; }
      else if (m.items[m.selected] === 'カラクリ工房') { m.subMode='workshop'; m.subSelected = 0; }
    }
    if (isCancel()) { GameState.scene='map'; GameState.menu=null; }
  } else if (m.subMode==='kitchen') {
    if (Input.wasPressed('ArrowUp')) m.subSelected = Math.max(0, m.subSelected-1);
    if (Input.wasPressed('ArrowDown')) m.subSelected = Math.min(RECIPES.length-1, m.subSelected+1);
    if (isConfirm()) {
      if (craftBento(RECIPES[m.subSelected].id)) {
        // クラフト成功の演出やログを追加可能
      }
    }
    if (isCancel()) { m.subMode = null; }
  } else if (m.subMode==='workshop') {
    if (Input.wasPressed('ArrowUp')) m.subSelected = Math.max(0, m.subSelected-1);
    if (Input.wasPressed('ArrowDown')) m.subSelected = Math.min(GADGETS.length-1, m.subSelected+1);
    if (isConfirm()) {
      const gadget = GADGETS[m.subSelected];
      if (GameState.gadgets[gadget.forChar] !== gadget.id) {
        if (craftGadget(gadget.id)) {
          // クラフト成功
        }
      }
    }
    if (isCancel()) { m.subMode = null; }
  } else if (isCancel() || isConfirm()) { m.subMode = null; }
}

let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min(timestamp - lastTime, 100);
  lastTime = timestamp;
  switch (GameState.scene) {
    case 'title': if (isConfirm()) { initGame(); GameState.scene='map'; } break;
    case 'map': updateMap(dt); break;
    case 'dialogue': updateDialogue(dt); break;
    case 'battle': updateBattle(dt); break;
    case 'menu': updateMenu(); break;
    case 'gameover': if (isConfirm()) GameState.scene='title'; break;
    case 'ending': if (isConfirm()) GameState.scene='title'; break;
  }
  ctx.clearRect(0,0,640,480);
  switch (GameState.scene) {
    case 'title': renderTitle(); break;
    case 'map': renderMap(); break;
    case 'dialogue': renderDialogue(); break;
    case 'battle': renderBattle(); break;
    case 'menu': renderMenu(); break;
    case 'gameover': renderGameOver(); break;
    case 'ending': renderEnding(); break;
  }
  Input.update();
  requestAnimationFrame(gameLoop);
}

preloadAssets();
setInterval(() => {
  const gs = GameState;
  // エンディング: 最初の村(village1)に5人全員で帰還
  if (gs.scene==='map' && gs.rescuedChars.length >=5 && !gs.endingTriggered &&
      (gs.currentMap?.id==='village1')) {
    gs.endingTriggered = true;
    startDialogue(['みんな、ただいま！','かなとのだいぼうけんが','おわった！'], null, () => { GameState.scene='ending'; });
  }
}, 1000);
requestAnimationFrame(gameLoop);
