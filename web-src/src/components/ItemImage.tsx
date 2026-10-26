import React, { useState } from 'react';

// Remembers which candidate URL worked (or that none did) so tiles that scroll
// back into view, or menus that reopen, don't repeat the failed requests.
const resolved = new Map<string, number>();

/**
 * Thumbnail that walks a list of candidate URLs until one loads, then falls back
 * to a readable placeholder.
 *
 * All state is derived from the candidate list itself, so when React reuses this
 * component for a different item (another drawable / texture / category) it
 * starts again from the first candidate. The old <img onError> chain stored its
 * progress on the DOM node, which is how one item could end up showing another
 * item's picture.
 */
export default function ItemImage({
  candidates,
  fallback,
  className = 'w-full h-full object-contain',
}: {
  candidates: string[];
  fallback: React.ReactNode;
  className?: string;
}) {
  const key = candidates.join('|');
  const [failed, setFailed] = useState<{ key: string; count: number }>({ key, count: 0 });

  const known = resolved.get(key);
  const skipped = failed.key === key ? failed.count : known ?? 0;
  const src = skipped < candidates.length ? candidates[skipped] : undefined;

  if (!src) return <>{fallback}</>;

  return (
    <img
      key={src}
      src={src}
      alt=""
      draggable={false}
      loading="lazy"
      className={className}
      onLoad={() => resolved.set(key, skipped)}
      onError={() => {
        const next = skipped + 1;
        if (next >= candidates.length) resolved.set(key, next);
        setFailed({ key, count: next });
      }}
    />
  );
}
