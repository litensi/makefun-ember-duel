import { randomFrom } from './rules.js';

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
  ctx.restore();
}

function lantern(ctx, x, y, size, dimmed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.strokeStyle = '#9a6d63';
  ctx.lineWidth = 1;
  ctx.stroke(new Path2D('M 0 -480 L 0 -24 M 0 24 L 0 43'));
  ctx.fillStyle = dimmed ? '#42425f' : '#eb934f';
  ctx.strokeStyle = dimmed ? '#82829d' : '#ffd58d';
  const shape = new Path2D('M -12 -23 L 12 -23 Q 35 0 12 23 L -12 23 Q -35 0 -12 -23');
  ctx.fill(shape);
  ctx.stroke(shape);
  ctx.stroke(new Path2D('M -6 -23 Q -17 0 -6 23 M 6 -23 Q 17 0 6 23 M -24 0 L 24 0'));
  ctx.restore();
}

export function paintFestival(canvas, scene, celebrate = false) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const hero = scene !== 'table';
  const centerX = width * 0.735;
  const centerY = height * 0.49;
  ctx.fillStyle = '#16172b';
  ctx.fillRect(0, 0, width, height);
  const random = randomFrom(717);
  for (let index = 0; index < (hero ? 235 : 120); index++) {
    const x = random() * width;
    const y = random() * height;
    ctx.fillStyle = index % 4 === 0 ? '#b48672' : '#45415a';
    const size = index % 9 === 0 ? 3 : 1;
    ctx.fillRect(x, y, size, size);
  }
  if (!hero) {
    ctx.save();
    ctx.translate(width * .504, height * .49);
    ctx.strokeStyle = '#3f344e';
    for (const radius of [168, 183]) {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.stroke(new Path2D('M 0 -200 V 200 M -200 0 H 200'));
    ctx.restore();
    return;
  }

  const scale = Math.min(width / 1280, height / 720);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.fillStyle = scene === 'loss' ? '#303655' : '#46283b';
  ctx.strokeStyle = '#91615b';
  for (const radius of [175, 191, 223]) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    if (radius === 175) ctx.fill();
    ctx.stroke();
  }
  for (let tick = 0; tick < 72; tick++) {
    ctx.rotate(Math.PI / 36);
    ctx.fillStyle = '#a8766b';
    ctx.fillRect(205, 0, tick % 6 === 0 ? 11 : 4, 1);
  }
  ctx.strokeStyle = '#956362';
  ctx.stroke(new Path2D('M -280 0 H 280 M 0 -251 V 251'));
  ctx.restore();

  const dimmed = scene === 'loss';
  lantern(ctx, width * .557, height * .195, .82 * scale, dimmed);
  lantern(ctx, width * .92, height * .23, scale, dimmed);
  lantern(ctx, width * .877, height * .102, .53 * scale, dimmed);
  moth(ctx, centerX, centerY - 12 * scale, 1.02 * scale, scene === 'loss');
  if (celebrate) {
    for (let index = 0; index < 44; index++) {
      const x = centerX + (random() - .5) * 560 * scale;
      const y = centerY + (random() - .5) * 500 * scale;
      ctx.fillStyle = index % 2 ? '#f6bf73' : '#d28a83';
      ctx.fillRect(x, y, 2 + random() * 4, 2 + random() * 4);
    }
  }
}
