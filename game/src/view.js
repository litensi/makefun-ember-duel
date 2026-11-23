import { suits, cardText } from './cards.js';
import { attackOf, BASE_WICK, BURST_DAMAGE, canPlay, costOf, totals, FLARE_COST, HAND_SIZE, MAX_EMBERS, PLAY_LIMIT } from './duel.js';
import { previewRound } from './match.js';
import { describe } from './rival.js';

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

export function feature(scene, game) {
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
      <p class="eyebrow">${title ? 'A DUEL AT DUSK' : `DUEL COMPLETE · ROUND ${game.round}`}</p>
      <h1>${name}</h1>
      <p class="feature-copy">${copy}</p>
      ${title ? '' : `<div class="result-score"><span>You <b>${game.player.embers}</b></span><span>Rival <b>${game.rival.embers}</b></span></div>`}
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

export function table(game, moltIndex = null) {
  const { player, rival, report, warden } = game;
  const stats = totals(player.played, player.status);
  const forecast = previewRound(game);
  const { intent } = forecast;
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
        <div class="meter-wrap">${meter(rival, 'Rival embers', 'rival')}${game.float ? `<span class="float hit">-${game.float.rival}</span>` : ''}</div>
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
            return card ? `<div class="slot filled ${card.suit.toLowerCase()}" title="${card.name}">${suitIcon(card.suit)} <b>${card.value}</b></div>`
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
            title="${cardText(card)}" style="--deal: ${index * 45}ms">${cardFace(card, costOf(player, card), index + 1)}</button>`).join('')}</div>
      </div>
      <aside class="controls">
        <div class="meter-wrap player-meter">${meter(player, 'Your embers')}</div>
        <div class="report" aria-live="polite">${report ? `Last exchange<br><strong>${report.dealt} dealt · ${report.taken} taken</strong>${report.burn ? `<br><small>${report.burn.rival ? `Burn ${report.burn.rival} on rival` : ''}${report.burn.rival && report.burn.player ? ' · ' : ''}${report.burn.player ? `Burn ${report.burn.player} on you` : ''}</small>` : ''}${report.burst ? '<br><small>Beacon Burst!</small>' : ''}` : ''}</div>
        <div class="forecast" aria-live="polite"><span>DAMAGE PREVIEW</span>
          <div><span>Rival · ${forecast.rivalAfter} left</span><b>−${forecast.dealt}</b></div>
          <div><span>You · ${forecast.playerAfter} left</span><b>−${forecast.taken}</b></div>
        </div>
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
