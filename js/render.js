const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const TILE_SIZE = 32;
const VIEW_W = 20;
const VIEW_H = 13;
const FONT_JP = '"MS Gothic","Hiragino Kaku Gothic Pro",monospace';
const loadedImages = {};

function loadImage(src) {
  if (!src) return null;
  if (loadedImages[src]) return loadedImages[src];
  const img = new Image();
  img.onload = () => { img.ready = true; };
  img.onerror = () => { console.warn('画像読込失敗:', src); };
  img.src = src;
  img.ready = false;
  loadedImages[src] = img;
  return img;
}

function preloadAssets() {
  Object.values(ASSET_CONFIG.characters).forEach(cfg => { if (cfg.src) cfg._img = loadImage(cfg.src); });
  Object.values(ASSET_CONFIG.tiles).forEach(cfg => { if (cfg.src) cfg._img = loadImage(cfg.src); });
  Object.values(ASSET_CONFIG.enemies).forEach(cfg => { if (cfg.src) cfg._img = loadImage(cfg.src); });
}

function drawTile(type, px, py) {
  const cfg = ASSET_CONFIG.tiles[type] || ASSET_CONFIG.tiles.grass;
  if (cfg.base) {
    drawTile(cfg.base, px, py);
  }
  if (cfg._img && cfg._img.ready) {
    if (cfg.sx !== undefined && cfg.sy !== undefined) {
      ctx.drawImage(cfg._img, cfg.sx, cfg.sy, TILE_SIZE, TILE_SIZE, px, py, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.drawImage(cfg._img, px, py, TILE_SIZE, TILE_SIZE);
    }
    return;
  }
  ctx.fillStyle = cfg.color;
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = cfg.topColor;
  ctx.fillRect(px, py, TILE_SIZE, 4);
  switch (type) {
    case 'water':
      ctx.fillStyle = 'rgba(100,180,255,0.3)';
      ctx.fillRect(px + 4, py + 8, 8, 3);
      ctx.fillRect(px + 16, py + 18, 10, 3);
      break;
    case 'tree':
      ctx.fillStyle = '#553311';
      ctx.fillRect(px + 12, py + 18, 8, 14);
      ctx.fillStyle = '#336622';
      ctx.beginPath(); ctx.arc(px + 16, py + 12, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#44aa33';
      ctx.beginPath(); ctx.arc(px + 16, py + 8, 9, 0, Math.PI * 2); ctx.fill();
      break;
    case 'wall': case 'house':
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for (let j = 0; j < 4; j++) {
        const offset = j % 2 === 0 ? 0 : 8;
        for (let i = offset; i < TILE_SIZE; i += 16) ctx.fillRect(px + i, py + j * 8, 14, 6);
      }
      break;
    case 'rock':
      ctx.fillStyle = '#555555';
      ctx.fillRect(px + 6, py + 6, 20, 20);
      ctx.fillStyle = '#777777';
      ctx.fillRect(px + 8, py + 8, 16, 16);
      break;
    case 'road': case 'floor':
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      for (let i = 0; i < 4; i++) ctx.fillRect(px, py + i * 8, TILE_SIZE, 1);
      break;
    case 'exit':
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#44ffaa';
      ctx.font = '10px ' + FONT_JP;
      ctx.textAlign = 'center';
      ctx.fillText('↑出口', px + 16, py + 20);
      break;
    case 'flower':
      ctx.fillStyle = '#ffee44';
      ctx.beginPath(); ctx.arc(px + 16, py + 20, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff6688';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
        ctx.beginPath(); ctx.arc(px + 16 + Math.cos(a) * 6, py + 20 + Math.sin(a) * 6, 3, 0, Math.PI * 2); ctx.fill();
      }
      break;
  }
}

function drawChest(px, py, opened) {
  if (opened) {
    ctx.fillStyle = '#cc8844';
    ctx.fillRect(px + 4, py + 12, 24, 16);
    ctx.fillStyle = '#221100';
    ctx.fillRect(px + 4, py + 16, 24, 3);
  } else {
    ctx.fillStyle = '#cc8844';
    ctx.fillRect(px + 4, py + 10, 24, 18);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(px + 4, py + 14, 24, 4);
    ctx.fillRect(px + 14, py + 16, 4, 4);
  }
}


function drawCharSprite(charKey, px, py, dir, frame, size = 32, alpha = 1) {
  const cfg = ASSET_CONFIG.characters[charKey];
  if (!cfg) return;
  ctx.globalAlpha = alpha;
  if (cfg._img && cfg._img.ready) {
    const row = cfg.dirRows[dir] || 0;
    const sx = cfg.sheetOffsetX + frame * cfg.frameW;
    const sy = cfg.sheetOffsetY + row * cfg.frameH;
    ctx.drawImage(cfg._img, sx, sy, cfg.frameW, cfg.frameH, px, py, size, size);
  } else {
    drawFallbackChar(cfg.fallbackColor, charKey, px, py, dir, frame, size);
  }
  ctx.globalAlpha = 1;
}

function drawFallbackChar(color, key, px, py, dir, frame, size) {
  const s = size / 32;
  const bob = frame === 1 ? 1 : 0;
  ctx.fillStyle = color;
  ctx.fillRect(px + 8 * s, py + 14 * s + bob, 16 * s, 18 * s);
  ctx.fillStyle = '#ffcc99';
  ctx.fillRect(px + 10 * s, py + 2 * s + bob, 12 * s, 12 * s);
  ctx.fillStyle = '#333';
  if (dir !== 'up') {
    ctx.fillRect(px + 12 * s, py + 6 * s + bob, 2 * s, 2 * s);
    ctx.fillRect(px + 18 * s, py + 6 * s + bob, 2 * s, 2 * s);
  }
  const hairColors = { kanato: '#886644', dog: '#cc8833', turtle: '#44aa66', mama: '#994466', papa: '#443388' };
  ctx.fillStyle = hairColors[key] || '#886644';
  ctx.fillRect(px + 9 * s, py + 1 * s + bob, 14 * s, 5 * s);
  ctx.fillStyle = color;
  ctx.fillRect(px + 9 * s, py + 30 * s - 2, 6 * s, 4 * s);
  ctx.fillRect(px + 17 * s, py + 30 * s - 2, 6 * s, 4 * s);
}

function drawEnemySprite(enemyKey, cx, cy, scale = 1, shake = 0) {
  const cfg = ASSET_CONFIG.enemies[enemyKey] || ASSET_CONFIG.enemies.ghost;
  const w = (cfg.w || 64) * scale;
  const h = (cfg.h || 64) * scale;
  const sx = cx - w / 2 + shake;
  const sy = cy - h / 2;
  if (cfg._img && cfg._img.ready) {
    ctx.drawImage(cfg._img, sx, sy, w, h);
    return;
  }
  ctx.shadowColor = cfg.rimColor;
  ctx.shadowBlur = 20;
  ctx.fillStyle = cfg.color;
  const shapes = { ghost: drawGhost, slime: drawSlime, boss: drawBoss };
  const drawFn = shapes[enemyKey] || drawDefaultEnemy;
  drawFn(sx, sy, w, h, cfg.color, enemyKey);
  ctx.shadowBlur = 0;
}

function drawGhost(x, y, w, h) {
  ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.4, w * 0.45, Math.PI, 0); ctx.lineTo(x + w, y + h * 0.9);
  for (let i = 3; i >= 0; i--) ctx.arc(x + w * (0.15 + i * 0.2), y + h * 0.9, w * 0.1, 0, Math.PI, true);
  ctx.fill();
  ctx.fillStyle = '#553388';
  ctx.beginPath(); ctx.arc(x + w * 0.38, y + h * 0.38, w * 0.08, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w * 0.62, y + h * 0.38, w * 0.08, 0, Math.PI * 2); ctx.fill();
}

function drawSlime(x, y, w, h) {
  ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.55, w * 0.45, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.arc(x + w * 0.35, y + h * 0.4, w * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#334455';
  ctx.beginPath(); ctx.arc(x + w * 0.4, y + h * 0.55, w * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w * 0.6, y + h * 0.55, w * 0.07, 0, Math.PI * 2); ctx.fill();
}

function drawBoss(x, y, w, h) {
  ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.5, w * 0.48, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#882211';
  ctx.beginPath(); ctx.moveTo(x + w * 0.3, y + h * 0.15); ctx.lineTo(x + w * 0.15, y - h * 0.1); ctx.lineTo(x + w * 0.4, y + h * 0.2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + w * 0.7, y + h * 0.15); ctx.lineTo(x + w * 0.85, y - h * 0.1); ctx.lineTo(x + w * 0.6, y + h * 0.2); ctx.fill();
  ctx.fillStyle = '#ffff00';
  ctx.beginPath(); ctx.arc(x + w * 0.35, y + h * 0.42, w * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w * 0.65, y + h * 0.42, w * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(x + w * 0.35, y + h * 0.42, w * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w * 0.65, y + h * 0.42, w * 0.05, 0, Math.PI * 2); ctx.fill();
}

function drawDefaultEnemy(x, y, w, h, color, key) {
  const colors = { wolf: '#886644', fairy: '#ffaaee' };
  ctx.fillStyle = colors[key] || color;
  ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w * 0.45, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${w * 0.3}px ${FONT_JP}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('👾', x + w / 2, y + h / 2);
}

function drawNPC(npc, px, py) {
  drawFallbackChar(npc.color || '#aaaaaa', 'npc', px, py, npc.dir || 'down', 0, 28);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(px - 4, py - 14, 40, 12);
  ctx.fillStyle = '#fff';
  ctx.font = `9px ${FONT_JP}`;
  ctx.textAlign = 'center';
  ctx.fillText(npc.name, px + 16, py - 5);
}

function drawBox(x, y, w, h, title = '') {
  ctx.fillStyle = 'rgba(10,15,40,0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#4455bb'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = '#6677cc'; ctx.lineWidth = 1; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  if (title) {
    ctx.fillStyle = '#8899ee'; ctx.font = `bold 12px ${FONT_JP}`;
    ctx.textAlign = 'left'; ctx.fillText(title, x + 10, y + 16);
  }
}

function drawText(text, x, y, color = '#eeeeff', size = 14, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${size}px ${FONT_JP}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
}

function drawHPBar(label, hp, maxHp, x, y, w = 100) {
  ctx.fillStyle = '#222244'; ctx.fillRect(x, y, w, 8);
  const ratio = Math.max(0, hp / maxHp);
  ctx.fillStyle = ratio > 0.5 ? '#44ff66' : ratio > 0.25 ? '#ffaa22' : '#ff3333';
  ctx.fillRect(x, y, w * ratio, 8);
  ctx.strokeStyle = '#4455aa'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, 8);
  ctx.fillStyle = '#eeeeff'; ctx.font = `10px ${FONT_JP}`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`${label} ${hp}/${maxHp}`, x, y - 7);
}

function drawMPBar(mp, maxMp, x, y, w = 60) {
  ctx.fillStyle = '#222244'; ctx.fillRect(x, y, w, 5);
  ctx.fillStyle = '#3399ff'; ctx.fillRect(x, y, w * (mp / maxMp), 5);
  ctx.strokeStyle = '#4455aa'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, 5);
}

function renderMapHUD() {
  const gs = GameState;
  const map = gs.currentMap;

  // 上部の情報バー（マップ名、所持金、HP）はそのまま残します
  drawBox(0, 0, 640, 48);
  drawText(map.name, 10, 8, '#aabbff', 14);
  drawText(`💰 ${gs.gold}G`, 200, 8, '#ffdd44', 14);
  gs.party.forEach((m, i) => {
    const x = 320 + i * 80;
    drawText(`Lv.${m.level} ${m.name}`, x, 4, '#aabbff', 10);
    drawHPBar('', m.hp, m.maxHp, x, 26, 70);
  });

  // 以下の2行を削除（コメントアウト）することで、画面下部の操作説明バーが消えます
  // drawBox(0, 432, 640, 48);
  // drawText('Zキー: 話す/決定  Xキー: メニュー  矢印キー: 移動', 10, 442, '#7788bb', 11);
}

function renderMap() {
  const gs = GameState;
  const map = gs.currentMap;
  const cam = gs.camera;
  if (!map) return;
  for (let ty = cam.y; ty < Math.min(cam.y + VIEW_H, map.h); ty++) {
    for (let tx = cam.x; tx < Math.min(cam.x + VIEW_W, map.w); tx++) {
      const tile = getTile(map, tx, ty);
      const px = (tx - cam.x) * TILE_SIZE;
      const py = canvas.height - (ty - cam.y + 1) * TILE_SIZE;
      drawTile(tile, px, py);
    }
  }
  const drawables = [];
  if (map.chests) {
    map.chests.forEach(c => {
      drawables.push({ ty: c.y, draw: () => {
        const px = (c.x - cam.x) * TILE_SIZE;
        const py = canvas.height - (c.y - cam.y + 1) * TILE_SIZE;
        drawChest(px, py + 4, c.opened);
      }});
    });
  }
  map.npcs.forEach(npc => { if (!npc.alive) return; drawables.push({ ty: npc.y, draw: () => { const px = (npc.x - cam.x) * TILE_SIZE; const py = canvas.height - (npc.y - cam.y + 1) * TILE_SIZE; drawNPC(npc, px, py + 4); } }); });
  if (map.boss && !map.boss.defeated) {
    const boss = map.boss;
    drawables.push({
      ty: boss.y, draw: () => {
        const px = (boss.x - cam.x) * TILE_SIZE;
        const py = canvas.height - (boss.y - cam.y + 1) * TILE_SIZE;
        drawFallbackChar('#dd3333', 'boss', px, py + 4, 'down', Math.floor(Date.now() / 300) % 3, 32);
        ctx.fillStyle = '#ff3333'; ctx.font = `bold 10px ${FONT_JP}`;
        ctx.textAlign = 'center'; ctx.fillText('！', px + 16, py - 4);
      }
    });
  }
  gs.followers.forEach(f => drawables.push({ ty: f.y, draw: () => { const px = (f.x - cam.x) * TILE_SIZE; const py = canvas.height - (f.y - cam.y + 1) * TILE_SIZE; drawCharSprite(f.key, px, py + 4, f.dir, f.walkanim); } }));
  const p = gs.player;
  drawables.push({ ty: p.y, draw: () => { const px = (p.x - cam.x) * TILE_SIZE; const py = canvas.height - (p.y - cam.y + 1) * TILE_SIZE; drawCharSprite('kanato', px, py + 4, p.dir, p.walkanim); ctx.fillStyle = 'rgba(255,255,0,0.4)'; ctx.beginPath(); ctx.arc(px + 16, py + TILE_SIZE - 2, 6, 0, Math.PI * 2); ctx.fill(); } });
  drawables.sort((a, b) => a.ty - b.ty).forEach(d => d.draw());

  if (map.isDark) {
    const px = (p.x - cam.x) * TILE_SIZE + TILE_SIZE / 2;
    const py = canvas.height - (p.y - cam.y + 1) * TILE_SIZE + TILE_SIZE / 2;
    
    // 画面全体を覆うグラデーションを作成し、中心部を透明にしてプレイヤーを見せる
    const grad = ctx.createRadialGradient(px, py, TILE_SIZE * 1.5, px, py, TILE_SIZE * 5);
    grad.addColorStop(0, 'rgba(0,0,0,0)');       // 中心は完全に見える
    grad.addColorStop(0.6, 'rgba(0,0,0,0.7)');   // 徐々に暗くなる
    grad.addColorStop(1, 'rgba(0,0,0,0.98)');    // 外側はほぼ真っ暗
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  renderMapHUD();
}

function renderDialogue() {
  renderMap();
  const d = GameState.dialogue;
  if (!d) return;
  drawBox(20, 380, 600, 90, d.npc ? d.npc.name : '');
  const text = d.lines[d.idx].substring(0, d.charIdx);
  ctx.fillStyle = '#eeeeff'; ctx.font = `15px ${FONT_JP}`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  let lineText = '';
  let lineY = 405;
  for (let i = 0; i < text.length; i++) {
    lineText += text[i];
    if (lineText.length % 28 === 0) { ctx.fillText(lineText, 35, lineY); lineText = ''; lineY += 20; }
  }
  if (lineText) ctx.fillText(lineText, 35, lineY);
  if (d.charIdx >= d.lines[d.idx].length) {
    ctx.fillStyle = Math.floor(Date.now() / 300) % 2 ? '#ffffff' : '#aaaaff';
    ctx.fillText('▼', 600, 450);
  }
}

function renderBattle() {
  const bd = GameState.battleData;
  if (!bd) return;
  const party = GameState.party;
  const bg = ctx.createLinearGradient(0, 0, 0, 480);
  bg.addColorStop(0, '#0a0a22'); bg.addColorStop(1, '#1a1530');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 640, 480);
  ctx.fillStyle = '#2a2040'; ctx.fillRect(0, 340, 640, 140);
  ctx.fillStyle = '#3a3050'; ctx.fillRect(0, 340, 640, 6);
  const aliveEnemies = bd.enemies.filter(e => e.hp > 0);
  aliveEnemies.forEach((e, i) => {
    const ex = 640 * (i + 1) / (aliveEnemies.length + 1);
    const ey = 200; const shake = bd.shakeTimer > 0 ? (Math.random() - 0.5) * 8 : 0;
    drawEnemySprite(e.type, ex, ey, bd.isBoss && e.isBoss ? 1.2 : 1, shake);
    drawHPBar(e.name, e.hp, e.maxHp, ex - 40, ey + 50, 80);
    if (e.analyzed) { ctx.fillStyle = '#ffaa22'; ctx.font = `10px ${FONT_JP}`; ctx.textAlign = 'center'; ctx.fillText(`弱点:${e.weakTo}`, ex, ey + 70); }
    if (e.isBlind) { ctx.fillStyle = '#888'; ctx.font = `10px ${FONT_JP}`; ctx.textAlign = 'center'; ctx.fillText('暗闇', ex, ey - 50); }
    if (bd.phase === 'select' && bd.targetMode && i === bd.selectedEnemyIdx) {
      ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 3; ctx.strokeRect(ex - 60, ey - 80, 120, 160);
      ctx.fillStyle = '#ffff00'; ctx.font = `bold 14px ${FONT_JP}`; ctx.textAlign = 'center'; ctx.fillText('◀ ▶', ex, ey - 90);
    }
  });
  bd.damageFloating.forEach((dmg, di) => {
    if (dmg.timer > 0) {
      const alpha = Math.min(1, dmg.timer / 500);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = dmg.isPlayer ? '#ff6666' : '#ffff00';
      ctx.font = `bold 24px ${FONT_JP}`;
      ctx.textAlign = 'center';
      const offsetY = (1000 - dmg.timer) * 0.05;
      let x, y;
      if (dmg.isPlayer) {
        const mi = dmg.targetIdx - 10;
        x = 70 + mi * 130;
        y = 385 - offsetY;
      } else {
        const eIdx = dmg.targetIdx;
        const enemies = bd.enemies.filter(e => e.hp > 0);
        x = 640 * (eIdx + 1) / (enemies.length + 1);
        y = 200 - offsetY;
      }
      ctx.fillText('-' + dmg.damage, x, y);
      ctx.globalAlpha = 1;
    }
  });
  bd.damageFloating = bd.damageFloating.filter(d => d.timer > 0).map(d => ({ ...d, timer: d.timer - 16 }));
  drawBox(0, 350, 640, 130);
  party.forEach((m, i) => {
    const x = 10 + i * 130; const isActive = bd.phase === 'select' && i === bd.selectedMember;
    ctx.fillStyle = isActive ? 'rgba(80,100,200,0.4)' : 'rgba(20,20,60,0.2)'; ctx.fillRect(x - 2, 354, 126, 90);
    if (isActive) { ctx.strokeStyle = '#6677ff'; ctx.lineWidth = 2; ctx.strokeRect(x - 2, 354, 126, 90); }
    drawText(m.name, x, 358, m.hp <= 0 ? '#666688' : '#aabbff', 13);
    drawText(`Lv${m.level}`, x + 80, 358, '#88aaff', 11);
    drawHPBar('HP', m.hp, m.maxHp, x, 386, 110);
    drawMPBar(m.mp, m.maxMp, x, 400, 110);
    drawText(`${m.mp}/${m.maxMp}MP`, x, 412, '#6699ff', 9);
    if (m.isGuarding) drawText('🛡ぼうぎょ中', x, 420, '#aaffaa', 9);
  });
  if (bd.phase === 'select' || bd.phase === 'result') {
    const activeMember = party[bd.selectedMember];
    if (bd.phase === 'select' && activeMember && activeMember.hp > 0) {
      if (!bd.skillMode && !bd.targetMode && !bd.itemMode) {
        // 5コマンドを2列表示 (3列目 + 2列目)
        drawBox(440, 262, 190, 90, activeMember.name + 'のコマンド');
        COMMANDS.forEach((cmd, i) => {
          const col = i % 3; // 3列構成
          const row = Math.floor(i / 3);
          const cx = 448 + col * 60;
          const cy = 300 + row * 26;
          const sel = i === bd.selectedCmd;
          ctx.fillStyle = sel ? '#4455ff' : 'transparent'; ctx.fillRect(cx - 2, cy - 2, 56, 18);
          drawText((sel ? '▶' : ' ') + cmd, cx, cy, sel ? '#ffffff' : '#aabbff', 11);
        });
      } else if (bd.targetMode) {
        //drawBox(440, 270, 190, 50, activeMember.name + '：敵を選択');
        drawText('◄ と ▶ で選択 Z で決定', 450, 285, '#aabbff', 12);
        drawText('X でキャンセル', 450, 300, '#aabbff', 12);
      } else if (bd.skillMode) {
        const skills = activeMember.skills || [];
        drawBox(440, 250, 190, 30 + skills.length * 26, 'スキル');
        skills.forEach((sk, i) => {
          const sel = i === bd.selectedSkill; const canUse = activeMember.mp >= sk.mpCost;
          ctx.fillStyle = sel ? '#4455ff' : 'transparent'; ctx.fillRect(448, 266 + i * 26 - 2, 178, 22);
          drawText((sel ? '▶' : ' ') + sk.name, 452, 266 + i * 26, canUse ? (sel ? '#fff' : '#aabbff') : '#666688', 13);
          drawText(`${sk.mpCost}MP`, 560, 266 + i * 26, canUse ? '#6699ff' : '#444466', 11);
          if (sel) drawText(sk.desc, 452, 266 + i * 26 + 12, '#88aaff', 9);
        });
      } else if (bd.itemMode) {
        // どうぐ画面: お弁当リスト
        const bag = GameState.bentoBag;
        const boxH = Math.max(60, 30 + bag.length * 22);
        drawBox(440, 350 - boxH, 190, boxH, 'お弁当ボックス');
        if (bag.length === 0) {
          drawText('お弁当がないよ！', 450, 362 - boxH, '#888899', 12);
        } else {
          bag.forEach((b, i) => {
            const sel = i === bd.selectedItemIdx;
            ctx.fillStyle = sel ? '#4455ff' : 'transparent'; ctx.fillRect(448, 362 - boxH + i * 22 - 2, 178, 18);
            // 名前が長いので短縮表示
            const nm = b.name.length > 11 ? b.name.slice(0, 10) + '…' : b.name;
            drawText((sel ? '▶' : ' ') + nm, 452, 362 - boxH + i * 22, sel ? '#fff' : '#aabbff', 11);
          });
        }
        drawText('X:戻る', 570, 345, '#888899', 10);
      }
    }
  }
  drawBox(0, 270, 435, 80);
  bd.log.slice(-4).forEach((l, i) => { ctx.globalAlpha = 0.4 + 0.6 * (i / bd.log.length); drawText(l, 10, 278 + i * 18, '#eeeeff', 13); ctx.globalAlpha = 1; });
  if (bd.phase === 'victory') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, 640, 480);
    const expSum = bd.enemies.reduce((a, e) => a + (e.exp || 10), 0);
    const gldSum = bd.enemies.reduce((a, e) => a + (e.gold || 5), 0);
    // Step2: ドロップアイテム表示
    const drops = bd.droppedItems || {};
    const dropKeys = Object.keys(drops);
    const boxH = 140 + dropKeys.length * 18;
    drawBox(160, 140, 320, boxH, 'しょうり！');
    drawText(`経験値 +${expSum} EXP`, 180, 170, '#ffdd44', 16);
    drawText(`お金  +${gldSum} G`, 180, 195, '#ffcc22', 16);
    if (dropKeys.length > 0) {
      drawText('「素材ドロップ」', 180, 220, '#88ffcc', 13);
      dropKeys.forEach((id, i) => {
        const nm = ITEMS[id]?.name || id;
        drawText(`  ${nm}  x${drops[id]}`, 180, 237 + i * 18, '#ccffee', 12);
      });
    }
    drawText('続ける...', 180, 225 + dropKeys.length * 18 + (dropKeys.length > 0 ? 15 : 0), '#aabbff', 14);
  }
  if (bd.phase === 'defeat') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, 640, 480);
    drawBox(200, 180, 240, 100, 'ゲームオーバー');
    drawText('全員がたおれてしまった...', 215, 210, '#ff6666', 13);
    drawText('Zキーで続ける', 215, 240, '#aaaaff', 13);
  }
}

function renderMenu() {
  renderMap();
  const m = GameState.menu;
  if (!m) return;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, 640, 480);
  if (!m.subMode) {
    const menuH = 60 + m.items.length * 28;
    drawBox(440, 80, 180, menuH, 'メニュー');
    m.items.forEach((item, i) => { const sel = i === m.selected; drawText((sel ? '▶' : ' ') + item, 455, 100 + i * 28, sel ? '#fff' : '#aabbff', 15); });
    drawBox(440, 80 + menuH + 8, 180, 40); drawText(`💰 所持金: ${GameState.gold}G`, 455, 98 + menuH + 8, '#ffdd44', 14);
  } else if (m.subMode === 'party') {
    drawBox(60, 60, 520, 360, 'パーティ');
    GameState.party.forEach((member, i) => {
      const x = 80 + (i % 2) * 260; const y = 90 + Math.floor(i / 2) * 130;
      drawBox(x, y, 240, 120); drawCharSprite(member.key, x + 8, y + 10, 'down', 0, 48);
      drawText(`${member.name}  Lv${member.level}`, x + 65, y + 12, '#aabbff', 14);
      drawHPBar('HP', member.hp, member.maxHp, x + 65, y + 36, 160);
      drawMPBar(member.mp, member.maxMp, x + 65, y + 52, 160);
      drawText(`MP ${member.mp}/${member.maxMp}`, x + 65, y + 60, '#6699ff', 11);
      drawText(`こうげき:${member.atk}  ぼうぎょ:${member.def}`, x + 65, y + 78, '#ccddff', 11);
      drawText(`すばやさ:${member.spd}   EXP:${member.exp}`, x + 65, y + 92, '#ccddff', 11);
    });
    drawText('Xキー / Zキーでもどる', 80, 400, '#888899', 12);
  } else if (m.subMode === 'items') {
    // もちもの画面: インベントリ一覧
    drawBox(40, 40, 560, 400, 'もちもの');
    const allItemIds = Object.keys(GameState.inventory);
    if (allItemIds.length === 0) {
      drawText('まだなにもないよ！戦闘で素材を集めよう！', 60, 80, '#888899', 13);
    } else {
      // 食材・パーツ・ガチャ資源の3カテゴリに分けて表示
      const categories = [
        { key: 'food', label: '🍱 食材', color: '#aaffaa' },
        { key: 'parts', label: '⚙️ パーツ', color: '#aaccff' },
        { key: 'gacha', label: '📷 ガチャ資源', color: '#ffddaa' },
      ];
      let col = 0;
      categories.forEach(cat => {
        const ids = allItemIds.filter(id => ITEMS[id]?.category === cat.key && GameState.inventory[id] > 0);
        if (ids.length === 0) return;
        const baseX = 55 + col * 190;
        drawText(cat.label, baseX, 65, cat.color, 12);
        ids.forEach((id, i) => {
          const nm = ITEMS[id]?.name || id;
          const cnt = GameState.inventory[id];
          drawText(`${nm}`, baseX, 85 + i * 20, '#eeeeff', 12);
          drawText(`x${cnt}`, baseX + 140, 85 + i * 20, '#ffdd44', 12);
        });
        col++;
      });
      // お弁当ボックス
      drawBox(40, 310, 560, 110, 'お弁当ボックス (構成済み)');
      if (GameState.bentoBag.length === 0) {
        drawText('お弁当がありません。キッチンで作ろう！', 60, 340, '#888899', 12);
      } else {
        GameState.bentoBag.forEach((b, i) => {
          drawText(`■ ${b.name}`, 55 + (i % 3) * 185, 335 + Math.floor(i / 3) * 22, '#ffffcc', 11);
        });
      }
    }
    drawText('Xキーでもどる', 55, 420, '#888899', 12);
  } else if (m.subMode === 'kitchen') {
    drawBox(40, 40, 560, 400, 'お弁当キッチン');
    drawText('素材を消費して、強力なお弁当を作ります。', 60, 65, '#888899', 12);
    RECIPES.forEach((r, i) => {
      const sel = i === m.subSelected;
      ctx.fillStyle = sel ? '#4455ff' : 'transparent'; ctx.fillRect(58, 88 + i * 40, 524, 38);
      drawText((sel ? '▶ ' : '  ') + r.name, 65, 95 + i * 40, sel ? '#ffffff' : '#aabbff', 14);
      let costText = '';
      let canCraft = true;
      for (const [cId, cnt] of Object.entries(r.cost)) {
        const has = GameState.inventory[cId] || 0;
        costText += `${ITEMS[cId].name}(${has}/${cnt})  `;
        if (has < cnt) canCraft = false;
      }
      drawText(`必要素材: ${costText}`, 85, 112 + i * 40, canCraft ? '#aaffaa' : '#ff8888', 11);
    });
    const selRecipe = RECIPES[m.subSelected];
    drawBox(40, 320, 560, 120, 'レシピ詳細');
    drawText(selRecipe.desc, 60, 345, '#eeeeff', 13);
    drawText('Zキーで作る / Xキーでもどる', 60, 410, '#888899', 12);
  } else if (m.subMode === 'workshop') {
    drawBox(40, 40, 560, 400, 'カラクリ工房');
    drawText('パーツを組み立てて、専用ガジェットを作ります。', 60, 65, '#888899', 12);
    GADGETS.forEach((g, i) => {
      const sel = i === m.subSelected;
      ctx.fillStyle = sel ? '#4455ff' : 'transparent'; ctx.fillRect(58, 88 + i * 40, 524, 38);
      const isEquipped = GameState.gadgets[g.forChar] === g.id;
      drawText((sel ? '▶ ' : '  ') + g.name + (isEquipped ? ' [装備中]' : ''), 65, 95 + i * 40, isEquipped ? '#ffffaa' : (sel ? '#ffffff' : '#aabbff'), 14);
      let costText = '';
      let canCraft = true;
      for (const [cId, cnt] of Object.entries(g.cost)) {
        const has = GameState.inventory[cId] || 0;
        costText += `${ITEMS[cId].name}(${has}/${cnt})  `;
        if (has < cnt) canCraft = false;
      }
      drawText(isEquipped ? 'すでに装備しています。' : `必要素材: ${costText}`, 85, 112 + i * 40, isEquipped ? '#aaaaaa' : (canCraft ? '#aaffaa' : '#ff8888'), 11);
    });
    const selGadget = GADGETS[m.subSelected];
    drawBox(40, 320, 560, 120, 'ガジェット詳細');
    const charName = CHARACTER_STATS[selGadget.forChar].name;
    drawText(`専用: ${charName}`, 60, 345, '#ffcc88', 13);
    drawText(selGadget.desc, 140, 345, '#eeeeff', 13);
    drawText('Zキーで作る / Xキーでもどる', 60, 410, '#888899', 12);
  }
}

const titleStars = Array.from({ length: 80 }, () => ({ x: Math.random() * 640, y: Math.random() * 480, r: Math.random() * 2 + 0.5, speed: Math.random() * 0.5 + 0.2, blink: Math.random() * Math.PI * 2 }));

function renderTitle() {
  const bg = ctx.createLinearGradient(0, 0, 0, 480);
  bg.addColorStop(0, '#050818'); bg.addColorStop(0.5, '#0a1530'); bg.addColorStop(1, '#1a2050');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 640, 480);
  const t = Date.now() / 1000;
  titleStars.forEach(s => { const alpha = 0.5 + 0.5 * Math.sin(t * s.speed + s.blink); ctx.fillStyle = `rgba(255,255,255,${alpha})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });
  ctx.fillStyle = '#ffeecc'; ctx.beginPath(); ctx.arc(540, 80, 40, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#eeddaa'; ctx.beginPath(); ctx.arc(555, 75, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#0a1530'; ctx.beginPath(); ctx.arc(560, 80, 38, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a2a1a'; ctx.beginPath(); ctx.moveTo(0, 480); ctx.quadraticCurveTo(160, 360, 320, 390); ctx.quadraticCurveTo(480, 420, 640, 370); ctx.lineTo(640, 480); ctx.fill();
  ctx.save(); ctx.shadowColor = '#4466ff'; ctx.shadowBlur = 30; ctx.fillStyle = '#eeeeff'; ctx.font = `bold 36px ${FONT_JP}`; ctx.textAlign = 'center'; ctx.fillText('かなとの大冒険', 320, 160); ctx.shadowColor = '#aaccff'; ctx.fillStyle = '#aaccff'; ctx.font = `18px ${FONT_JP}`; ctx.fillText('～ 家族をさがして ～', 320, 200); ctx.restore();
  ['kanato', 'dog', 'turtle', 'mama', 'papa'].forEach((key, i) => { const x = 80 + i * 120; const y = 290 + Math.sin(t * 1.5 + i * 0.8) * 6; drawCharSprite(key, x, y, 'down', Math.floor(t * 4 + i) % 3, 48); });
  if (Math.floor(t * 2) % 2 === 0) { drawText('Zキー または Enterキーでスタート', 320, 380, '#ffffff', 16, 'center'); }
  ctx.fillStyle = '#445566'; ctx.font = `11px ${FONT_JP}`; ctx.textAlign = 'center'; ctx.fillText('かなとの大冒険 | 操作: 矢印キー移動 | Z決定 | X メニュー/キャンセル', 320, 460);
}

function renderEnding() {
  const bg = ctx.createLinearGradient(0, 0, 0, 480);
  bg.addColorStop(0, '#ffcc88'); bg.addColorStop(1, '#ff8844'); ctx.fillStyle = bg; ctx.fillRect(0, 0, 640, 480);
  ctx.fillStyle = '#553311'; ctx.font = `bold 28px ${FONT_JP}`; ctx.textAlign = 'center'; ctx.fillText('おわり', 320, 80);
  ['kanato', 'dog', 'turtle', 'mama', 'papa'].forEach((key, i) => drawCharSprite(key, 110 + i * 100, 200, 'down', Math.floor(Date.now() / 400) % 3, 64));
  ctx.fillStyle = '#332211'; ctx.font = `18px ${FONT_JP}`; ctx.fillText('家族みんなで、おうちにかえった！', 320, 330);
  ctx.font = `14px ${FONT_JP}`; ctx.fillText('かなとのだいぼうけん、おわり！', 320, 360); ctx.fillText('あそんでくれてありがとう！', 320, 390);
  if (Math.floor(Date.now() / 600) % 2 === 0) drawText('Zキーでタイトルへもどる', 320, 440, '#884422', 13, 'center');
}

function renderGameOver() {
  ctx.fillStyle = '#000011'; ctx.fillRect(0, 0, 640, 480);
  ctx.fillStyle = '#ff3333'; ctx.font = `bold 40px ${FONT_JP}`; ctx.textAlign = 'center'; ctx.fillText('ゲームオーバー', 320, 200);
  ctx.fillStyle = '#8888aa'; ctx.font = `16px ${FONT_JP}`; ctx.fillText('あきらめないで！もういちどがんばろう！', 320, 260);
  if (Math.floor(Date.now() / 600) % 2 === 0) drawText('Zキーでタイトルへもどる', 320, 320, '#aaaaff', 15, 'center');
}

function renderShop() {
  renderMap();
  const sd = GameState.shopData;
  if (!sd) return;

  // 背景オーバーレイ
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, 640, 480);

  const isWeapon = sd.type === 'weapon';
  const title = isWeapon ? '⚔ 武器屋' : '🧪 道具屋';
  const accentColor = isWeapon ? '#ffcc44' : '#44ffcc';

  // メインパネル
  drawBox(80, 60, 480, 360, title);

  // タイトル装飾
  ctx.fillStyle = accentColor;
  ctx.font = `bold 18px ${FONT_JP}`;
  ctx.textAlign = 'center';
  ctx.fillText(title, 320, 92);

  // 所持金
  ctx.font = `14px ${FONT_JP}`;
  ctx.fillStyle = '#ffdd44';
  ctx.textAlign = 'right';
  ctx.fillText(`💰 ${GameState.gold}G`, 548, 92);

  // 商品リスト
  sd.items.forEach((item, i) => {
    const sel = i === sd.selected;
    const y = 120 + i * 46;
    // 選択ハイライト
    if (sel) {
      ctx.fillStyle = 'rgba(80,120,220,0.35)';
      ctx.fillRect(90, y - 2, 460, 40);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(90, y - 2, 460, 40);
    }
    // 商品名
    ctx.fillStyle = sel ? '#ffffff' : '#aabbff';
    ctx.font = `bold 14px ${FONT_JP}`;
    ctx.textAlign = 'left';
    ctx.fillText((sel ? '▶ ' : '  ') + item.name, 100, y + 14);

    // 説明文
    ctx.fillStyle = '#7788aa';
    ctx.font = `11px ${FONT_JP}`;
    ctx.fillText(item.desc, 110, y + 30);

    // 価格
    const canBuy = GameState.gold >= item.price;
    ctx.fillStyle = canBuy ? '#ffdd44' : '#aa6644';
    ctx.font = `bold 14px ${FONT_JP}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${item.price}G`, 540, y + 14);
  });

  // 区切り線
  ctx.strokeStyle = '#334466';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(90, 355);
  ctx.lineTo(550, 355);
  ctx.stroke();

  // 操作ガイド
  drawText('Z: 購入  X: やめる  ↑↓: 選択', 320, 368, '#7788aa', 12, 'center');

  // 選択中の商品の詳細説明エリア
  const selItem = sd.items[sd.selected];
  if (selItem) {
    const canBuy = GameState.gold >= selItem.price;
    const msg = canBuy ? `「${selItem.name}」を ${selItem.price}G で買いますか？` : `お金が足りません（${selItem.price}G 必要）`;
    const col = canBuy ? '#aaffcc' : '#ff8888';
    drawText(msg, 320, 393, col, 13, 'center');
  }
}
