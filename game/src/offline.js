// Direct-file entry assembled from the ES modules in this directory.
(() => {
"use strict";
const suits = {
  Lantern: { icon: '◆', action: 'Attack' },
  Moth: { icon: '✦', action: 'Guard' },
  Wind: { icon: '≈' },
  Wax: { icon: '●', action: 'Heal & discount' },
};

const cards = [
  ['Foxfire', 'Lantern', 1, 2], ['Cricket Lamp', 'Lantern', 1, 2],
  ['Saffron Torch', 'Lantern', 2, 4], ['Copper Halo', 'Lantern', 2, 4],
  ['Last Beacon', 'Lantern', 3, 6], ['Pale Silkmoth', 'Moth', 1, 2],
  ['Velvet Wing', 'Moth', 1, 2], ['Ash Cloak', 'Moth', 2, 4],
  ['Moon Mantle', 'Moth', 2, 5], ['Paper Wings', 'Moth', 1, 3],
  ['Roof Draft', 'Wind', 0, 1, 'Draw'], ['Orchard Air', 'Wind', 0, 1, 'Draw'],
  ['Bell Gust', 'Wind', 0, 1, 'Wick'], ['Kite Current', 'Wind', 0, 1, 'Wick'],
  ['Honey Seal', 'Wax', 1, 2], ['Golden Drip', 'Wax', 1, 2],
].map(([name, suit, cost, value, effect]) => ({ name, suit, cost, value, effect }));

function randomFrom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle(cards, random) {
  for (let index = cards.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [cards[index], cards[other]] = [cards[other], cards[index]];
  }
}

function draw(side, random) {
  if (side.hand.length >= 5) return;
  if (!side.deck.length) {
    side.deck = side.discard.splice(0);
    shuffle(side.deck, random);
  }
  if (side.deck.length) side.hand.push(side.deck.pop());
}

function duelist(random) {
  const side = { embers: 12, deck: [...cards], hand: [], discard: [], played: [] };
  shuffle(side.deck, random);
  return side;
}

function totals(played) {
  const stat = (suit) => {
    const matching = played.filter(card => card.suit === suit);
    return matching.reduce((sum, card) => sum + card.value, 0) + (matching.length >= 2 ? 2 : 0);
  };
  return { attack: stat('Lantern'), guard: stat('Moth') };
}

function exchange(your, their) {
  return {
    dealt: Math.max(0, your.attack - their.guard),
    taken: Math.max(0, their.attack - your.guard),
  };
}

function costOf(side, card) {
  return Math.max(0, card.cost - side.discount);
}

function canPlay(side, card) {
  return side.played.length < 3 && costOf(side, card) <= side.wick;
}

function play(side, index, random) {
  const card = side.hand[index];
  if (!card || !canPlay(side, card)) return false;
  side.wick -= costOf(side, card);
  side.discount = 0;
  side.played.push(...side.hand.splice(index, 1));
  if (card.suit === 'Wax') {
    side.embers = Math.min(12, side.embers + card.value);
    side.discount = 1;
  }
  if (card.effect === 'Draw') draw(side, random);
  if (card.effect === 'Wick') side.wick += card.value;
  return true;
}

function resetTurn(side, random) {
  side.discard.push(...side.played.splice(0));
  side.discount = 0;
  side.wick = 3;
  while (side.hand.length < 5 && (side.deck.length || side.discard.length)) {
    draw(side, random);
  }
}

function plans(side, played = [], available = side.hand, wick = side.wick, discount = 0) {
  const choices = [played];
  if (played.length === 3) return choices;
  for (const card of available) {
    const cost = Math.max(0, card.cost - discount);
    if (cost > wick) continue;
    choices.push(...plans(side, [...played, card], available.filter(other => other !== card),
      wick - cost + (card.effect === 'Wick' ? 1 : 0), card.suit === 'Wax' ? 1 : 0));
  }
  return choices;
}

function choosePlan(side, score) {
  let best = [];
  let bestScore = score(best);
  for (const choice of plans(side)) {
    const value = score(choice);
    if (value > bestScore) {
      bestScore = value;
      best = choice;
    }
  }
  return best;
}

function prepareTurn(game) {
  resetTurn(game.player, game.random);
  resetTurn(game.rival, game.random);
  const { rival } = game;
  const aggressive = game.round % 3 !== 2;
  game.plan = choosePlan(rival, cards => {
    const { attack, guard } = totals(cards);
    const heal = Math.min(12 - rival.embers, cards.filter(card => card.suit === 'Wax').length * 2);
    return attack * (aggressive ? 1.5 : 0.8) + guard * (aggressive ? 0.55 : 1.3)
      + heal * 1.05 - cards.length * 0.1;
  });
  game.intent = totals(game.plan);
}

function newGame(seed) {
  const random = randomFrom(seed);
  const game = { random, player: duelist(random), rival: duelist(random), round: 1, result: null, report: null };
  prepareTurn(game);
  return game;
}

function playCard(game, index) {
  return !game.result && play(game.player, index, game.random);
}

function endTurn(game) {
  if (game.result) return;
  const { player, rival } = game;
  for (const card of game.plan) play(rival, rival.hand.indexOf(card), game.random);
  const damage = exchange(totals(player.played), totals(rival.played));
  const dealt = Math.min(rival.embers, damage.dealt);
  const taken = Math.min(player.embers, damage.taken);
  rival.embers -= dealt;
  player.embers -= taken;
  game.report = { dealt, taken };
  if (!player.embers || !rival.embers) {
    game.result = player.embers ? 'win' : 'loss';
    return;
  }
  game.round++;
  prepareTurn(game);
}

function replay(seed, scene) {
  const game = newGame(seed);
  if (scene === 'table') {
    for (const name of ['Foxfire', 'Pale Silkmoth', 'Paper Wings']) {
      playCard(game, game.player.hand.findIndex(card => card.name === name));
    }
    endTurn(game);
    playCard(game, game.player.hand.findIndex(card => card.name === 'Copper Halo'));
    return game;
  }
  while (!game.result && game.round < 100) {
    if (scene === 'win') {
      const { player, rival, intent } = game;
      const plan = choosePlan(player, cards => {
        const { attack, guard } = totals(cards);
        const dealt = Math.max(0, attack - intent.guard);
        const taken = Math.max(0, intent.attack - guard);
        const heal = Math.min(12 - player.embers, cards.filter(card => card.suit === 'Wax').length * 2);
        return (taken >= player.embers + heal ? -50 : 0) + (dealt >= rival.embers ? 50 : 0)
          + dealt * 1.28 - taken * 1.55 + heal - cards.length * 0.1;
      });
      for (const card of plan) playCard(game, player.hand.indexOf(card));
    }
    endTurn(game);
  }
  return game;
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
  ctx.restore();
}

function lantern(ctx, x, y, size, dimmed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.strokeStyle = '#9a6d63';
  ctx.lineWidth = 1;
  ctx.stroke(new Path2D('M 0 -480 L 0 -24 M 0 24 L 0 43'));
  ctx.fillStyle = dimmed ? '#42425f' : '#eb934f';
  ctx.strokeStyle = dimmed ? '#82829d' : '#ffd58d';
  const shape = new Path2D('M -12 -23 L 12 -23 Q 35 0 12 23 L -12 23 Q -35 0 -12 -23');
  ctx.fill(shape);
  ctx.stroke(shape);
  ctx.stroke(new Path2D('M -6 -23 Q -17 0 -6 23 M 6 -23 Q 17 0 6 23 M -24 0 L 24 0'));
  ctx.restore();
}

function paintFestival(canvas, scene, celebrate = false) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const hero = scene !== 'table';
  const centerX = width * 0.735;
  const centerY = height * 0.49;
  ctx.fillStyle = '#16172b';
  ctx.fillRect(0, 0, width, height);
  const random = randomFrom(717);
  for (let index = 0; index < (hero ? 235 : 120); index++) {
    const x = random() * width;
    const y = random() * height;
    ctx.fillStyle = index % 4 === 0 ? '#b48672' : '#45415a';
    const size = index % 9 === 0 ? 3 : 1;
    ctx.fillRect(x, y, size, size);
  }
  if (!hero) {
    ctx.save();
    ctx.translate(width * .504, height * .49);
    ctx.strokeStyle = '#3f344e';
    for (const radius of [168, 183]) {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.stroke(new Path2D('M 0 -200 V 200 M -200 0 H 200'));
    ctx.restore();
    return;
  }

  const scale = Math.min(width / 1280, height / 720);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.fillStyle = scene === 'loss' ? '#303655' : '#46283b';
  ctx.strokeStyle = '#91615b';
  for (const radius of [175, 191, 223]) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    if (radius === 175) ctx.fill();
    ctx.stroke();
  }
  for (let tick = 0; tick < 72; tick++) {
    ctx.rotate(Math.PI / 36);
    ctx.fillStyle = '#a8766b';
    ctx.fillRect(205, 0, tick % 6 === 0 ? 11 : 4, 1);
  }
  ctx.strokeStyle = '#956362';
  ctx.stroke(new Path2D('M -280 0 H 280 M 0 -251 V 251'));
  ctx.restore();

  const dimmed = scene === 'loss';
  lantern(ctx, width * .557, height * .195, .82 * scale, dimmed);
  lantern(ctx, width * .92, height * .23, scale, dimmed);
  lantern(ctx, width * .877, height * .102, .53 * scale, dimmed);
  moth(ctx, centerX, centerY - 12 * scale, 1.02 * scale, scene === 'loss');
  if (celebrate) {
    for (let index = 0; index < 44; index++) {
      const x = centerX + (random() - .5) * 560 * scale;
      const y = centerY + (random() - .5) * 500 * scale;
      ctx.fillStyle = index % 2 ? '#f6bf73' : '#d28a83';
      ctx.fillRect(x, y, 2 + random() * 4, 2 + random() * 4);
    }
  }
}

function suitIcon(suit) {
  return `<span class="suit-icon ${suit.toLowerCase()}" aria-hidden="true">${suits[suit].icon}</span>`;
}

function feature(scene, game) {
  const title = scene === 'title';
  const won = scene === 'win';
  const name = title ? 'Ember<br>Duel' : won ? 'Festival<br>Victor' : 'Embers<br>Extinguished';
  const copy = title ? 'Read your rival’s intent, play your cards, and keep your lantern alight.'
    : won ? 'Your lantern burns through the night.' : 'Your rival carries the last light of the festival.';
  return `<section class="feature ${scene}">
    <div class="imprint"><span>✦</span> THE MOTH LANTERN FESTIVAL</div>
    <div class="feature-content">
      <p class="eyebrow">${title ? 'A DUEL AT DUSK' : `DUEL COMPLETE · ROUND ${game.round}`}</p>
      <h1>${name}</h1>
      <p class="feature-copy">${copy}</p>
      ${title ? '' : `<div class="result-score"><span>You <b>${game.player.embers}</b></span><span>Rival <b>${game.rival.embers}</b></span></div>`}
      <button class="primary" data-action="start">${title ? 'Start duel' : 'Duel again'} <span>→</span></button>
      <div class="feature-key"><kbd>Enter</kbd> to ${title ? 'start' : 'restart'}</div>
    </div>
  </section>
  ${won ? `<div class="sparks" aria-hidden="true">${Array.from({ length: 17 }, (_, index) => {
    const angle = index * 2.4;
    const radius = 110 + (index % 6) * 26;
    return `<i style="--x:${Math.cos(angle) * radius}px;--y:${Math.sin(angle) * radius}px;--delay:${index * 22}ms"></i>`;
  }).join('')}</div>` : ''}
  <div class="plate-label" aria-hidden="true"><span></span> ${scene === 'loss' ? 'THE LANTERN GOES DARK' : 'THE MOTH AND THE FLAME'} <span></span></div>`;
}

function cardFace(card, cost, shortcut = '') {
  const effect = card.effect === 'Wick' ? '+1 Wick' : card.effect === 'Draw' ? 'Draw 1' : suits[card.suit].action;
  return `<span class="card-top"><span>${card.suit}</span><span class="cost" title="Wick cost">${cost}</span></span>
    <span class="card-art">${suitIcon(card.suit)}<strong>${card.value}</strong></span>
    <span class="card-name">${card.name}</span>
    <span class="card-effect">${effect}${shortcut && `<kbd>${shortcut}</kbd>`}</span>`;
}

function meter(side, label) {
  return `<div class="health"><div><span>${label}</span><strong>${side.embers}<small> / 12</small></strong></div>
    <div class="health-track" aria-hidden="true">${Array.from({ length: 12 }, (_, index) =>
      `<i class="${index < side.embers ? 'lit' : ''}"></i>`).join('')}</div></div>`;
}

function table(game) {
  const { player, rival, intent, report } = game;
  const stats = totals(player.played);
  const forecast = exchange(stats, intent);
  const combo = ['Lantern', 'Moth'].flatMap((suit, index) =>
    player.played.filter(card => card.suit === suit).length >= 2 ? [index ? 'Veil +2' : 'Ignite +2'] : []);
  return `<section class="table">
    <header class="table-header"><div class="wordmark"><span>✦</span> Ember Duel</div><span class="round">ROUND ${String(game.round).padStart(2, '0')}</span>
      <details><summary>How to play</summary><p>Spend 3 Wick on up to 3 cards. Lantern attack above opposing Moth guard burns Embers. Two Lanterns trigger Ignite (+2 attack). Two Moths trigger Veil (+2 guard). Wind draws or gives 1 Wick. Wax heals 2 and discounts your next card this turn by 1. Hands refill each round.</p></details></header>
    <div class="arena">
      <aside class="rail">
        ${meter(rival, 'Rival embers')}
        <section class="intent"><h2>Rival intent</h2><div>${suitIcon('Lantern')} <span>Attack</span><b>${intent.attack}</b></div>
          <div>${suitIcon('Moth')} <span>Guard</span><b>${intent.guard}</b></div></section>
        ${meter(player, 'Your embers')}
      </aside>
      <div class="field">
        <div class="rival-hand" aria-label="Rival hand, ${rival.hand.length} cards">
          <span class="hand-caption" aria-hidden="true">RIVAL HAND</span>
          ${rival.hand.map(() => '<span class="back" aria-hidden="true">✦</span>').join('')}
        </div>
        <div class="play-zone">
          <div class="zone-label">YOUR PLAYED CARDS <span>${player.played.length} / 3</span></div>
          <div class="slots">${Array.from({ length: 3 }, (_, index) => {
            const card = player.played[index];
            return card ? `<div class="slot filled ${card.suit.toLowerCase()}" title="${card.name}">${suitIcon(card.suit)} <b>${card.value}</b></div>`
              : '<div class="slot" aria-hidden="true">◇</div>';
          }).join('')}</div>
          <div class="combat" aria-live="polite">${suitIcon('Lantern')} ${stats.attack} attack <span>·</span> ${suitIcon('Moth')} ${stats.guard} guard
          ${combo.map(text => `<span class="combo">${text}</span>`).join('')}</div>
        </div>
        <div class="hand" aria-label="Your hand">${player.hand.map((card, index) =>
          `<button class="card ${card.suit.toLowerCase()}" data-card="${index}" ${canPlay(player, card) ? '' : 'disabled'}
            aria-label="${card.name}, ${card.suit}, value ${card.value}, costs ${costOf(player, card)} Wick${card.effect ? `, ${card.effect}` : ''}"
            style="--deal: ${index * 45}ms">${cardFace(card, costOf(player, card), index + 1)}</button>`).join('')}</div>
      </div>
      <aside class="controls">
        <div class="report" aria-live="polite">${report ? `Last exchange<br><strong>${report.dealt} dealt · ${report.taken} taken</strong>` : ''}</div>
        <div class="forecast" aria-live="polite"><span>IF YOU END NOW</span>
          <div><span>Rival loses</span><b>${forecast.dealt}</b></div>
          <div><span>You lose</span><b>${forecast.taken}</b></div>
        </div>
        <div class="wick"><span>AVAILABLE WICK</span><div aria-label="${player.wick} Wick">${Array.from({ length: Math.max(3, player.wick) }, (_, index) =>
          `<i class="${index < player.wick ? 'lit' : ''}"></i>`).join('')}</div><strong>${player.wick}</strong>
          ${player.discount ? '<small>Next card costs 1 less</small>' : ''}</div>
        <button class="primary" data-action="end">End turn <span>→</span></button>
        <div class="table-key"><kbd>1</kbd>–<kbd>5</kbd> play <kbd>Enter</kbd> end</div>
      </aside>
    </div>
  </section>`;
}

const root = document.querySelector('#game');
const canvas = document.querySelector('#festival');
const query = new URLSearchParams(location.search);
const seed = query.has('seed') ? Number(query.get('seed')) : Math.floor(Math.random() * 2 ** 32);
const shot = query.get('shot');
let game = ['table', 'win', 'loss'].includes(shot) ? replay(seed, shot) : null;
let paintedScene;

function repaint() {
  paintFestival(canvas, paintedScene, paintedScene === 'win');
}

function render(deal = false, focus = null) {
  const scene = game ? game.result || 'table' : 'title';
  if (scene !== paintedScene) {
    paintedScene = scene;
    repaint();
  }
  root.dataset.scene = scene;
  root.classList.toggle('deal', deal && !shot);
  root.classList.toggle('celebrate', scene === 'win' && !shot);
  root.innerHTML = scene === 'table' ? table(game) : feature(scene, game);
  if (focus !== null && scene === 'table') {
    const target = [...root.querySelectorAll('.card:not(:disabled)')].find(button => Number(button.dataset.card) >= focus);
    (target || root.querySelector('[data-action="end"]')).focus({ preventScroll: true });
  } else if (deal && !shot) {
    root.querySelector('[data-action]')?.focus({ preventScroll: true });
  }
}

function act(action) {
  if (action === 'start') game = newGame(query.has('seed') ? seed : Math.floor(Math.random() * 2 ** 32));
  if (action === 'end') endTurn(game);
  render(true);
}

function useCard(index) {
  if (playCard(game, index)) render(false, index);
}

root.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button?.dataset.action) act(button.dataset.action);
  if (button?.dataset.card !== undefined) useCard(Number(button.dataset.card));
});

document.addEventListener('keydown', event => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
  if (paintedScene === 'table' && /^[1-5]$/.test(event.key)) {
    useCard(Number(event.key) - 1);
  }
  if (event.key === 'Enter' && !event.target.closest('summary')) {
    event.preventDefault();
    act(paintedScene === 'table' ? 'end' : 'start');
  }
});

window.addEventListener('resize', repaint);
render(true);
})();
