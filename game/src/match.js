import {
  BURST_DAMAGE, FLARE_COST, absorbHit, attackOf, finish, newDuelist,
  play, randomFrom, resetTurn, tickStatus, totals, unleash,
} from './duel.js';
import { choosePlan, chooseWarden, intentOf } from './rival.js';

function prepareTurn(game) {
  resetTurn(game.player, game.random);
  resetTurn(game.rival, game.random);
  game.plan = choosePlan(game.rival, game.warden.weights, game.player);
  const flare = game.rival.flare;
  game.rivalBurst = flare >= FLARE_COST
    && (game.player.embers <= BURST_DAMAGE + 2 || game.random() < 0.35);
}

export function newGame(seed) {
  const random = randomFrom(seed);
  const game = {
    random, warden: chooseWarden(random), round: 1, bestChain: 0, result: null, report: null,
    player: newDuelist(random), rival: newDuelist(random),
  };
  prepareTurn(game);
  return game;
}

function resolveRound(game) {
  const { player, rival } = game;
  for (const card of game.plan) {
    const spare = card.effect.molt ? rival.hand.findIndex(candidate => !game.plan.includes(candidate)) : undefined;
    play(rival, player, rival.hand.indexOf(card), game.random, spare);
  }
  const your = totals(player.played, player.status);
  const their = totals(rival.played, rival.status);
  const yourAttack = attackOf(your, player.status);
  const theirAttack = attackOf(their, rival.status);
  if (your.attack > 0) player.status.smoke = 0;
  if (their.attack > 0) rival.status.smoke = 0;

  const burst = game.rivalBurst ? unleash(rival, player) : false;
  const taken = (burst || 0) + absorbHit(player, Math.max(0, theirAttack - your.guard));
  const dealt = absorbHit(rival, Math.max(0, yourAttack - their.guard));
  game.report = { dealt, taken, burst: burst !== false };
  finish(game);
  if (game.result) return;

  const playerBurned = tickStatus(player);
  const rivalBurned = tickStatus(rival);
  if (playerBurned || rivalBurned) game.report.burn = { player: playerBurned, rival: rivalBurned };
  finish(game);
}

export function previewRound(game) {
  const copy = structuredClone({ player: game.player, rival: game.rival, plan: game.plan });
  // Draws cannot change committed plays or damage. Use a local RNG for any reshuffle.
  const preview = { ...copy, random: randomFrom(1), rivalBurst: game.rivalBurst };
  resolveRound(preview);
  return {
    intent: intentOf(game),
    dealt: preview.report.dealt + (preview.report.burn?.rival || 0),
    taken: preview.report.taken + (preview.report.burn?.player || 0),
    rivalAfter: preview.rival.embers,
    playerAfter: preview.player.embers,
  };
}

export function endTurn(game) {
  if (game.result) return;
  resolveRound(game);
  if (game.result) return;
  game.round++;
  prepareTurn(game);
}
