// Direct-file entry assembled from the ES modules in this directory.
(() => {
"use strict";

// ---- src/cards.js ----
const suits = {
  Lantern: { icon: '◆', action: 'Attack', note: 'burns Embers' },
  Moth: { icon: '✦', action: 'Guard', note: 'shields the Keeper' },
  Wind: { icon: '≈', action: 'Tempo', note: 'draws and chills' },
  Wax: { icon: '●', action: 'Mend', note: 'heals and seals' },
};

const catalog = [
  ['Foxfire', 'Lantern', 1, 2],
  ['Cricket Lamp', 'Lantern', 1, 2, { burn: 1 }],
  ['Saffron Torch', 'Lantern', 2, 4],
  ['Last Beacon', 'Lantern', 3, 6, { burn: 2 }],
  ['Pale Silkmoth', 'Moth', 1, 2],
  ['Velvet Wing', 'Moth', 1, 2, { shroud: 1 }],
  ['Paper Wings', 'Moth', 1, 3],
  ['Ash Cloak', 'Moth', 2, 4],
  ['Moon Mantle', 'Moth', 2, 5, { shroud: 1 }],
  ['Roof Draft', 'Wind', 0, 1, { draw: 1 }],
  ['Bell Gust', 'Wind', 0, 1, { wick: 1 }],
  ['Honey Seal', 'Wax', 1, 2, { heal: 2 }],
  ['Amber Salve', 'Wax', 2, 3, { heal: 2 }],
  ['Smoke', 'Wind', 1, 2, { smoke: 2 }],
  ['Kindle', 'Wind', 0, 1, { wick: 1, draw: 1 }],
  ['Molt', 'Moth', 1, 0, { molt: true }],
].map(([name, suit, cost, value, effect = {}]) => ({ name, suit, cost, value, effect }));

function deck() {
  return catalog.map(card => ({ ...card }));
}

function cardText(card) {
  const parts = [];
  const { effect } = card;
  if (effect.smoke) parts.push('Next attack −2');
  if (effect.molt) parts.push('Discard 1 · Ignore next hit');
  if (effect.burn) parts.push(`Burn ${effect.burn}`);
  if (effect.shroud) parts.push(`Shroud ${effect.shroud}`);
  if (effect.heal) parts.push(`Heal ${effect.heal}`);
  if (effect.draw) parts.push(`Draw ${effect.draw}`);
  if (effect.wick) parts.push(`+${effect.wick} Wick`);
  if (parts.length) return parts.join(' · ');
  return suits[card.suit].action;
}

// ---- src/duel.js ----

const MAX_EMBERS = 12;
const HAND_SIZE = 5;
const BASE_WICK = 3;
const PLAY_LIMIT = 3;
const FLARE_COST = 3;
const BURST_DAMAGE = 6;

function randomFrom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle(items, random) {
  for (let index = items.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}

function draw(side, random) {
  if (side.hand.length >= HAND_SIZE) return;
  if (!side.deck.length) side.deck = shuffle(side.discard.splice(0), random);
  if (side.deck.length) side.hand.push(side.deck.pop());
}

function newDuelist(random) {
  const side = {
    embers: MAX_EMBERS, wick: BASE_WICK, flare: 0, discount: 0,
    deck: shuffle(deck(), random), hand: [], discard: [], played: [],
    status: { burn: 0, burnTurns: 0, shroud: 0, smoke: 0, molt: false },
  };
  for (let index = 0; index < HAND_SIZE; index++) draw(side, random);
  return side;
}

function costOf(side, card) {
  return Math.max(0, card.cost - side.discount);
}

function canPlay(side, card) {
  return side.played.length < PLAY_LIMIT && costOf(side, card) <= side.wick
    && (!card.effect.molt || side.hand.length > 1 && !side.status.molt);
}

function comboCount(played, suit) {
  return played.filter(card => card.suit === suit).length;
}

function totals(played, status = { shroud: 0 }) {
  const sum = suit => played.filter(card => card.suit === suit).reduce((total, card) => total + card.value, 0);
  const lanterns = comboCount(played, 'Lantern');
  const moths = comboCount(played, 'Moth');
  const attackBonus = lanterns >= 2 ? 2 : 0;
  const guardBonus = moths >= 2 ? 2 : 0;
  return {
    attack: sum('Lantern') + attackBonus,
    guard: sum('Moth') + guardBonus + (status.shroud || 0),
    lanterns, moths,
  };
}

function attackOf(stats, status) {
  return Math.max(0, stats.attack - status.smoke);
}

function absorbHit(side, amount) {
  if (amount > 0 && side.status.molt) {
    side.status.molt = false;
    return 0;
  }
  const damage = Math.min(side.embers, amount);
  side.embers -= damage;
  return damage;
}

function play(side, foe, index, random, discardIndex) {
  const card = side.hand[index];
  if (!card || !canPlay(side, card)) return false;
  if (card.effect.molt) {
    if (!Number.isInteger(discardIndex) || discardIndex === index || !side.hand[discardIndex]) return false;
    side.discard.push(...side.hand.splice(discardIndex, 1));
    if (discardIndex < index) index--;
    side.status.molt = true;
  }
  if (card.effect.smoke) foe.status.smoke += card.effect.smoke;
  side.wick -= costOf(side, card);
  side.discount = 0;
  side.played.push(...side.hand.splice(index, 1));
  side.flare = Math.min(FLARE_COST, side.flare + 1);
  if (card.effect.heal) side.embers = Math.min(MAX_EMBERS, side.embers + card.effect.heal);
  if (card.effect.wick) side.wick += card.effect.wick;
  if (card.effect.draw) for (let n = 0; n < card.effect.draw; n++) draw(side, random);
  if (card.suit === 'Wax') side.discount = 1;
  if (card.effect.burn) {
    foe.status.burn = Math.min(6, foe.status.burn + card.effect.burn);
    foe.status.burnTurns = 2;
  }
  if (card.effect.shroud) side.status.shroud = Math.min(4, side.status.shroud + card.effect.shroud);
  return true;
}

function unleash(side, foe) {
  if (side.flare < FLARE_COST) return false;
  side.flare = 0;
  return absorbHit(foe, BURST_DAMAGE);
}

function resetTurn(side, random) {
  side.discard.push(...side.played.splice(0));
  side.discount = 0;
  side.wick = BASE_WICK;
  while (side.hand.length < HAND_SIZE && (side.deck.length || side.discard.length)) draw(side, random);
}

function tickStatus(side) {
  let burn = 0;
  if (side.status.burnTurns > 0 && side.status.burn > 0) {
    burn = Math.min(side.embers, side.status.burn);
    side.embers -= burn;
    side.status.burnTurns -= 1;
    if (!side.status.burnTurns) side.status.burn = 0;
  }
  side.status.shroud = 0;
  return burn;
}

function finish(game) {
  if (!game.player.embers || !game.rival.embers) {
    game.result = game.player.embers ? 'win' : 'loss';
  }
}

function playCard(game, index, discardIndex) {
  if (game.result || !play(game.player, game.rival, index, game.random, discardIndex)) return false;
  const { lanterns, moths } = totals(game.player.played);
  game.bestChain = Math.max(game.bestChain, lanterns, moths);
  return true;
}

function wieldBurst(game) {
  if (game.result) return false;
  const dealt = unleash(game.player, game.rival);
  if (dealt === false) return false;
  finish(game);
  game.report = { dealt, taken: 0, burst: true };
  return true;
}

// ---- src/rival.js ----

const wardens = [
  { name: 'Ash Warden', tell: 'gathering ash', weights: { attack: 1.6, guard: 0.45, heal: 0.7, burn: 1.5, chill: 0.7, draw: 0.4, shroud: 0.5 } },
  { name: 'Veil Keeper', tell: 'wings raised', weights: { attack: 0.85, guard: 1.7, heal: 1.25, burn: 0.8, chill: 1.0, draw: 0.6, shroud: 1.5 } },
  { name: 'Gale Trickster', tell: 'reading the wind', weights: { attack: 1.1, guard: 0.7, heal: 0.75, burn: 1.0, chill: 1.7, draw: 1.3, shroud: 0.8 } },
];

function chooseWarden(random) {
  return wardens[Math.floor(random() * wardens.length)];
}

function gain(cards, key) {
  return cards.reduce((total, card) => total + (card.effect[key] || 0), 0);
}

function scorePlan(cards, weights, player, rival) {
  const stats = totals(cards, rival.status);
  const dealt = attackOf(stats, rival.status);
  const heal = Math.min(MAX_EMBERS - rival.embers, gain(cards, 'heal'));
  const burn = gain(cards, 'burn');
  const shroud = gain(cards, 'shroud');
  const chill = gain(cards, 'smoke');
  const lethal = dealt >= (player?.embers ?? 99) ? 8 : 0;
  return lethal
    + dealt * weights.attack
    + stats.guard * weights.guard
    + heal * weights.heal
    + burn * weights.burn
    + shroud * weights.shroud
    + chill * weights.chill
    + gain(cards, 'draw') * weights.draw
    + gain(cards, 'wick') * 0.5
    + Number(cards.some(card => card.effect.molt)) * weights.guard * 2
    - cards.length * 0.05;
}

function plans(played, available, wick, discount) {
  const found = [played];
  if (played.length >= PLAY_LIMIT || played.at(-1)?.effect.molt) return found;
  for (const card of available) {
    const cost = Math.max(0, card.cost - discount);
    if (cost > wick || card.effect.molt && available.length < 2) continue;
    found.push(...plans(
      [...played, card],
      available.filter(other => other !== card),
      wick - cost + (card.effect.wick || 0),
      card.suit === 'Wax' ? 1 : 0,
    ));
  }
  return found;
}

function choosePlan(rival, weights, player) {
  let best = [];
  let bestScore = scorePlan(best, weights, player, rival);
  for (const choice of plans([], rival.hand, rival.wick, 0)) {
    if (rival.status.molt && choice.some(card => card.effect.molt)) continue;
    const value = scorePlan(choice, weights, player, rival);
    if (value > bestScore) {
      bestScore = value;
      best = choice;
    }
  }
  return best;
}

function intentOf(game) {
  const stats = totals(game.plan, game.rival.status);
  return { attack: attackOf(stats, game.rival.status), guard: stats.guard + gain(game.plan, 'shroud') };
}

function describe(warden) {
  return `${warden.name} · ${warden.tell}`;
}

// ---- src/match.js ----

function prepareTurn(game) {
  resetTurn(game.player, game.random);
  resetTurn(game.rival, game.random);
  game.plan = choosePlan(game.rival, game.warden.weights, game.player);
  const flare = game.rival.flare;
  game.rivalBurst = flare >= FLARE_COST
    && (game.player.embers <= BURST_DAMAGE + 2 || game.random() < 0.35);
}

function newGame(seed) {
  const random = randomFrom(seed);
  const game = {
    random, warden: chooseWarden(random), round: 1, bestChain: 0, result: null, report: null,
    player: newDuelist(random), rival: newDuelist(random),
  };
  prepareTurn(game);
  return game;
}

function resolveRound(game) {
  const { player, rival } = game;
  for (const card of game.plan) {
    const spare = card.effect.molt ? rival.hand.findIndex(candidate => !game.plan.includes(candidate)) : undefined;
    play(rival, player, rival.hand.indexOf(card), game.random, spare);
  }
  const your = totals(player.played, player.status);
  const their = totals(rival.played, rival.status);
  const yourAttack = attackOf(your, player.status);
  const theirAttack = attackOf(their, rival.status);
  if (your.attack > 0) player.status.smoke = 0;
  if (their.attack > 0) rival.status.smoke = 0;

  const burst = game.rivalBurst ? unleash(rival, player) : false;
  const taken = (burst || 0) + absorbHit(player, Math.max(0, theirAttack - your.guard));
  const dealt = absorbHit(rival, Math.max(0, yourAttack - their.guard));
  game.report = { dealt, taken, burst: burst !== false };
  finish(game);
  if (game.result) return;

  const playerBurned = tickStatus(player);
  const rivalBurned = tickStatus(rival);
  if (playerBurned || rivalBurned) game.report.burn = { player: playerBurned, rival: rivalBurned };
  finish(game);
}

function previewRound(game) {
  const copy = structuredClone({ player: game.player, rival: game.rival, plan: game.plan });
  // Draws cannot change committed plays or damage. Use a local RNG for any reshuffle.
  const preview = { ...copy, random: randomFrom(1), rivalBurst: game.rivalBurst };
  resolveRound(preview);
  return {
    intent: intentOf(game),
    dealt: preview.report.dealt + (preview.report.burn?.rival || 0),
    taken: preview.report.taken + (preview.report.burn?.player || 0),
    rivalAfter: preview.rival.embers,
    playerAfter: preview.player.embers,
  };
}

function endTurn(game) {
  if (game.result) return;
  resolveRound(game);
  if (game.result) return;
  game.round++;
  prepareTurn(game);
}

// ---- src/replay.js ----

// These moves were played with seed 1. The table capture pauses mid-round
// on Ignite, and the victory capture continues from that exact position.
const tableMoves = [
  ['Roof Draft'], ['Pale Silkmoth'], ['Ash Cloak'], 'burst', 'end',
  ['Moon Mantle'], ['Molt', 'Velvet Wing'], 'end',
  ['Cricket Lamp'], ['Foxfire'],
];

const winMoves = [
  ...tableMoves, ['Smoke'], 'end',
  ['Bell Gust'], ['Kindle'], ['Last Beacon'], 'burst',
];

function replay(seed, scene) {
  const game = newGame(seed);
  if (scene === 'loss') {
    while (!game.result && game.round <= 20) endTurn(game);
    return game;
  }
  for (const move of scene === 'win' ? winMoves : tableMoves) {
    if (game.result) break;
    if (move === 'end') endTurn(game);
    else if (move === 'burst') wieldBurst(game);
    else {
      const [name, discard] = move;
      const { hand } = game.player;
      playCard(game, hand.findIndex(card => card.name === name), hand.findIndex(card => card.name === discard));
    }
  }
  return game;
}

// ---- src/art.js ----

function starfield(ctx, width, height, count, warm) {
  const random = randomFrom(9173);
  for (let index = 0; index < count; index++) {
    const x = random() * width;
    const y = random() * height;
    ctx.globalAlpha = 0.25 + random() * 0.6;
    ctx.fillStyle = index % 5 === 0 ? warm : '#575070';
    const size = index % 17 === 0 ? 3 : index % 7 === 0 ? 2 : 1;
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;
}

function moon(ctx, x, y, radius, dim) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = dim ? '#383d5b' : '#594154';
  for (const offset of [8, 22]) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + offset, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = dim ? '#8e93b5' : '#f4d3a1';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = dim ? '#7b81a4' : '#e9bd88';
  for (const [ox, oy, size] of [[-8, -6, 9], [10, 8, 6], [5, -14, 4]]) {
    ctx.beginPath();
    ctx.arc(ox, oy, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function reed(ctx, x, y, height, lean, colour) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * 0.4, y - height * 0.6, x + lean, y - height);
  ctx.stroke();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(x + lean, y - height, 3, 9, lean * 0.01, 0, Math.PI * 2);
  ctx.fill();
}

function moth(ctx, x, y, scale, muted) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const wings = [
    'M 0 18 C -54 -113 -183 -141 -249 -103 C -262 -37 -176 67 -21 57 Z',
    'M -12 39 C -91 4 -206 49 -193 110 C -170 182 -60 143 -7 59 Z',
  ];
  for (const direction of [-1, 1]) {
    ctx.save();
    ctx.scale(direction, 1);
    for (const [index, path] of wings.entries()) {
      const gradient = ctx.createLinearGradient(-240, -100, 0, 70);
      gradient.addColorStop(0, muted ? '#636b98' : '#e9ac76');
      gradient.addColorStop(1, muted ? '#222947' : '#8b3c53');
      ctx.fillStyle = gradient;
      ctx.strokeStyle = muted ? '#a4a0bd' : '#ffcd89';
      ctx.lineWidth = 2;
      ctx.fill(new Path2D(path));
      ctx.stroke(new Path2D(path));
      ctx.save();
      ctx.clip(new Path2D(path));
      ctx.lineWidth = 1;
      for (let line = 0; line < 12; line++) {
        const end = index ? 56 + line * 10 : -121 + line * 14;
        ctx.stroke(new Path2D(`M -6 49 Q -120 ${end - 24} -260 ${end}`));
      }
      ctx.restore();
    }
    ctx.fillStyle = muted ? '#343959' : '#733d50';
    ctx.strokeStyle = '#e8b685';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-145, -33, 29, 19, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-145, -33, 15, 8, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffdb9c';
    ctx.fill();
    ctx.stroke(new Path2D('M -4 30 Q -18 -9 -44 -20'));
    ctx.restore();
  }
  ctx.fillStyle = '#f3c68b';
  ctx.beginPath();
  ctx.ellipse(0, 48, 7, 36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f3c68b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-3, 6);
  ctx.quadraticCurveTo(-20, -28, -34, -36);
  ctx.moveTo(3, 6);
  ctx.quadraticCurveTo(20, -28, 34, -36);
  ctx.stroke();
  ctx.restore();
}

function lantern(ctx, x, y, size, dimmed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.strokeStyle = '#9a6d63';
  ctx.lineWidth = 1;
  ctx.stroke(new Path2D('M 0 -480 L 0 -24 M 0 24 L 0 43'));
  if (!dimmed) {
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 78);
    glow.addColorStop(0, 'rgba(255,183,95,.5)');
    glow.addColorStop(1, 'rgba(255,183,95,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 78, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = dimmed ? '#42425f' : '#eb934f';
  ctx.strokeStyle = dimmed ? '#82829d' : '#ffd58d';
  const shape = new Path2D('M -12 -23 L 12 -23 Q 35 0 12 23 L -12 23 Q -35 0 -12 -23');
  ctx.fill(shape);
  ctx.stroke(shape);
  ctx.stroke(new Path2D('M -6 -23 Q -17 0 -6 23 M 6 -23 Q 17 0 6 23 M -24 0 L 24 0'));
  ctx.restore();
}

function ash(ctx, width, height, count, warm) {
  const random = randomFrom(5521);
  for (let index = 0; index < count; index++) {
    const x = random() * width;
    const y = random() * height;
    const size = 1 + random() * 2.4;
    ctx.globalAlpha = 0.16 + random() * 0.4;
    ctx.fillStyle = index % 3 ? warm : '#d0a08b';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function ring(ctx, x, y, scale, dim) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = dim ? '#252b46' : '#331f30';
  ctx.strokeStyle = dim ? '#5c5e80' : '#91615b';
  for (const radius of [175, 191, 223]) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    if (radius === 175) ctx.fill();
    ctx.stroke();
  }
  for (let tick = 0; tick < 72; tick++) {
    ctx.rotate(Math.PI / 36);
    ctx.fillStyle = dim ? '#71738f' : '#a8766b';
    ctx.fillRect(205, 0, tick % 6 === 0 ? 11 : 4, 1);
  }
  ctx.strokeStyle = dim ? '#5f617f' : '#956362';
  ctx.stroke(new Path2D('M -280 0 H 280 M 0 -251 V 251'));
  ctx.restore();
}

function paintFestival(canvas, scene, celebrate = false) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const hero = scene !== 'table';
  const dim = scene === 'loss';
  ctx.fillStyle = dim ? '#121527' : '#16172b';
  ctx.fillRect(0, 0, width, height);
  if (!hero) {
    const wash = ctx.createLinearGradient(0, 0, 0, height);
    wash.addColorStop(0, 'rgba(70,40,59,.42)');
    wash.addColorStop(1, 'rgba(15,16,32,0)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);
  }
  starfield(ctx, width, height, hero ? 240 : 110, dim ? '#9aa4cf' : '#f0b57c');
  if (!hero) {
    moon(ctx, width * 0.86, height * 0.18, 34, dim);
    for (let index = 0; index < 26; index++) {
      const x = ((index * 173) % 1000) / 1000 * width;
      reed(ctx, x, height + 6, 40 + (index % 5) * 18, (index % 2 ? 1 : -1) * (6 + index % 7), dim ? '#3a3f5d' : '#3d3049');
    }
    ring(ctx, width * 0.5, height * 0.5, Math.min(width, height) / 720, dim);
    ash(ctx, width, height, 26, dim ? '#9aa4cf' : '#f2b47a');
    return;
  }
  const scale = Math.min(width / 1280, height / 720);
  const centerX = width * 0.735;
  const centerY = height * 0.5;
  moon(ctx, centerX, centerY, 210 * scale, dim);
  ring(ctx, centerX, centerY, scale, dim);
  lantern(ctx, width * 0.557, height * 0.18, 0.8 * scale * (celebrate ? 1.05 : 1), dim);
  lantern(ctx, width * 0.93, height * 0.24, scale, dim);
  lantern(ctx, width * 0.875, height * 0.09, 0.52 * scale, dim);
  lantern(ctx, width * 0.64, height * 0.07, 0.34 * scale, dim);
  moth(ctx, centerX, centerY - 10 * scale, 1.02 * scale, dim);
  if (celebrate) {
    moth(ctx, centerX - 172 * scale, centerY + 92 * scale, 0.3 * scale, false);
    moth(ctx, centerX + 186 * scale, centerY + 58 * scale, 0.24 * scale, false);
    const random = randomFrom(881);
    for (let index = 0; index < 70; index++) {
      const x = centerX + (random() - 0.5) * 620 * scale;
      const y = centerY + (random() - 0.5) * 560 * scale;
      ctx.globalAlpha = 0.35 + random() * 0.6;
      ctx.fillStyle = index % 3 ? '#f6bf73' : '#e0909a';
      ctx.fillRect(x, y, 2 + random() * 4, 2 + random() * 4);
    }
    ctx.globalAlpha = 1;
  }
  ash(ctx, width, height, 34, dim ? '#9aa4cf' : '#f2b47a');
}

// ---- src/effects.js ----
let audio;

function context() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  return audio;
}

function tone(frequency, duration = 0.08, type = 'triangle', volume = 0.035) {
  try {
    const ctx = context();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function dealSound(index) {
  tone(190 + index * 24, 0.07, 'sine', 0.025);
}

function glassSound() {
  tone(520, 0.16, 'triangle', 0.04);
  tone(780, 0.2, 'sine', 0.02);
}

function hurtSound() {
  tone(96, 0.28, 'sawtooth', 0.05);
}

function burstSound() {
  tone(300, 0.5, 'sawtooth', 0.06);
  tone(620, 0.6, 'triangle', 0.04);
}

function victorySound() {
  [392, 494, 587, 784].forEach((note, index) => {
    setTimeout(() => tone(note, 0.5, 'triangle', 0.05), index * 150);
  });
}

function floatAt(anchor, text, kind = '') {
  if (!anchor) return;
  const node = document.createElement('span');
  node.className = `float ${kind}`;
  node.textContent = text;
  anchor.append(node);
  setTimeout(() => node.remove(), 1200);
}

function shake(node) {
  node.classList.remove('shake');
  void node.offsetWidth;
  node.classList.add('shake');
  setTimeout(() => node.classList.remove('shake'), 420);
}

function flashEmbers(meter, damage, kind = 'hit') {
  if (!meter || !damage) return;
  meter.classList.add('damaged');
  floatAt(meter, `−${damage}`, kind);
}

function snapCard(bounds, slot) {
  if (!bounds || !slot || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const landing = slot.getBoundingClientRect();
  const x = bounds.left + (bounds.width - landing.width) / 2 - landing.left;
  const y = bounds.top + (bounds.height - landing.height) / 2 - landing.top;
  slot.animate([
    { transform: `translate(${x}px, ${y}px) scale(1.18) rotate(-5deg)`, opacity: .65 },
    { transform: 'scale(.92)', opacity: 1, offset: .78 },
    { transform: 'scale(1)', opacity: 1 },
  ], { duration: 245, easing: 'cubic-bezier(.25,.7,.4,1)' });
}

// ---- src/view.js ----

function suitIcon(suit) {
  return `<span class="suit-icon ${suit.toLowerCase()}" aria-hidden="true">${suits[suit].icon}</span>`;
}

function statusChips(side) {
  const chips = [];
  if (side.status.burn) chips.push(`<span class="chip burn" title="Burns ${side.status.burn} at round end">▲ Burn ${side.status.burn}</span>`);
  if (side.status.shroud) chips.push(`<span class="chip shroud" title="Extra guard this round">✦ Shroud ${side.status.shroud}</span>`);
  if (side.status.smoke) chips.push(`<span class="chip chill">≈ Smoke −${side.status.smoke}</span>`);
  if (side.status.molt) chips.push('<span class="chip shroud">✦ Molt ready</span>');
  return chips.join('');
}

function meter(side, label, tone = '') {
  return `<div class="health ${tone}">
    <div class="health-head"><span>${label}</span><strong>${side.embers}<small> / ${MAX_EMBERS}</small></strong></div>
    <div class="health-track" aria-hidden="true">${Array.from({ length: MAX_EMBERS }, (_, index) =>
      `<i class="${index < side.embers ? 'lit' : ''}"></i>`).join('')}</div>
    <div class="chips" aria-live="polite">${statusChips(side)}</div>
  </div>`;
}

function cardFace(card, cost, shortcut = '') {
  return `<span class="card-top"><span>${card.suit}</span><span class="cost" title="Wick cost">${cost}</span></span>
    <span class="card-art ${card.suit.toLowerCase()}">${suitIcon(card.suit)}<strong>${card.value}</strong></span>
    <span class="card-name">${card.name}</span>
    <span class="card-effect">${card.effect.molt ? 'Discard 1 · Dodge hit' : cardText(card)}${shortcut && `<kbd>${shortcut}</kbd>`}</span>`;
}

function feature(scene, game) {
  const title = scene === 'title';
  const won = scene === 'win';
  const name = title ? 'Ember<br>Duel' : won ? 'Festival<br>Victor' : 'The Last<br>Lantern';
  const copy = title
    ? 'A lantern-keeper duel at the moth festival. Read your rival’s tell, spend Wick on cards, and burn their Embers before yours go dark.'
    : won
      ? 'Your lantern burns through the night, and the festival crowns its Keeper.'
      : 'The rival’s lantern carries the last light. The moths drift to their flame.';
  return `<section class="feature ${scene}">
    <div class="imprint"><span>✦</span> THE MOTH LANTERN FESTIVAL</div>
    <div class="feature-content">
      <p class="eyebrow">${title ? 'A DUEL AT DUSK' : 'DUEL COMPLETE'}</p>
      <h1>${name}</h1>
      <p class="feature-copy">${copy}</p>
      ${won ? `<dl class="run-stats">
        <div><dt>Rounds</dt><dd>${game.round}</dd></div>
        <div><dt>Best chain</dt><dd>${game.bestChain >= 2 ? `×${game.bestChain}` : '—'}</dd></div>
        <div><dt>Embers left</dt><dd>${game.player.embers}</dd></div>
      </dl>` : title ? '' : `<div class="result-score"><span>You <b>${game.player.embers}</b></span><span>Rival <b>${game.rival.embers}</b></span></div>`}
      <button class="primary" data-action="start">${title ? 'Take up your lantern' : 'Duel again'} <span>→</span></button>
      <div class="feature-key"><kbd>Enter</kbd> to ${title ? 'begin' : 'restart'}</div>
    </div>
    ${title ? `<ul class="rules-strip">
      <li><b>◆ Lantern</b> burns Embers</li>
      <li><b>✦ Moth</b> guards</li>
      <li><b>≈ Wind</b> draws</li>
      <li><b>● Wax</b> mends</li>
    </ul>` : ''}
  </section>
  ${won ? `<div class="sparks" aria-hidden="true">${Array.from({ length: 22 }, (_, index) => {
    const angle = index * 1.9;
    const radius = 110 + (index % 7) * 30;
    return `<i style="--x:${Math.cos(angle) * radius}px;--y:${Math.sin(angle) * radius}px;--delay:${index * 24}ms"></i>`;
  }).join('')}</div>` : ''}
  <div class="plate-label" aria-hidden="true"><span></span> ${scene === 'loss' ? 'THE LANTERN GOES DARK' : 'THE MOTH AND THE FLAME'} <span></span></div>`;
}

function chain(name, suit, count) {
  const active = count >= 2;
  return `<div class="chain-pair ${suit.toLowerCase()} ${active ? 'active' : ''}">
    ${suitIcon(suit)} <strong>${name}</strong>
    <span class="chain-count">${Math.min(count, 2)}/2</span>
    <span class="chain-bonus">+2 ${suit === 'Lantern' ? 'attack' : 'guard'}</span>
  </div>`;
}

function table(game, moltIndex = null) {
  const { player, rival, report, warden } = game;
  const stats = totals(player.played, player.status);
  const forecast = game.result ? null : previewRound(game);
  const intent = forecast?.intent ?? intentOf(game);
  const choosing = moltIndex !== null;
  const burstReady = player.flare >= FLARE_COST;
  return `<section class="table">
    <header class="table-header">
      <div class="wordmark"><span>✦</span> Ember Duel</div>
      <span class="round">ROUND ${String(game.round).padStart(2, '0')}</span>
      <details><summary>How to play</summary><p>Spend ${BASE_WICK} Wick on up to ${PLAY_LIMIT} cards. Lantern attacks and Moth guards. Two Lanterns trigger Ignite (+2 attack), and two Moths trigger Veil (+2 guard). Smoke weakens the rival’s next attack by 2. Kindle adds 1 Wick and draws a card. Molt requires a discard and absorbs the next damaging hit. Burn damages Embers at round end. Every card builds Flare. Spend ${FLARE_COST} Flare on Beacon Burst for ${BURST_DAMAGE} damage.</p></details>
    </header>
    <div class="arena">
      <aside class="rail rival-rail">
        <div class="intent">
          <h2>Rival intent</h2>
          <p class="tell">${describe(warden)}</p>
          <div class="intent-line">${suitIcon('Lantern')} <span>Attack</span><b>${intent.attack}</b></div>
          <div class="intent-line">${suitIcon('Moth')} <span>Guard</span><b>${intent.guard}</b></div>
          ${game.plan.length ? `<div class="scheme">Playing <b>${game.plan[0].name}</b>${game.plan.length > 1 ? ` +${game.plan.length - 1}` : ''}</div>` : '<div class="scheme">holding back</div>'}
          ${game.rivalBurst ? '<div class="scheme">Beacon Burst ready</div>' : ''}
        </div>
        <div class="meter-wrap">${meter(rival, 'Rival embers', 'rival')}</div>
      </aside>
      <div class="field">
        <div class="rival-hand" aria-label="Rival hand, ${rival.hand.length} cards">
          <span class="hand-caption" aria-hidden="true">RIVAL HAND</span>
          ${rival.hand.map(() => '<span class="back" aria-hidden="true">✦</span>').join('')}
        </div>
        <div class="play-zone">
          <div class="zone-label">YOUR PLAYED CARDS <span>${player.played.length} / ${PLAY_LIMIT}</span></div>
          <div class="slots">${Array.from({ length: PLAY_LIMIT }, (_, index) => {
            const card = player.played[index];
            return card ? `<div data-slot="${index}" class="slot filled ${card.suit.toLowerCase()}" title="${card.name}">${suitIcon(card.suit)} <b>${card.value}</b></div>`
              : '<div class="slot" aria-hidden="true">◇</div>';
          }).join('')}</div>
          <div class="chain" aria-live="polite"><span>CHAIN</span>
            ${chain('Ignite', 'Lantern', stats.lanterns)}
            ${chain('Veil', 'Moth', stats.moths)}
          </div>
          <div class="combat" aria-live="polite">${suitIcon('Lantern')} ${attackOf(stats, player.status)} attack <span>·</span> ${suitIcon('Moth')} ${stats.guard} guard
</div>
        </div>
        ${choosing ? '<div class="discard-prompt" role="status">Choose a card to discard for Molt <button data-action="cancel">Cancel <kbd>Esc</kbd></button></div>' : ''}
        <div class="hand" aria-label="Your hand">${player.hand.map((card, index) =>
          `<button class="card ${card.suit.toLowerCase()}" data-card="${index}" ${(choosing ? index !== moltIndex : canPlay(player, card)) ? '' : 'disabled'}
            aria-label="${choosing ? 'Discard ' : ''}${card.name}, ${card.suit}, value ${card.value}, costs ${costOf(player, card)} Wick, ${cardText(card)}"
            title="${cardText(card)}" style="--deal: ${index * 65}ms">${cardFace(card, costOf(player, card), index + 1)}</button>`).join('')}</div>
      </div>
      <aside class="controls">
        <div class="meter-wrap player-meter">${meter(player, 'Your embers')}</div>
        <div class="report" aria-live="polite">${report ? `Last exchange<br><strong>${report.dealt} dealt · ${report.taken} taken</strong>${report.burn ? `<br><small>${report.burn.rival ? `Burn ${report.burn.rival} on rival` : ''}${report.burn.rival && report.burn.player ? ' · ' : ''}${report.burn.player ? `Burn ${report.burn.player} on you` : ''}</small>` : ''}${report.burst ? '<br><small>Beacon Burst!</small>' : ''}` : ''}</div>
        ${forecast ? `<div class="forecast" aria-live="polite"><span>DAMAGE PREVIEW</span>
          <div><span>Rival · ${forecast.rivalAfter} left</span><b>−${forecast.dealt}</b></div>
          <div><span>You · ${forecast.playerAfter} left</span><b>−${forecast.taken}</b></div>
        </div>` : ''}
        <div class="wick"><span>AVAILABLE WICK</span><div aria-label="${player.wick} Wick">${Array.from({ length: Math.max(3, player.wick) }, (_, index) =>
          `<i class="${index < player.wick ? 'lit' : ''}"></i>`).join('')}</div><strong>${player.wick}</strong>
          ${player.discount ? '<small>Next card costs 1 less</small>' : ''}</div>
        <div class="flare ${burstReady ? 'ready' : ''}"><span>FLARE</span>
          <div class="flare-pips" aria-label="${player.flare} of ${FLARE_COST} flare">${Array.from({ length: FLARE_COST }, (_, index) =>
            `<i class="${index < player.flare ? 'lit' : ''}"></i>`).join('')}</div>
          <button class="burst" data-action="burst" ${burstReady && !choosing ? '' : 'disabled'}>Beacon Burst <b>${FLARE_COST}</b></button>
        </div>
        <button class="primary" data-action="end" ${choosing ? 'disabled' : ''}>End turn <span>→</span></button>
        <div class="table-key"><kbd>1</kbd>–<kbd>${HAND_SIZE}</kbd> play <kbd>Space</kbd> burst</div>
      </aside>
    </div>
  </section>`;
}

// ---- src/main.js ----

const root = document.querySelector('#game');
const canvas = document.querySelector('#festival');
const query = new URLSearchParams(location.search);
const seed = query.has('seed') ? Number(query.get('seed')) : null;
const shot = query.get('shot');
let game = ['table', 'win', 'loss'].includes(shot) ? replay(seed ?? 1, shot) : null;
let paintedScene;
let sound = !shot;
let moltIndex = null;
let showingFinalHit = false;

function repaint() {
  paintFestival(canvas, paintedScene, paintedScene === 'win');
}

function render(deal = false, focus = null) {
  const scene = game ? (showingFinalHit ? 'table' : game.result || 'table') : 'title';
  const changed = scene !== paintedScene;
  paintedScene = scene;
  if (changed) repaint();
  root.dataset.scene = scene;
  root.classList.toggle('deal', deal && !shot);
  root.classList.toggle('celebrate', scene === 'win' && !shot);
  root.classList.toggle('still', Boolean(shot));
  root.innerHTML = scene === 'table' ? table(game, moltIndex) : feature(scene, game);
  root.inert = showingFinalHit;
  if (changed && sound && scene === 'win') victorySound();
  if (changed && sound && scene === 'loss') tone(120, 0.8, 'sine', 0.05);
  if (focus !== null && scene === 'table') {
    const target = [...root.querySelectorAll('.card:not(:disabled)')].find(button => Number(button.dataset.card) >= focus);
    (target || root.querySelector('[data-action="end"]')).focus({ preventScroll: true });
  } else if ((deal || game?.result) && !shot) {
    (root.querySelector('[data-action="end"]') || root.querySelector('[data-action]'))?.focus({ preventScroll: true });
  }
}

function showExchange(deal, burst = false) {
  const { report, result } = game;
  showingFinalHit = Boolean(result && !shot);
  render(deal && !result);
  const taken = report.taken + (report.burn?.player ?? 0);
  const dealt = report.dealt + (report.burn?.rival ?? 0);
  flashEmbers(root.querySelector('.player-meter'), taken);
  const rivalMeter = root.querySelector('.rival-rail .meter-wrap');
  flashEmbers(rivalMeter, dealt, burst ? 'burst' : 'hit');
  if (burst && !dealt) floatAt(rivalMeter, 'Blocked', 'burst');
  if (taken) {
    hurtSound();
    if (!result) shake(root.querySelector('.table'));
  }
  if (report.burst) burstSound();
  if (showingFinalHit) {
    setTimeout(() => {
      showingFinalHit = false;
      render();
    }, 300);
  }
}

function act(action) {
  if (showingFinalHit) return;
  if (action === 'cancel') {
    const focus = moltIndex;
    moltIndex = null;
    render(false, focus);
    return;
  }
  if (moltIndex !== null) return;
  if (action === 'start') {
    sound = true;
    game = newGame(seed ?? Math.floor(Math.random() * 2 ** 32));
    render(true);
  }
  if (action === 'end' && game && !game.result) {
    endTurn(game);
    glassSound();
    showExchange(true);
  }
  if (action === 'burst' && game && wieldBurst(game)) showExchange(false, true);
}

function useCard(index) {
  if (!game || game.result) return;
  const card = game.player.hand[index];
  if (!card) return;
  if (moltIndex === null && card.effect.molt && canPlay(game.player, card)) {
    moltIndex = index;
    render(false, 0);
    return;
  }
  const playedIndex = moltIndex ?? index;
  const bounds = root.querySelector(`[data-card="${playedIndex}"]`)?.getBoundingClientRect();
  if (playCard(game, playedIndex, moltIndex === null ? undefined : index)) {
    moltIndex = null;
    const suit = game.player.played.at(-1)?.suit;
    if (suit === 'Wax') tone(660, 0.12, 'sine', 0.03);
    else if (suit === 'Moth') tone(420, 0.09, 'triangle', 0.025);
    else dealSound(index);
    render(false, index);
    if (!shot) snapCard(bounds, root.querySelector(`[data-slot="${game.player.played.length - 1}"]`));
  }
}

root.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button?.dataset.action) act(button.dataset.action);
  if (button?.dataset.card !== undefined) useCard(Number(button.dataset.card));
});

document.addEventListener('keydown', event => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
  if (paintedScene === 'table' && /^[1-9]$/.test(event.key) && Number(event.key) <= HAND_SIZE) useCard(Number(event.key) - 1);
  if (moltIndex !== null) {
    if (event.key === 'Escape') {
      event.preventDefault();
      act('cancel');
    }
    return;
  }
  if (event.key === ' ' && paintedScene === 'table') {
    event.preventDefault();
    act('burst');
  }
  if (event.key === 'Enter' && !event.target.closest('summary')) {
    event.preventDefault();
    act(paintedScene === 'table' ? 'end' : 'start');
  }
});

window.addEventListener('resize', repaint);
render(true);

})();
