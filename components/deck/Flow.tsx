import type { RichNode } from '@/lib/deck/types';
import { inline } from './inline';

/* Renders a body flow — paragraphs and bullet lists (`- …`) kept in document order — shared by
   the free-text layouts (paragraph, split, contexto) so a `-` list can sit between paragraphs.
   The list carries the deck's diamond bullet; per-layout CSS tunes the type size/colour. */
export function Flow({ nodes }: { nodes: RichNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        if (node.t === 'ul') {
          return (
            <ul className="flowlist" key={i}>
              {node.items.map((it, k) => (
                <li key={k}><span className="dia">◆</span><span>{inline(it)}</span></li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(node.text)}</p>;
      })}
    </>
  );
}
