import React, { useState } from 'react';
import Nui from '../Nui';
import { Filter, Trash2, Check, Search, X } from 'lucide-react';
import { getCategoryLucideIcon } from './CategoryIcons';
import { ClothingImages, ClothingPrices, getClothingImageCandidates, getItemPrice, getPedImageCandidates, setCachedAssetImage, getModelThumbDataUri } from '../utils';
import { flattenTattoos } from '../cart';
import ItemImage from './ItemImage';

function PedCardImage({ model }: { model: string }) {
  const candidates = React.useMemo(() => getPedImageCandidates(model), [model]);
  const [srcIndex, setSrcIndex] = useState(0);

  const fallbackUri = getModelThumbDataUri(model, "ped");
  const currentSrc = srcIndex < candidates.length ? candidates[srcIndex] : fallbackUri;

  return (
    <img
      src={currentSrc}
      alt={model}
      onError={() => {
        setSrcIndex(prev => prev + 1);
      }}
      onLoad={() => {
        if (currentSrc && !currentSrc.startsWith("data:")) {
          setCachedAssetImage(model, "ped", currentSrc);
        }
      }}
      className="w-full h-full object-contain p-1"
    />
  );
}

const APPAREL_CATEGORIES = [
  { id: 'OUTFITS', label: 'OUTFITS' },
  { id: 'CLOTHING', label: 'CLOTHING' },
  { id: 'UPPER BODY ACCESSORIES', label: 'UPPER BODY ACCESSORIES' },
  { id: 'HAND & WRIST ACCESSORIES', label: 'HAND & WRIST ACCESSORIES' },
  { id: 'HEAD ACCESSORIES', label: 'HEAD ACCESSORIES' },
];

const APPAREL_SUBCATEGORIES: Record<string, { label: string; cam: string }[]> = {
  'CLOTHING': [
    { label: 'TOPS', cam: 'body' },
    { label: 'UNDERSHIRTS', cam: 'body' },
    { label: 'BOTTOMS', cam: 'legs' },
    { label: 'SHOES', cam: 'shoes' },
  ],
  'UPPER BODY ACCESSORIES': [
    { label: 'BODY ARMOR', cam: 'body' },
    { label: 'BAGS & PARACHUTES', cam: 'body' },
    { label: 'DECALS', cam: 'body' },
  ],
  'HAND & WRIST ACCESSORIES': [
    { label: 'GLOVES', cam: 'body' },
    { label: 'WATCHES', cam: 'body' },
    { label: 'BRACELETS', cam: 'body' },
  ],
  'HEAD ACCESSORIES': [
    { label: 'MASKS', cam: 'head' },
    { label: 'HATS', cam: 'head' },
    { label: 'GLASSES', cam: 'head' },
    { label: 'EARS', cam: 'head' },
  ],
  'OUTFITS': [
    { label: 'SAVED OUTFITS', cam: 'body' },
  ]
};

// Same labels the sidebar and App.tsx use, so the zone you click is the zone you get.
const TATTOO_ZONES = [
  { label: 'HEAD' },
  { label: 'TORSO' },
  { label: 'LEFT ARM' },
  { label: 'RIGHT ARM' },
  { label: 'LEFT LEG' },
  { label: 'RIGHT LEG' },
];

const TAB_ICON_LISTS: Record<string, { label: string }[]> = {
  HAIR: [
    { label: 'STYLES' },
    { label: 'FACIAL HAIR' },
    { label: 'EYEBROWS' },
    { label: 'CHEST HAIR' },
  ],
  OVERLAYS: [
    { label: 'BLEMISHES' },
    { label: 'AGEING' },
    { label: 'COMPLEXION' },
    { label: 'SUN DAMAGE' },
    { label: 'MOLES & FRECKLES' },
    { label: 'BODY BLEMISHES' },
    { label: 'MAKEUP' },
    { label: 'BLUSH' },
    { label: 'LIPSTICK' },
    { label: 'FACIAL HAIR' },
    { label: 'EYEBROWS' },
    { label: 'CHEST HAIR' },
  ],
  'FACE & BODY': [
    { label: 'HEAD BLEND' },
    { label: 'EYE COLOR' },
    { label: 'FACE FEATURES' },
  ],
  'FACE ADJUSTMENTS': [
    { label: 'NOSE' },
    { label: 'BROW' },
    { label: 'EYES' },
    { label: 'CHEEKS' },
    { label: 'LIPS & JAW' },
    { label: 'CHIN & NECK' },
  ],
};

export default function Grid({ 
  navPath,
  setNavPath,
  activeCategory, 
  itemType, 
  itemId, 
  itemsToRender, 
  activeItem,
  gender,
  appearanceData,
  onItemSelect,
  onModelApplied,
  isFree,
  prices,
  images
}: { 
  navPath: string[];
  setNavPath: (path: string[]) => void;
  activeCategory: string;
  itemType: string;
  itemId: number;
  itemsToRender: any[];
  activeItem: any;
  gender?: 'male' | 'female';
  appearanceData?: any;
  onItemSelect?: (item: any) => void;
  onModelApplied?: (res: { appearanceData?: any; appearanceSettings?: any }) => void;
  isFree?: boolean;
  prices?: ClothingPrices;
  images?: ClothingImages;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!activeCategory || itemsToRender.length === 0) return null;

  const resolvePrice = (item: any) => {
    switch (itemType) {
      case 'component':
        return getItemPrice(prices, !!isFree, 'component', itemId, item.drawable);
      case 'prop':
        return getItemPrice(prices, !!isFree, 'prop', itemId, item.drawable);
      case 'hair':
        return getItemPrice(prices, !!isFree, 'hair');
      case 'overlay':
        return getItemPrice(prices, !!isFree, 'overlay');
      case 'eye_color':
        return getItemPrice(prices, !!isFree, 'eyeColor');
      case 'tattoo':
        return getItemPrice(prices, !!isFree, 'tattoo', 0, 0, item.cost);
      default:
        return 0;
    }
  };

  const ownedTattoos = flattenTattoos(appearanceData?.tattoos);

  // Picking an item only changes how the player looks. Nothing is charged here:
  // the total at the bottom is worked out from what actually changed (see cart.ts).
  const handleUpdateItem = (drawable: number, texture: number) => {
    if (itemType === 'ped_model') {
      const targetItem = itemsToRender[drawable] || itemsToRender.find(it => it.drawable === drawable);
      const modelName = targetItem?.model || targetItem?.name;
      if (modelName) {
        if (onItemSelect) onItemSelect({ model: modelName, name: modelName });
        Nui.post('appearance_change_model', modelName).then((res: any) => {
          if (res && onModelApplied) {
            onModelApplied(res);
          } else if (res?.appearanceData && onItemSelect) {
            onItemSelect(res.appearanceData);
          }
        });
      }
      return;
    }

    if (itemType === 'tattoo') {
      const tattooItem = itemsToRender[drawable] || itemsToRender.find(it => it.drawable === drawable);
      if (tattooItem) {
        const { drawable: _d, texture: _t, ...tattoo } = tattooItem;
        const owned = ownedTattoos.some((t: any) => t.name === tattoo.name);
        if (owned) {
          Nui.post('appearance_delete_tattoo', { name: tattoo.name, zone: tattoo.zone });
        } else {
          Nui.post('appearance_apply_tattoo', { tattoo, updatedTattoos: [tattoo] });
        }
        if (onItemSelect) onItemSelect({ ...tattoo, _remove: owned });
      }
      return;
    }

    if (itemType === 'component') {
      Nui.post('appearance_change_component', { component_id: itemId, drawable, texture });
      if (onItemSelect) onItemSelect({ component_id: itemId, drawable, texture });
    } else if (itemType === 'prop') {
      Nui.post('appearance_change_prop', { prop_id: itemId, drawable, texture });
      if (onItemSelect) onItemSelect({ prop_id: itemId, drawable, texture });
    } else if (itemType === 'eye_color') {
      Nui.post('appearance_change_eye_color', drawable);
      if (onItemSelect) onItemSelect({ drawable, texture: 0 });
    } else if (itemType === 'hair') {
      const color = appearanceData?.hair?.color || 0;
      const highlight = appearanceData?.hair?.highlight || 0;
      Nui.post('appearance_change_hair', { style: drawable, color, highlight });
      if (onItemSelect) onItemSelect({ drawable, texture: 0 });
    } else if (itemType === 'overlay') {
      const overlayItem = itemsToRender[drawable] || itemsToRender.find(it => it.drawable === drawable);
      const overlayKey = overlayItem?.overlayKey;
      if (overlayKey) {
        const current = appearanceData?.headOverlays?.[overlayKey] || {};
        Nui.post('appearance_change_head_overlay', {
          key: overlayKey,
          style: drawable,
          opacity: current.opacity ?? 1,
          color: current.color || 0,
          secondColor: current.secondColor || 0,
        });
        if (onItemSelect) onItemSelect({ drawable, texture: 0, overlayKey, style: drawable });
      }
    }
  };

  const handleRemoveItem = () => {
    if (itemType === 'component') {
      Nui.post('appearance_change_component', { component_id: itemId, drawable: 0, texture: 0 });
      if (onItemSelect) onItemSelect({ component_id: itemId, drawable: 0, texture: 0 });
    } else if (itemType === 'prop') {
      Nui.post('appearance_change_prop', { prop_id: itemId, drawable: -1, texture: 0 });
      if (onItemSelect) onItemSelect({ prop_id: itemId, drawable: -1, texture: 0 });
    } else if (itemType === 'tattoo') {
      // clear every tattoo in the zone that is currently open
      const zone = itemsToRender[0]?.zone;
      ownedTattoos
        .filter((t: any) => t.zone === zone)
        .forEach((t: any) => {
          Nui.post('appearance_delete_tattoo', { name: t.name, zone: t.zone });
          if (onItemSelect) onItemSelect({ ...t, _remove: true });
        });
    } else if (itemType === 'overlay') {
      const overlayKey = activeItem?.overlayKey || itemsToRender[0]?.overlayKey;
      if (overlayKey) {
        const current = appearanceData?.headOverlays?.[overlayKey] || {};
        Nui.post('appearance_change_head_overlay', {
          key: overlayKey,
          style: 255,
          opacity: 0,
          color: current.color || 0,
          secondColor: current.secondColor || 0,
        });
        if (onItemSelect) onItemSelect({ drawable: 255, texture: 0, overlayKey, style: 255 });
      }
    } else if (itemType === 'hair') {
      const color = appearanceData?.hair?.color || 0;
      const highlight = appearanceData?.hair?.highlight || 0;
      Nui.post('appearance_change_hair', { style: 0, color, highlight });
      if (onItemSelect) onItemSelect({ drawable: 0, texture: 0 });
    }
  };

  const handleNavigateBack = () => {
    if (navPath.length > 1) {
      setNavPath(navPath.slice(0, -1));
    }
  };

  const mainTab = navPath[0];
  const currentFolder = navPath.length >= 2 ? navPath[1] : '';
  const currentSubList = APPAREL_SUBCATEGORIES[currentFolder] || [];

  const filteredItems = itemsToRender.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    if (itemType === 'ped_model') {
      const modelName = (item.model || item.name || '').toLowerCase();
      const cleanModelName = modelName.replace(/_/g, ' ');
      const cleanQ = q.replace(/_/g, ' ');
      return modelName.includes(q) || cleanModelName.includes(cleanQ);
    }
    if (itemType === 'tattoo') {
      const label = (item.label || item.name || '').toLowerCase();
      const coll = (item.collection || '').toLowerCase();
      return label.includes(q) || coll.includes(q);
    }
    const name = `${activeCategory} ${item.drawable}`.toLowerCase();
    return name.includes(q) || String(item.drawable).includes(q);
  });

  return (
    <div className="w-[660px] flex flex-col pointer-events-auto ml-12 mt-8 select-none relative z-10">
      <div className="flex items-center gap-3.5 mb-4 h-12 whitespace-nowrap min-w-max">
        <button 
          onClick={handleNavigateBack}
          className="w-12 h-12 bg-white text-black font-bold text-2xl flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer flex-shrink-0"
          title="Go Back"
        >
          {'<'}
        </button>
        <div className="font-bebas italic tracking-wider uppercase leading-none pt-1 whitespace-nowrap flex items-baseline gap-3">
          {navPath.map((step, idx) => {
            const fontClasses = [
              'text-[40px] text-white font-bold',
              'text-[30px] text-white/80 font-semibold',
              'text-[22px] text-white/60 font-medium'
            ];
            const sizeClass = fontClasses[Math.min(idx, fontClasses.length - 1)];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (idx < navPath.length - 1) {
                    setNavPath(navPath.slice(0, idx + 1));
                  }
                }}
                className={`transition-colors uppercase ${sizeClass} ${
                  idx < navPath.length - 1 ? 'hover:text-white cursor-pointer' : 'cursor-default'
                }`}
              >
                {step}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-[3px]">
        {mainTab === 'APPAREL' && (
          <div className="flex gap-[3px]">
            <div className="w-[52px] flex flex-col gap-[3px]">
              {APPAREL_CATEGORIES.map(cat => {
                const isFolderActive = currentFolder === cat.label;
                return (
                  <button 
                    key={cat.id}
                    title={cat.label}
                    onClick={() => {
                      const firstSub = (APPAREL_SUBCATEGORIES[cat.label] && APPAREL_SUBCATEGORIES[cat.label][0]?.label) || cat.label;
                      setNavPath(['APPAREL', cat.label, firstSub]);
                    }}
                    className={`
                      w-full h-[52px] flex items-center justify-center transition-all cursor-pointer
                      ${isFolderActive 
                        ? 'bg-white/20 text-white border-l-2 border-white' 
                        : 'bg-[#181a20]/90 text-white/35 hover:text-white/80 hover:bg-zinc-800'}
                    `}
                  >
                    {getCategoryLucideIcon(cat.label, "w-6 h-6")}
                  </button>
                );
              })}
            </div>

            {currentSubList.length > 0 && (
              <div className="w-[52px] flex flex-col gap-[3px]">
                {currentSubList.map(sub => {
                  const isSubActive = activeCategory === sub.label;
                  return (
                    <button 
                      key={sub.label}
                      title={sub.label}
                      onClick={() => {
                        setNavPath(['APPAREL', currentFolder, sub.label]);
                      }}
                      className={`
                        w-full h-[52px] flex items-center justify-center transition-all cursor-pointer shadow-md
                        ${isSubActive 
                          ? 'bg-white text-black ring-1 ring-white' 
                          : 'bg-[#181a20]/90 text-white/40 hover:text-white hover:bg-zinc-800'}
                      `}
                    >
                      {getCategoryLucideIcon(sub.label, `w-6 h-6 ${isSubActive ? 'text-black' : 'text-white/40'}`)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {TAB_ICON_LISTS[mainTab] && (
          <div className="w-[52px] flex flex-col gap-[3px] max-h-[72vh] overflow-y-auto styled-scrollbar">
            {TAB_ICON_LISTS[mainTab].map(sub => {
              const isSubActive = activeCategory === sub.label;
              return (
                <button
                  key={sub.label}
                  title={sub.label}
                  onClick={() => {
                    setNavPath([mainTab, sub.label]);
                  }}
                  className={`
                    w-full h-[52px] flex items-center justify-center transition-all cursor-pointer shadow-md
                    ${isSubActive
                      ? 'bg-white text-black ring-1 ring-white'
                      : 'bg-[#181a20]/90 text-white/40 hover:text-white hover:bg-zinc-800'}
                  `}
                >
                  {getCategoryLucideIcon(sub.label, `w-6 h-6 ${isSubActive ? 'text-black' : 'text-white/40'}`)}
                </button>
              );
            })}
          </div>
        )}

        {mainTab === 'TATTOOS' && (
          <div className="w-[52px] flex flex-col gap-[3px]">
            {TATTOO_ZONES.map(sub => {
              const isSubActive = activeCategory === sub.label || (navPath.length === 1 && sub.label === 'ZONE_HEAD');
              return (
                <button 
                  key={sub.label}
                  title={sub.label.replace('ZONE_', '').replace('_', ' ')}
                  onClick={() => {
                    setNavPath(['TATTOOS', sub.label]);
                  }}
                  className={`
                    w-full h-[52px] flex items-center justify-center transition-all cursor-pointer shadow-md
                    ${isSubActive 
                      ? 'bg-white text-black ring-1 ring-white' 
                      : 'bg-[#181a20]/90 text-white/40 hover:text-white hover:bg-zinc-800'}
                  `}
                >
                  {getCategoryLucideIcon(sub.label, `w-6 h-6 ${isSubActive ? 'text-black' : 'text-white/40'}`)}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 flex flex-col bg-transparent p-0">
          <div className="flex gap-[3px] mb-3">
            <div className="flex-1 bg-[#181a20] flex items-center px-3 py-1.5 gap-2 border border-white/5 focus-within:border-white">
              <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm font-oswald text-white w-full placeholder-zinc-500" 
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-zinc-400 hover:text-white">✕</button>
              )}
            </div>
            
            <button 
              title="Filter"
              className="w-10 h-10 bg-[#181a20] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Filter className="w-5 h-5" />
            </button>

            <button 
              title="Remove Item"
              onClick={handleRemoveItem}
              className="w-10 h-10 bg-[#181a20] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 auto-rows-max content-start gap-1.5 overflow-y-auto max-h-[72vh] pr-1 styled-scrollbar">
            {filteredItems.map((item, idx) => {
              const isPedModel = itemType === 'ped_model';
              const isTattoo = itemType === 'tattoo';
              const isOverlay = itemType === 'overlay';
              const isActive = isPedModel 
                ? (appearanceData?.model === item.model || activeItem?.model === item.model)
                : isTattoo
                ? ownedTattoos.some((t: any) => t.name === item.name)
                : (activeItem?.drawable === item.drawable);

              let itemName = isPedModel
                ? (item.model || item.name || '')
                : isTattoo
                ? (item.label || item.name || '')
                : isOverlay
                ? (item.drawable === 0 ? 'NONE' : `STYLE ${item.drawable}`)
                : `${activeCategory} ${item.drawable}`;

              const itemPrice = resolvePrice(item);

              let candidates: string[] = [];
              if (itemType === 'component' || itemType === 'prop') {
                candidates = getClothingImageCandidates(images, itemType, itemId, item.drawable, item.texture || 0, gender);
              } else if (itemType === 'hair') {
                candidates = getClothingImageCandidates(images, 'hair', 2, item.drawable, item.texture || 0, gender);
              } else if (isOverlay) {
                candidates = getClothingImageCandidates(images, 'overlay', item.overlayKey || itemId, item.drawable, 0, gender);
              }

              return (
                <button
                  key={`${itemType}-${itemId}-${activeCategory}-${item.drawable}`}
                  onClick={() => handleUpdateItem(item.drawable, item.texture || 0)}
                  className={`
                    relative flex flex-col aspect-[4/5] bg-[#141b24]/75 group transition-all cursor-pointer overflow-hidden
                    ${isActive ? 'ring-2 ring-[#2de1ec] border border-[#2de1ec] z-10' : 'border border-white/10 hover:border-white hover:ring-1 hover:ring-white hover:z-10'}
                  `}
                >
                  <div className="flex-1 w-full flex flex-col items-center justify-center overflow-hidden p-2 relative">
                    {isPedModel ? (
                      <PedCardImage model={item.model || item.name} />
                    ) : isOverlay ? (
                      <div className="flex flex-col items-center justify-center gap-1.5 text-white/80 group-hover:text-white transition-colors p-2 text-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-white">
                          {getCategoryLucideIcon(activeCategory, 'w-5 h-5')}
                        </div>
                        <span className="text-[10px] font-oswald text-zinc-400 truncate max-w-[110px] uppercase">
                          {item.drawable === 0 ? 'NONE' : `STYLE ${item.drawable}`}
                        </span>
                      </div>
                    ) : isTattoo ? (
                      <div className="flex flex-col items-center justify-center gap-1.5 text-white/80 group-hover:text-white transition-colors p-2 text-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-white">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-oswald text-zinc-400 truncate max-w-[110px] uppercase">
                          {item.collection || 'Tattoo'}
                        </span>
                      </div>
                    ) : (
                      <ItemImage
                        candidates={candidates}
                        fallback={
                          <div className="flex flex-col items-center justify-center gap-1 text-white/60">
                            {getCategoryLucideIcon(activeCategory, 'w-8 h-8')}
                            <span className="text-[11px] font-oswald tracking-wider">#{item.drawable}</span>
                          </div>
                        }
                      />
                    )}
                  </div>

                  <div className="w-full bg-[#0d0e12] px-2 py-1.5 flex items-center justify-between min-h-[30px]">
                    <span className="text-[11px] font-oswald text-white/90 truncate uppercase tracking-wider font-medium text-left pr-1">
                      {itemName}
                    </span>

                    {isActive ? (
                      <div className="text-white flex-shrink-0">
                        <Check className="w-4 h-4 text-[#2de1ec]" />
                      </div>
                    ) : isFree || itemPrice <= 0 ? (
                      <div className="bg-emerald-400 text-black px-1.5 py-0.5 flex items-center gap-0.5 leading-none flex-shrink-0">
                        <span className="font-oswald text-[11px] font-bold">FREE</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 leading-none flex-shrink-0">
                        <span className="bg-[#19e0d0] text-[#04201f] w-[15px] h-[15px] flex items-center justify-center text-[11px] font-oswald font-bold">$</span>
                        <span className="font-oswald italic text-[15px] font-bold text-white">{itemPrice}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
