import { playCard, wieldBurst } from './duel.js';
import { endTurn, newGame } from './match.js';

const walkthroughs = {
  table: {
    // This deal leaves Molt and a heal in hand with one play remaining.
    salt: 2052212128,
    moves: [
      ['Pale Silkmoth'], ['Bell Gust'], ['Saffron Torch'], 'end',
      ['Cricket Lamp'], ['Foxfire'],
    ],
  },
  win: {
    salt: 0,
    moves: [
      ['Ash Cloak'], ['Roof Draft'], ['Foxfire'], 'burst', 'end',
      ['Molt', 'Amber Salve'], ['Velvet Wing'], ['Pale Silkmoth'], 'burst',
    ],
  },
  loss: { salt: 0, moves: ['end', 'end'] },
};

function runWalkthrough(seed, { salt, moves }) {
  const game = newGame((seed ^ salt) >>> 0);
  for (const move of moves) {
    if (move === 'end') endTurn(game);
    else if (move === 'burst') wieldBurst(game);
    else {
      const [name, discard] = move;
      const index = game.player.hand.findIndex(card => card.name === name);
      const discardIndex = game.player.hand.findIndex(card => card.name === discard);
      playCard(game, index, discardIndex);
    }
  }
  return game;
}

export function replay(seed, scene) {
  const script = walkthroughs[scene];
  const game = runWalkthrough(seed, script);
  const reachedScene = scene === 'table'
    ? !game.result && game.player.played.length === 2 && game.player.played.every(card => card.suit === 'Lantern')
    : game.result === scene;
  return reachedScene ? game : runWalkthrough(1, script);
}
