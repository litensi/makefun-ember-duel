import { deck } from './cards.js';

export const MAX_EMBERS = 12;
export const HAND_SIZE = 5;
export const BASE_WICK = 3;
export const PLAY_LIMIT = 3;
export const FLARE_COST = 3;
export const BURST_DAMAGE = 6;

export function randomFrom(seed) {
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

export function newDuelist(random) {
  const side = {
    embers: MAX_EMBERS, wick: BASE_WICK, flare: 0, discount: 0,
    deck: shuffle(deck(), random), hand: [], discard: [], played: [],
    status: { burn: 0, burnTurns: 0, shroud: 0, smoke: 0, molt: false },
  };
  for (let index = 0; index < HAND_SIZE; index++) draw(side, random);
  return side;
}

export function costOf(side, card) {
  return Math.max(0, card.cost - side.discount);
}

export function canPlay(side, card) {
  return side.played.length < PLAY_LIMIT && costOf(side, card) <= side.wick
    && (!card.effect.molt || side.hand.length > 1 && !side.status.molt);
}

function comboCount(played, suit) {
  return played.filter(card => card.suit === suit).length;
}

export function totals(played, status = { shroud: 0 }) {
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

export function attackOf(stats, status) {
  return Math.max(0, stats.attack - status.smoke);
}

export function absorbHit(side, amount) {
  if (amount > 0 && side.status.molt) {
    side.status.molt = false;
    return 0;
  }
  const damage = Math.min(side.embers, amount);
  side.embers -= damage;
  return damage;
}

export function play(side, foe, index, random, discardIndex) {
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

export function unleash(side, foe) {
  if (side.flare < FLARE_COST) return false;
  side.flare = 0;
  return absorbHit(foe, BURST_DAMAGE);
}

export function resetTurn(side, random) {
  side.discard.push(...side.played.splice(0));
  side.discount = 0;
  side.wick = BASE_WICK;
  while (side.hand.length < HAND_SIZE && (side.deck.length || side.discard.length)) draw(side, random);
}

export function tickStatus(side) {
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

export function finish(game) {
  if (!game.player.embers || !game.rival.embers) {
    game.result = game.player.embers ? 'win' : 'loss';
  }
}

export function playCard(game, index, discardIndex) {
  if (game.result || !play(game.player, game.rival, index, game.random, discardIndex)) return false;
  const { lanterns, moths } = totals(game.player.played);
  game.bestChain = Math.max(game.bestChain, lanterns, moths);
  return true;
}

export function wieldBurst(game) {
  if (game.result) return false;
  const dealt = unleash(game.player, game.rival);
  if (dealt === false) return false;
  finish(game);
  game.report = { dealt, taken: 0, burst: true };
  return true;
}
