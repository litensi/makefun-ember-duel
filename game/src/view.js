import { canPlay, costOf, exchange, suits, totals } from './rules.js';

function suitIcon(suit) {
  return `<span class="suit-icon ${suit.toLowerCase()}" aria-hidden="true">${suits[suit].icon}</span>`;
}

export function feature(scene, game) {
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

export function table(game) {
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
