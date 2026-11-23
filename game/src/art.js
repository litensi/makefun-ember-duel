import { randomFrom } from './duel.js';

function starfield(ctx, width, height, count, warm) {
  const random = randomFrom(9173);
  for (let index = 0; index < count; index++) {
    const x = random() * width;
    const y = random() * height;
    ctx.globalAlpha = 0.25 + random() * 0.6;
    ctx.fillStyle = index % 5 === 0 ? warm : '#575070';
    const size = index % 17 === 0 ? 3 : index % 7 === 0 ? 2 : 1;
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;
}

function moon(ctx, x, y, radius, dim) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = dim ? '#383d5b' : '#594154';
  for (const offset of [8, 22]) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + offset, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = dim ? '#8e93b5' : '#f4d3a1';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = dim ? '#7b81a4' : '#e9bd88';
  for (const [ox, oy, size] of [[-8, -6, 9], [10, 8, 6], [5, -14, 4]]) {
    ctx.beginPath();
    ctx.arc(ox, oy, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function reed(ctx, x, y, height, lean, colour) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * 0.4, y - height * 0.6, x + lean, y - height);
  ctx.stroke();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(x + lean, y - height, 3, 9, lean * 0.01, 0, Math.PI * 2);
  ctx.fill();
}

function moth(ctx, x, y, scale, muted) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const wings = [
    'M 0 18 C -54 -113 -183 -141 -249 -103 C -262 -37 -176 67 -21 57 Z',
    'M -12 39 C -91 4 -206 49 -193 110 C -170 182 -60 143 -7 59 Z',
  ];
  for (const direction of [-1, 1]) {
    ctx.save();
    ctx.scale(direction, 1);
    for (const [index, path] of wings.entries()) {
      const gradient = ctx.createLinearGradient(-240, -100, 0, 70);
      gradient.addColorStop(0, muted ? '#636b98' : '#e9ac76');
      gradient.addColorStop(1, muted ? '#222947' : '#8b3c53');
      ctx.fillStyle = gradient;
      ctx.strokeStyle = muted ? '#a4a0bd' : '#ffcd89';
      ctx.lineWidth = 2;
      ctx.fill(new Path2D(path));
      ctx.stroke(new Path2D(path));
      ctx.save();
      ctx.clip(new Path2D(path));
      ctx.lineWidth = 1;
      for (let line = 0; line < 12; line++) {
        const end = index ? 56 + line * 10 : -121 + line * 14;
        ctx.stroke(new Path2D(`M -6 49 Q -120 ${end - 24} -260 ${end}`));
      }
      ctx.restore();
    }
    ctx.fillStyle = muted ? '#343959' : '#733d50';
    ctx.strokeStyle = '#e8b685';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-145, -33, 29, 19, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-145, -33, 15, 8, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffdb9c';
    ctx.fill();
    ctx.stroke(new Path2D('M -4 30 Q -18 -9 -44 -20'));
    ctx.restore();
  }
  ctx.fillStyle = '#f3c68b';
  ctx.beginPath();
  ctx.ellipse(0, 48, 7, 36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f3c68b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-3, 6);
  ctx.quadraticCurveTo(-20, -28, -34, -36);
  ctx.moveTo(3, 6);
  ctx.quadraticCurveTo(20, -28, 34, -36);
  ctx.stroke();
  ctx.restore();
}

function lantern(ctx, x, y, size, dimmed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.strokeStyle = '#9a6d63';
  ctx.lineWidth = 1;
  ctx.stroke(new Path2D('M 0 -480 L 0 -24 M 0 24 L 0 43'));
  if (!dimmed) {
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 78);
    glow.addColorStop(0, 'rgba(255,183,95,.5)');
    glow.addColorStop(1, 'rgba(255,183,95,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 78, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = dimmed ? '#42425f' : '#eb934f';
  ctx.strokeStyle = dimmed ? '#82829d' : '#ffd58d';
  const shape = new Path2D('M -12 -23 L 12 -23 Q 35 0 12 23 L -12 23 Q -35 0 -12 -23');
  ctx.fill(shape);
  ctx.stroke(shape);
  ctx.stroke(new Path2D('M -6 -23 Q -17 0 -6 23 M 6 -23 Q 17 0 6 23 M -24 0 L 24 0'));
  ctx.restore();
}

function ash(ctx, width, height, count, warm) {
  const random = randomFrom(5521);
  for (let index = 0; index < count; index++) {
    const x = random() * width;
    const y = random() * height;
    const size = 1 + random() * 2.4;
    ctx.globalAlpha = 0.16 + random() * 0.4;
    ctx.fillStyle = index % 3 ? warm : '#d0a08b';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function ring(ctx, x, y, scale, dim) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = dim ? '#252b46' : '#331f30';
  ctx.strokeStyle = dim ? '#5c5e80' : '#91615b';
  for (const radius of [175, 191, 223]) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    if (radius === 175) ctx.fill();
    ctx.stroke();
  }
  for (let tick = 0; tick < 72; tick++) {
    ctx.rotate(Math.PI / 36);
    ctx.fillStyle = dim ? '#71738f' : '#a8766b';
    ctx.fillRect(205, 0, tick % 6 === 0 ? 11 : 4, 1);
  }
  ctx.strokeStyle = dim ? '#5f617f' : '#956362';
  ctx.stroke(new Path2D('M -280 0 H 280 M 0 -251 V 251'));
  ctx.restore();
}

export function paintFestival(canvas, scene, celebrate = false) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const hero = scene !== 'table';
  const dim = scene === 'loss';
  ctx.fillStyle = dim ? '#121527' : '#16172b';
  ctx.fillRect(0, 0, width, height);
  if (!hero) {
    const wash = ctx.createLinearGradient(0, 0, 0, height);
    wash.addColorStop(0, 'rgba(70,40,59,.42)');
    wash.addColorStop(1, 'rgba(15,16,32,0)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);
  }
  starfield(ctx, width, height, hero ? 240 : 110, dim ? '#9aa4cf' : '#f0b57c');
  if (!hero) {
    moon(ctx, width * 0.86, height * 0.18, 34, dim);
    for (let index = 0; index < 26; index++) {
      const x = ((index * 173) % 1000) / 1000 * width;
      reed(ctx, x, height + 6, 40 + (index % 5) * 18, (index % 2 ? 1 : -1) * (6 + index % 7), dim ? '#3a3f5d' : '#3d3049');
    }
    ring(ctx, width * 0.5, height * 0.5, Math.min(width, height) / 720, dim);
    ash(ctx, width, height, 26, dim ? '#9aa4cf' : '#f2b47a');
    return;
  }
  const scale = Math.min(width / 1280, height / 720);
  const centerX = width * 0.735;
  const centerY = height * 0.5;
  moon(ctx, centerX, centerY, 210 * scale, dim);
  ring(ctx, centerX, centerY, scale, dim);
  lantern(ctx, width * 0.557, height * 0.18, 0.8 * scale * (celebrate ? 1.05 : 1), dim);
  lantern(ctx, width * 0.93, height * 0.24, scale, dim);
  lantern(ctx, width * 0.875, height * 0.09, 0.52 * scale, dim);
  lantern(ctx, width * 0.64, height * 0.07, 0.34 * scale, dim);
  moth(ctx, centerX, centerY - 10 * scale, 1.02 * scale, dim);
  if (celebrate) {
    moth(ctx, centerX - 172 * scale, centerY + 92 * scale, 0.3 * scale, false);
    moth(ctx, centerX + 186 * scale, centerY + 58 * scale, 0.24 * scale, false);
    const random = randomFrom(881);
    for (let index = 0; index < 70; index++) {
      const x = centerX + (random() - 0.5) * 620 * scale;
      const y = centerY + (random() - 0.5) * 560 * scale;
      ctx.globalAlpha = 0.35 + random() * 0.6;
      ctx.fillStyle = index % 3 ? '#f6bf73' : '#e0909a';
      ctx.fillRect(x, y, 2 + random() * 4, 2 + random() * 4);
    }
    ctx.globalAlpha = 1;
  }
  ash(ctx, width, height, 34, dim ? '#9aa4cf' : '#f2b47a');
}
