import { attackOf, MAX_EMBERS, PLAY_LIMIT, totals } from './duel.js';

const wardens = [
  { name: 'Ash Warden', tell: 'gathering ash', weights: { attack: 1.6, guard: 0.45, heal: 0.7, burn: 1.5, chill: 0.7, draw: 0.4, shroud: 0.5 } },
  { name: 'Veil Keeper', tell: 'wings raised', weights: { attack: 0.85, guard: 1.7, heal: 1.25, burn: 0.8, chill: 1.0, draw: 0.6, shroud: 1.5 } },
  { name: 'Gale Trickster', tell: 'reading the wind', weights: { attack: 1.1, guard: 0.7, heal: 0.75, burn: 1.0, chill: 1.7, draw: 1.3, shroud: 0.8 } },
];

export function chooseWarden(random) {
  return wardens[Math.floor(random() * wardens.length)];
}

function gain(cards, key) {
  return cards.reduce((total, card) => total + (card.effect[key] || 0), 0);
}

export function scorePlan(cards, weights, player, rival) {
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

export function choosePlan(rival, weights, player) {
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

export function intentOf(game) {
  const stats = totals(game.plan, game.rival.status);
  return { attack: attackOf(stats, game.rival.status), guard: stats.guard + gain(game.plan, 'shroud') };
}

export function describe(warden) {
  return `${warden.name} · ${warden.tell}`;
}
