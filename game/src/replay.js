import { choosePlan, endTurn, newGame, playCard, totals } from './rules.js';

export function replay(seed, scene) {
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
