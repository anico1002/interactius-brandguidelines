'use client';
import { useContext, useState } from 'react';
import type { ImageRef } from '@/lib/deck/types';
import { optimizeImage } from '@/lib/deck/optimizeImage';
import { ViewerContext } from './viewer';

/* Editable image slot: click → pick a file from disk → downscale/recompress → replace.
   In viewer mode (shared presentation) it is a plain, non-editable image. */
export function ImageSlot({ image, className }: { image?: ImageRef; className?: string }) {
  const viewer = useContext(ViewerContext);
  const [src, setSrc] = useState<string | undefined>(image?.src);
  const pick = () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (!f) return;
      try {
        setSrc(await optimizeImage(f));
      } catch {
        setSrc(URL.createObjectURL(f));
      }
    };
    inp.click();
  };
  return (
    <div
      className={`imgslot ${className ?? ''}`}
      style={{ backgroundImage: src ? `url('${src}')` : undefined, cursor: viewer ? 'default' : 'pointer' }}
      onClick={viewer ? undefined : pick}
    >
      {!src && <div className="placeholder">{image?.prompt ?? 'Imagen · universo visual'}</div>}
      {!viewer && <div className="imghint">Clic para reemplazar imagen</div>}
    </div>
  );
}
