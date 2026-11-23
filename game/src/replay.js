import { playCard, wieldBurst } from './duel.js';
import { endTurn, newGame } from './match.js';

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

export function replay(seed, scene) {
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
