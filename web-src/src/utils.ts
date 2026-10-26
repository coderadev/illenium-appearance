export type ClothingPrices = {
  Default?: number;
  Hair?: number;
  Overlay?: number;
  EyeColor?: number;
  Surgery?: number;
  Tattoo?: number;
  ChargePerTattoo?: boolean;
  Components?: Record<string, number>;
  Props?: Record<string, number>;
  Items?: {
    Components?: Record<string, Record<string, number | Record<string, number>>>;
    Props?: Record<string, Record<string, number | Record<string, number>>>;
  };
};

export type ClothingImages = {
  Local?: boolean;
  UseCdn?: boolean;
  BaseUrl?: string;
  Path?: string;
  Components?: Record<string, string | Record<string, string | Record<string, string>>>;
  Props?: Record<string, string | Record<string, string | Record<string, string>>>;
  Hair?: Record<string, string>;
};

const COMPONENT_PRICE_KEYS: Record<number, string> = {
  1: 'Masks',
  3: 'UpperBody',
  4: 'LowerBody',
  5: 'Bags',
  6: 'Shoes',
  7: 'ScarfAndChains',
  8: 'Shirts',
  9: 'BodyArmor',
  10: 'Decals',
  11: 'Jackets',
};

const PROP_PRICE_KEYS: Record<number, string> = {
  0: 'Hats',
  1: 'Glasses',
  2: 'Ear',
  6: 'Watches',
  7: 'Bracelets',
};

const lookupNested = (table: any, ...keys: Array<string | number>): any => {
  let current = table;
  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key] ?? current[String(key)];
  }
  return current;
};

export type PriceKind = 'component' | 'prop' | 'hair' | 'overlay' | 'eyeColor' | 'surgery' | 'tattoo';

/**
 * Price of ONE item. Mirrors shared/pricing.lua - the server recomputes every
 * charge with that file, this copy only decides what the menu displays.
 */
export const getItemPrice = (
  prices: ClothingPrices | undefined,
  isFree: boolean,
  kind: PriceKind,
  id: number = 0,
  drawable: number = 0,
  costOverride?: number,
): number => {
  if (isFree) return 0;
  const base = prices?.Default ?? 0;

  if (kind === 'component' || kind === 'prop') {
    const group = kind === 'prop' ? prices?.Items?.Props : prices?.Items?.Components;
    const entry = lookupNested(group, id, drawable);
    if (typeof entry === 'number') return entry;
    if (entry && typeof entry.default === 'number') return entry.default;
    const names = kind === 'prop' ? PROP_PRICE_KEYS : COMPONENT_PRICE_KEYS;
    const category = (kind === 'prop' ? prices?.Props : prices?.Components)?.[names[id]];
    return typeof category === 'number' ? category : base;
  }
  if (kind === 'hair') return prices?.Hair ?? base;
  if (kind === 'overlay') return prices?.Overlay ?? base;
  if (kind === 'eyeColor') return prices?.EyeColor ?? base;
  if (kind === 'surgery') return prices?.Surgery ?? base;
  if (kind === 'tattoo') return typeof costOverride === 'number' ? costOverride : prices?.Tattoo ?? base;
  return 0;
};

const DEFAULT_CDN = 'https://cdn.jsdelivr.net/gh/ShortByte/GTA5-Cloth-Assets/assets';
const CDN_NO_GENDER: Record<number, boolean> = { 1: true, 5: true };

const COMPONENT_FOLDERS: Record<number, string> = {
  1: 'masks',
  2: 'hair',
  3: 'torsos',
  4: 'legs',
  5: 'bags',
  6: 'shoes',
  7: 'accessories',
  8: 'undershirts',
  9: 'bodyarmors',
  10: 'decals',
  11: 'tops',
};

const PROP_FOLDERS: Record<number, string> = {
  0: 'hats',
  1: 'glasses',
  2: 'ears',
  6: 'watches',
  7: 'bracelets',
};

const OVERLAY_FOLDERS: Record<string, string> = {
  blemishes: 'blemishes',
  beard: 'beards',
  eyebrows: 'eyebrows',
  ageing: 'ageing',
  makeUp: 'makeup',
  blush: 'blush',
  complexion: 'complexion',
  sunDamage: 'sun_damage',
  lipstick: 'lipstick',
  moleAndFreckles: 'moles',
  chestHair: 'chest_hair',
  bodyBlemishes: 'body_blemishes',
};

const lookupImage = (table: any, ...keys: Array<string | number>): string | undefined => {
  let current = table;
  for (const key of keys) {
    if (current == null) return undefined;
    if (typeof current === 'string' && current !== '') return current;
    current = current[key] ?? current[String(key)];
  }
  return typeof current === 'string' && current !== '' ? current : undefined;
};

const CDN_FOLDER_ALIASES: Record<string, string[]> = {
  hats: ['hats', 'hat'],
  glasses: ['glasses', 'glass'],
  ears: ['ears', 'ear'],
  watches: ['watches', 'watch'],
  bracelets: ['bracelets', 'bracelet'],
};

/**
 * Every URL worth trying on the CDN for one item, best guess first. The
 * <ItemImage> component walks the list until one loads, so a wrong guess about
 * the folder layout costs one failed request instead of a blank tile.
 */
const getCdnUrls = (
  type: 'component' | 'prop',
  id: number,
  drawable: number,
  texture: number,
  gender: 'male' | 'female',
): string[] => {
  const folder = type === 'prop' ? PROP_FOLDERS[id] : COMPONENT_FOLDERS[id];
  if (!folder) return [];
  const folders = (type === 'prop' && CDN_FOLDER_ALIASES[folder]) || [folder];
  const noGender = type === 'component' && !!CDN_NO_GENDER[id];
  const genderPaths = noGender ? ['', `/${gender}`] : [`/${gender}`, ''];
  const urls: string[] = [];
  for (const f of folders) {
    for (const g of genderPaths) {
      urls.push(`${DEFAULT_CDN}/${f}${g}/${drawable}/${texture}.webp`);
    }
  }
  return urls;
};

const LOCAL_COMPONENT: Record<number, string> = {
  1: 'Mask', 2: 'hair', 3: 'Torso', 4: 'Leg', 5: 'Parachute', 6: 'Shoes',
  7: 'Accessory', 8: 'Undershirt', 9: 'Kevlar', 10: 'Badge', 11: 'Jacket',
};
const LOCAL_PROP: Record<number, string> = { 0: 'Hat', 1: 'Glasses', 2: 'Ears', 6: 'Watch', 7: 'Bracelet' };
const LOCAL_OVERLAY: Record<string, string> = {
  blemishes: 'blemishes', beard: 'facialhair', eyebrows: 'eyebrows', ageing: 'ageing', makeUp: 'makeup',
  blush: 'blush', complexion: 'complexion', sunDamage: 'sundamage', lipstick: 'lipstick',
  moleAndFreckles: 'molesfreckles', chestHair: 'chesthair', bodyBlemishes: 'bodyblemishes',
};
const LOCAL_EXTS = ['webp', 'png', 'jpg'];
const localModel = (gender: 'male' | 'female') => (gender === 'female' ? 'mp_f_freemode_01' : 'mp_m_freemode_01');
const localFolder = (type: string, id: number | string) =>
  type === 'overlay' ? LOCAL_OVERLAY[String(id)] || String(id)
  : type === 'prop' ? LOCAL_PROP[id as number] : LOCAL_COMPONENT[id as number];

const getCustomUrl = (
  images: ClothingImages | undefined,
  type: 'component' | 'prop' | 'overlay',
  id: number | string,
  drawable: number,
  texture: number,
  gender: 'male' | 'female',
) => {
  const base = (images?.BaseUrl || '').replace(/\/$/, '');
  if (!base) return '';
  const root = (images?.Path || 'illenium-appearance/clothing').replace(/^\/+|\/+$/g, '');
  let folder: string;
  if (type === 'overlay') folder = OVERLAY_FOLDERS[String(id)] || String(id);
  else if (type === 'prop') folder = PROP_FOLDERS[id as number] || `prop_${id}`;
  else folder = COMPONENT_FOLDERS[id as number] || String(id);
  const stem = texture > 0 ? `${drawable}_${texture}` : String(drawable);
  return `${base}/${root}/${gender}/${folder}/${stem}.png`;
};

export const getClothingImageCandidates = (
  images: ClothingImages | undefined,
  type: 'component' | 'prop' | 'hair' | 'overlay',
  id: number | string,
  drawable: number,
  texture: number,
  gender: 'male' | 'female' = 'male',
): string[] => {
  const out: string[] = [];
  const push = (u?: string) => {
    if (u && !out.includes(u)) out.push(u);
  };

  if (type === 'hair') {
    push(lookupImage(images?.Hair, drawable));
    getClothingImageCandidates(images, 'component', 2, drawable, texture, gender).forEach(push);
    return out;
  }

  if (type !== 'overlay') {
    const map = type === 'prop' ? images?.Props : images?.Components;
    push(lookupImage(map, id, drawable, texture) || lookupImage(map, id, drawable) || lookupImage(map, id));
  }

  if (images?.Local) {
    const folder = localFolder(type, id);
    if (folder) {
      const stem = texture > 0 && type !== 'overlay' ? `${drawable}_${texture}` : String(drawable);
      for (const ext of LOCAL_EXTS) {
        push(`./clothing/${folder}/${localModel(gender)}/${stem}.${ext}`);
        push(`./clothing/${folder}/${stem}.${ext}`);
      }
    }
  } else if (images?.UseCdn) {
    if (type !== 'overlay') getCdnUrls(type, id as number, drawable, texture, gender).forEach(push);
  } else {
    push(getCustomUrl(images, type, id, drawable, texture, gender));
  }

  return out;
};

const DOCS = "https://docs.fivem.net";
const GTAHASH_PED_THUMB = "https://gtahash.com/models/peds/thumbs";

const resolvedImageCache = new Map<string, string>();

export function getCachedAssetImage(model: string, kind: "prop" | "ped" = "ped"): string | null {
  return resolvedImageCache.get(`${kind}:${model.toLowerCase()}`) || null;
}

export function setCachedAssetImage(model: string, kind: "prop" | "ped", url: string) {
  if (!model || !url || url.startsWith("data:")) return;
  resolvedImageCache.set(`${kind}:${model.toLowerCase()}`, url);
}

export function getPedImageCandidates(model: string): string[] {
  const name = model.toLowerCase().trim();
  const cached = getCachedAssetImage(name, "ped");
  const urls = [
    `${GTAHASH_PED_THUMB}/${name}.webp`,
    `${GTAHASH_PED_THUMB}/${name}.png`,
    `${DOCS}/peds/${name}.webp`,
    `${DOCS}/peds/${name}.png`,
  ];
  if (cached) return [cached, ...urls.filter((u) => u !== cached)];
  return urls;
}

function hashHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function modelInitials(model: string): string {
  const parts = model
    .toLowerCase()
    .replace(/^a_[c|f|m]_[m|y|s]_/, "")
    .replace(/^mp_[m|f]_/, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[parts.length - 2][0] || "";
    const b = parts[parts.length - 1][0] || "";
    return `${a}${b}`.toUpperCase() || "PD";
  }
  const clean = (parts[0] || "pd").replace(/[^a-z0-9]/g, "");
  return (clean.slice(0, 2) || "PD").toUpperCase();
}

export function getModelThumbDataUri(model: string, kind: "prop" | "ped" = "ped"): string {
  const initials = modelInitials(model);
  const hue = hashHue(model.toLowerCase());
  const accent = kind === "ped" ? "#00f0ff" : `hsl(${hue} 70% 55%)`;
  const label = initials.replace(/&/g, "").slice(0, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0e1218"/>
      <stop offset="100%" stop-color="#141a22"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" fill="url(#g)"/>
  <rect x="18" y="18" width="220" height="220" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="3"/>
  <text x="128" y="148" text-anchor="middle" font-family="Arial,sans-serif" font-size="72" font-weight="700" fill="${accent}">${label}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
