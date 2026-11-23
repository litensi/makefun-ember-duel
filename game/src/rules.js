export const suits = {
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

export function randomFrom(seed) {
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

export function totals(played) {
  const stat = (suit) => {
    const matching = played.filter(card => card.suit === suit);
    return matching.reduce((sum, card) => sum + card.value, 0) + (matching.length >= 2 ? 2 : 0);
  };
  return { attack: stat('Lantern'), guard: stat('Moth') };
}

export function exchange(your, their) {
  return {
    dealt: Math.max(0, your.attack - their.guard),
    taken: Math.max(0, their.attack - your.guard),
  };
}

export function costOf(side, card) {
  return Math.max(0, card.cost - side.discount);
}

export function canPlay(side, card) {
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

export function choosePlan(side, score) {
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

export function newGame(seed) {
  const random = randomFrom(seed);
  const game = { random, player: duelist(random), rival: duelist(random), round: 1, result: null, report: null };
  prepareTurn(game);
  return game;
}

export function playCard(game, index) {
  return !game.result && play(game.player, index, game.random);
}

export function endTurn(game) {
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
