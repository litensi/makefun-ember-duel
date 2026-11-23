import { endTurn, newGame } from './match.js';
import { canPlay, HAND_SIZE, playCard, wieldBurst } from './duel.js';
import { replay } from './replay.js';
import { paintFestival } from './art.js';
import { feature, table } from './view.js';
import { burstSound, dealSound, flashEmbers, floatAt, glassSound, hurtSound, shake, snapCard, tone, victorySound } from './effects.js';

const root = document.querySelector('#game');
const canvas = document.querySelector('#festival');
const query = new URLSearchParams(location.search);
const seed = query.has('seed') ? Number(query.get('seed')) : null;
const shot = query.get('shot');
let game = ['table', 'win', 'loss'].includes(shot) ? replay(seed ?? 1, shot) : null;
let paintedScene;
let sound = !shot;
let moltIndex = null;
let showingFinalHit = false;

function repaint() {
  paintFestival(canvas, paintedScene, paintedScene === 'win');
}

function render(deal = false, focus = null) {
  const scene = game ? (showingFinalHit ? 'table' : game.result || 'table') : 'title';
  const changed = scene !== paintedScene;
  paintedScene = scene;
  if (changed) repaint();
  root.dataset.scene = scene;
  root.classList.toggle('deal', deal && !shot);
  root.classList.toggle('celebrate', scene === 'win' && !shot);
  root.classList.toggle('still', Boolean(shot));
  root.innerHTML = scene === 'table' ? table(game, moltIndex) : feature(scene, game);
  root.inert = showingFinalHit;
  if (changed && sound && scene === 'win') victorySound();
  if (changed && sound && scene === 'loss') tone(120, 0.8, 'sine', 0.05);
  if (focus !== null && scene === 'table') {
    const target = [...root.querySelectorAll('.card:not(:disabled)')].find(button => Number(button.dataset.card) >= focus);
    (target || root.querySelector('[data-action="end"]')).focus({ preventScroll: true });
  } else if ((deal || game?.result) && !shot) {
    (root.querySelector('[data-action="end"]') || root.querySelector('[data-action]'))?.focus({ preventScroll: true });
  }
}

function showExchange(deal, burst = false) {
  const { report, result } = game;
  showingFinalHit = Boolean(result && !shot);
  render(deal && !result);
  const taken = report.taken + (report.burn?.player ?? 0);
  const dealt = report.dealt + (report.burn?.rival ?? 0);
  flashEmbers(root.querySelector('.player-meter'), taken);
  const rivalMeter = root.querySelector('.rival-rail .meter-wrap');
  flashEmbers(rivalMeter, dealt, burst ? 'burst' : 'hit');
  if (burst && !dealt) floatAt(rivalMeter, 'Blocked', 'burst');
  if (taken) {
    hurtSound();
    if (!result) shake(root.querySelector('.table'));
  }
  if (report.burst) burstSound();
  if (showingFinalHit) {
    setTimeout(() => {
      showingFinalHit = false;
      render();
    }, 300);
  }
}

function act(action) {
  if (showingFinalHit) return;
  if (action === 'cancel') {
    const focus = moltIndex;
    moltIndex = null;
    render(false, focus);
    return;
  }
  if (moltIndex !== null) return;
  if (action === 'start') {
    sound = true;
    game = newGame(seed ?? Math.floor(Math.random() * 2 ** 32));
    render(true);
  }
  if (action === 'end' && game && !game.result) {
    endTurn(game);
    glassSound();
    showExchange(true);
  }
  if (action === 'burst' && game && wieldBurst(game)) showExchange(false, true);
}

function useCard(index) {
  if (!game || game.result) return;
  const card = game.player.hand[index];
  if (!card) return;
  if (moltIndex === null && card.effect.molt && canPlay(game.player, card)) {
    moltIndex = index;
    render(false, 0);
    return;
  }
  const playedIndex = moltIndex ?? index;
  const bounds = root.querySelector(`[data-card="${playedIndex}"]`)?.getBoundingClientRect();
  if (playCard(game, playedIndex, moltIndex === null ? undefined : index)) {
    moltIndex = null;
    const suit = game.player.played.at(-1)?.suit;
    if (suit === 'Wax') tone(660, 0.12, 'sine', 0.03);
    else if (suit === 'Moth') tone(420, 0.09, 'triangle', 0.025);
    else dealSound(index);
    render(false, index);
    if (!shot) snapCard(bounds, root.querySelector(`[data-slot="${game.player.played.length - 1}"]`));
  }
}

root.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button?.dataset.action) act(button.dataset.action);
  if (button?.dataset.card !== undefined) useCard(Number(button.dataset.card));
});

document.addEventListener('keydown', event => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
  if (paintedScene === 'table' && /^[1-9]$/.test(event.key) && Number(event.key) <= HAND_SIZE) useCard(Number(event.key) - 1);
  if (moltIndex !== null) {
    if (event.key === 'Escape') {
      event.preventDefault();
      act('cancel');
    }
    return;
  }
  if (event.key === ' ' && paintedScene === 'table') {
    event.preventDefault();
    act('burst');
  }
  if (event.key === 'Enter' && !event.target.closest('summary')) {
    event.preventDefault();
    act(paintedScene === 'table' ? 'end' : 'start');
  }
});

window.addEventListener('resize', repaint);
render(true);
