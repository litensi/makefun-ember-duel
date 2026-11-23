import { endTurn, newGame, playCard } from './rules.js';
import { replay } from './replay.js';
import { paintFestival } from './art.js';
import { feature, table } from './view.js';

const root = document.querySelector('#game');
const canvas = document.querySelector('#festival');
const query = new URLSearchParams(location.search);
const seed = query.has('seed') ? Number(query.get('seed')) : Math.floor(Math.random() * 2 ** 32);
const shot = query.get('shot');
let game = ['table', 'win', 'loss'].includes(shot) ? replay(seed, shot) : null;
let paintedScene;

function repaint() {
  paintFestival(canvas, paintedScene, paintedScene === 'win');
}

function render(deal = false, focus = null) {
  const scene = game ? game.result || 'table' : 'title';
  if (scene !== paintedScene) {
    paintedScene = scene;
    repaint();
  }
  root.dataset.scene = scene;
  root.classList.toggle('deal', deal && !shot);
  root.classList.toggle('celebrate', scene === 'win' && !shot);
  root.innerHTML = scene === 'table' ? table(game) : feature(scene, game);
  if (focus !== null && scene === 'table') {
    const target = [...root.querySelectorAll('.card:not(:disabled)')].find(button => Number(button.dataset.card) >= focus);
    (target || root.querySelector('[data-action="end"]')).focus({ preventScroll: true });
  } else if (deal && !shot) {
    root.querySelector('[data-action]')?.focus({ preventScroll: true });
  }
}

function act(action) {
  if (action === 'start') game = newGame(query.has('seed') ? seed : Math.floor(Math.random() * 2 ** 32));
  if (action === 'end') endTurn(game);
  render(true);
}

function useCard(index) {
  if (playCard(game, index)) render(false, index);
}

root.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button?.dataset.action) act(button.dataset.action);
  if (button?.dataset.card !== undefined) useCard(Number(button.dataset.card));
});

document.addEventListener('keydown', event => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
  if (paintedScene === 'table' && /^[1-5]$/.test(event.key)) {
    useCard(Number(event.key) - 1);
  }
  if (event.key === 'Enter' && !event.target.closest('summary')) {
    event.preventDefault();
    act(paintedScene === 'table' ? 'end' : 'start');
  }
});

window.addEventListener('resize', repaint);
render(true);
