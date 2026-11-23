let audio;

function context() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  return audio;
}

export function tone(frequency, duration = 0.08, type = 'triangle', volume = 0.035) {
  try {
    const ctx = context();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export function dealSound(index) {
  tone(190 + index * 24, 0.07, 'sine', 0.025);
}

export function glassSound() {
  tone(520, 0.16, 'triangle', 0.04);
  tone(780, 0.2, 'sine', 0.02);
}

export function hurtSound() {
  tone(96, 0.28, 'sawtooth', 0.05);
}

export function burstSound() {
  tone(300, 0.5, 'sawtooth', 0.06);
  tone(620, 0.6, 'triangle', 0.04);
}

export function victorySound() {
  [392, 494, 587, 784].forEach((note, index) => {
    setTimeout(() => tone(note, 0.5, 'triangle', 0.05), index * 150);
  });
}

export function floatAt(anchor, text, kind = '') {
  if (!anchor) return;
  const node = document.createElement('span');
  node.className = `float ${kind}`;
  node.textContent = text;
  anchor.append(node);
  setTimeout(() => node.remove(), 1200);
}

export function shake(node) {
  node.classList.remove('shake');
  void node.offsetWidth;
  node.classList.add('shake');
  setTimeout(() => node.classList.remove('shake'), 420);
}

export function flashEmbers(meter, damage, kind = 'hit') {
  if (!meter || !damage) return;
  meter.classList.add('damaged');
  floatAt(meter, `−${damage}`, kind);
}

export function snapCard(bounds, slot) {
  if (!bounds || !slot || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const landing = slot.getBoundingClientRect();
  const x = bounds.left + (bounds.width - landing.width) / 2 - landing.left;
  const y = bounds.top + (bounds.height - landing.height) / 2 - landing.top;
  slot.animate([
    { transform: `translate(${x}px, ${y}px) scale(1.18) rotate(-5deg)`, opacity: .65 },
    { transform: 'scale(.92)', opacity: 1, offset: .78 },
    { transform: 'scale(1)', opacity: 1 },
  ], { duration: 245, easing: 'cubic-bezier(.25,.7,.4,1)' });
}
