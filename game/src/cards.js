export const suits = {
  Lantern: { icon: '◆', action: 'Attack', note: 'burns Embers' },
  Moth: { icon: '✦', action: 'Guard', note: 'shields the Keeper' },
  Wind: { icon: '≈', action: 'Tempo', note: 'draws and chills' },
  Wax: { icon: '●', action: 'Mend', note: 'heals and seals' },
};

const catalog = [
  ['Foxfire', 'Lantern', 1, 2],
  ['Cricket Lamp', 'Lantern', 1, 2, { burn: 1 }],
  ['Saffron Torch', 'Lantern', 2, 4],
  ['Last Beacon', 'Lantern', 3, 6, { burn: 2 }],
  ['Pale Silkmoth', 'Moth', 1, 2],
  ['Velvet Wing', 'Moth', 1, 2, { shroud: 1 }],
  ['Paper Wings', 'Moth', 1, 3],
  ['Ash Cloak', 'Moth', 2, 4],
  ['Moon Mantle', 'Moth', 2, 5, { shroud: 1 }],
  ['Roof Draft', 'Wind', 0, 1, { draw: 1 }],
  ['Bell Gust', 'Wind', 0, 1, { wick: 1 }],
  ['Honey Seal', 'Wax', 1, 2, { heal: 2 }],
  ['Amber Salve', 'Wax', 2, 3, { heal: 2 }],
  ['Smoke', 'Wind', 1, 2, { smoke: 2 }],
  ['Kindle', 'Wind', 0, 1, { wick: 1, draw: 1 }],
  ['Molt', 'Moth', 1, 0, { molt: true }],
].map(([name, suit, cost, value, effect = {}]) => ({ name, suit, cost, value, effect }));

export function deck() {
  return catalog.map(card => ({ ...card }));
}

export function cardText(card) {
  const parts = [];
  const { effect } = card;
  if (effect.smoke) parts.push('Next attack −2');
  if (effect.molt) parts.push('Discard 1 · Ignore next hit');
  if (effect.burn) parts.push(`Burn ${effect.burn}`);
  if (effect.shroud) parts.push(`Shroud ${effect.shroud}`);
  if (effect.heal) parts.push(`Heal ${effect.heal}`);
  if (effect.draw) parts.push(`Draw ${effect.draw}`);
  if (effect.wick) parts.push(`+${effect.wick} Wick`);
  if (parts.length) return parts.join(' · ');
  return suits[card.suit].action;
}
