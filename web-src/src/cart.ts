import { ClothingPrices, PriceKind, getItemPrice } from './utils';

/**
 * The checkout is worked out by comparing the player's look when the menu opened
 * with how it looks now. Each changed item is counted once at its price, so
 * clicking through 40 jackets and settling on one costs one jacket, and putting
 * everything back costs nothing.
 */

export type CartItem = {
  kind: PriceKind;
  id?: number | string;
  drawable?: number;
  texture?: number;
  name?: string;
  label: string;
  price: number;
};

// Tattoos are a dictionary { ZONE_X: [tattoo...] } in game, but may also arrive as a flat array.
export const flattenTattoos = (tattoos: any): any[] => {
  if (!tattoos) return [];
  if (Array.isArray(tattoos)) return tattoos;
  const out: any[] = [];
  Object.keys(tattoos).forEach((zone) => {
    const list = tattoos[zone];
    if (Array.isArray(list)) list.forEach((t) => out.push({ zone, ...t }));
  });
  return out;
};

export const withTattoo = (tattoos: any, tattoo: any, present: boolean) => {
  const dict: Record<string, any[]> = {};
  flattenTattoos(tattoos).forEach((t) => {
    if (t.name === tattoo.name) return;
    (dict[t.zone] = dict[t.zone] || []).push(t);
  });
  if (present) (dict[tattoo.zone] = dict[tattoo.zone] || []).push(tattoo);
  return dict;
};

const close = (a: any, b: any) => Math.abs((Number(a) || 0) - (Number(b) || 0)) < 0.0001;

// Slots that freemode peds can't change through the clothing menu.
const SKIPPED_COMPONENTS = new Set([0, 2]);

export function buildCart(
  initial: any,
  current: any,
  prices: ClothingPrices | undefined,
  isFree: boolean,
): { items: CartItem[]; total: number } {
  if (!initial || !current || isFree) return { items: [], total: 0 };
  const items: CartItem[] = [];

  // --- components ---------------------------------------------------------
  (current.components || []).forEach((c: any) => {
    if (SKIPPED_COMPONENTS.has(c.component_id)) return;
    const before = (initial.components || []).find((i: any) => i.component_id === c.component_id);
    if (before && before.drawable === c.drawable && before.texture === c.texture) return;
    if (!before && c.drawable === 0 && c.texture === 0) return;
    items.push({
      kind: 'component',
      id: c.component_id,
      drawable: c.drawable,
      texture: c.texture,
      label: `component ${c.component_id}`,
      price: getItemPrice(prices, false, 'component', c.component_id, c.drawable),
    });
  });

  // --- props (taking one off is free) ---------------------------------------
  (current.props || []).forEach((p: any) => {
    const before = (initial.props || []).find((i: any) => i.prop_id === p.prop_id);
    if (before && before.drawable === p.drawable && before.texture === p.texture) return;
    if (p.drawable === -1) return;
    items.push({
      kind: 'prop',
      id: p.prop_id,
      drawable: p.drawable,
      texture: p.texture,
      label: `prop ${p.prop_id}`,
      price: getItemPrice(prices, false, 'prop', p.prop_id, p.drawable),
    });
  });

  // --- hair (style + colours are one haircut) ---------------------------------
  const h0 = initial.hair || {};
  const h1 = current.hair || {};
  if (
    current.hair &&
    (h0.style !== h1.style || h0.color !== h1.color || h0.highlight !== h1.highlight || (h0.texture || 0) !== (h1.texture || 0))
  ) {
    items.push({ kind: 'hair', label: 'hair', price: getItemPrice(prices, false, 'hair') });
  }

  // --- overlays (beard, eyebrows, makeup...) ----------------------------------
  const o1 = current.headOverlays || {};
  Object.keys(o1).forEach((key) => {
    const a = (initial.headOverlays || {})[key] || {};
    const b = o1[key] || {};
    const same =
      (a.style ?? 0) === (b.style ?? 0) &&
      close(a.opacity ?? 0, b.opacity ?? 0) &&
      (a.color ?? 0) === (b.color ?? 0) &&
      (a.secondColor ?? 0) === (b.secondColor ?? 0);
    if (same) return;
    items.push({ kind: 'overlay', id: key, label: key, price: getItemPrice(prices, false, 'overlay') });
  });

  // --- eyes ------------------------------------------------------------------
  if (current.eyeColor !== undefined && initial.eyeColor !== undefined && current.eyeColor !== initial.eyeColor) {
    items.push({ kind: 'eyeColor', label: 'eye colour', price: getItemPrice(prices, false, 'eyeColor') });
  }

  // --- surgery: head blend + face features together are one operation ----------
  const changedBlend = Object.keys(current.headBlend || {}).some((k) => !close(current.headBlend[k], (initial.headBlend || {})[k]));
  const changedFace = Object.keys(current.faceFeatures || {}).some((k) => !close(current.faceFeatures[k], (initial.faceFeatures || {})[k]));
  if (changedBlend || changedFace) {
    items.push({ kind: 'surgery', label: 'surgery', price: getItemPrice(prices, false, 'surgery') });
  }

  // --- tattoos (new ones only; removing is free) ---------------------------------
  const owned = new Set(flattenTattoos(initial.tattoos).map((t) => t.name));
  let flatFeeCharged = false;
  flattenTattoos(current.tattoos).forEach((t) => {
    if (owned.has(t.name)) return;
    let price = getItemPrice(prices, false, 'tattoo', 0, 0, t.cost);
    if (prices?.ChargePerTattoo === false) {
      if (flatFeeCharged) price = 0;
      flatFeeCharged = true;
    }
    items.push({ kind: 'tattoo', name: t.name, label: t.label || t.name, price });
  });

  return { items, total: items.reduce((sum, i) => sum + i.price, 0) };
}

// What gets sent to the server: only *which* items changed, never prices.
export const toServerCart = (items: CartItem[]) =>
  items.map(({ kind, id, drawable, name }) => ({ kind, id, drawable, name }));
