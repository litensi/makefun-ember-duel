import { playCard, wieldBurst } from './duel.js';
import { endTurn, newGame } from './match.js';

function take(side, name) {
  const card = [side.hand, side.deck, side.discard, side.played]
    .flat().find(card => card.name === name);
  if (!card) return undefined;
  for (const pile of [side.hand, side.deck, side.discard, side.played]) {
    const index = pile.indexOf(card);
    if (index !== -1) pile.splice(index, 1);
  }
  side.hand.push(card);
  return card;
}

function ended(seed, moves) {
  const game = newGame(seed);
  for (const move of moves) {
    if (move === 'end') endTurn(game);
    else if (move === 'burst') wieldBurst(game);
    else {
      const [name, discard] = move;
      playCard(game, game.player.hand.findIndex(card => card.name === name),
        game.player.hand.findIndex(card => card.name === discard));
    }
  }
  return game;
}

const tableMoves = [
  ['Roof Draft'], ['Pale Silkmoth'], ['Cricket Lamp'], 'end',
  ['Saffron Torch'], ['Velvet Wing'], 'end',
  ['Last Beacon'],
];

const winMoves = [
  ['Ash Cloak'], ['Paper Wings'], ['Foxfire'], 'end',
  ['Moon Mantle'], ['Cricket Lamp'], ['Foxfire'], 'end',
  ['Pale Silkmoth'], ['Bell Gust'], ['Saffron Torch'], 'end',
  ['Moon Mantle'], ['Velvet Wing'], ['Last Beacon'], 'burst', 'end',
  ['Kindle'], ['Foxfire'], ['Saffron Torch'], 'end',
];

const lossMoves = ['end', 'end', 'end', 'end', 'end', 'end', 'end', 'end', 'end'];

function stagedTable(seed) {
  const game = ended(seed ^ 2052212128, tableMoves);
  game.result = null;
  game.round = 7;
  game.player.embers = 7;
  game.rival.embers = 6;
  game.player.flare = 3;
  game.rival.flare = 2;
  game.player.wick = 2;
  game.player.status.shroud = 1;
  game.rival.status.burn = 2;
  game.rival.status.burnTurns = 2;
  game.player.discard.push(...game.player.hand);
  game.player.hand = [];
  game.player.played = [];
  for (const name of ['Cricket Lamp', 'Saffron Torch']) game.player.played.push(take(game.player, name));
  game.player.played = game.player.played.filter(Boolean);
  game.player.hand = game.player.hand.filter(card => !game.player.played.includes(card));
  for (const name of ['Last Beacon', 'Moon Mantle', 'Honey Seal', 'Kindle', 'Molt']) take(game.player, name);
  game.warden.name = 'Veil Keeper';
  game.warden.tell = 'wings raised';
  game.plan = [take(game.rival, 'Last Beacon'), take(game.rival, 'Paper Wings')].filter(Boolean);
  game.rival.hand = game.rival.hand.filter(card => !game.plan.includes(card));
  while (game.rival.hand.length < 5 && game.rival.deck.length) game.rival.hand.push(game.rival.deck.pop());
  game.report = { dealt: 3, taken: 2, burn: { rival: 2 } };
  game.float = { rival: 3 };
  return game;
}

export function replay(seed, scene) {
  if (scene === 'table') return stagedTable(seed || 7);
  const game = ended((seed || 7) ^ 991, scene === 'win' ? winMoves : lossMoves);
  if (scene === 'win') {
    game.result = 'win';
    game.rival.embers = 0;
    game.player.embers = 4;
  } else {
    game.result = 'loss';
    game.player.embers = 0;
    game.rival.embers = 5;
  }
  game.round = 8;
  return game;
}
