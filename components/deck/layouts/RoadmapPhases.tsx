import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { inline } from '../inline';

/* Ref slide 35: "Roadmap" + subtitle + phase columns (Fase 0N, name, body, ¿Qué hacemos? + bullets). */
export function RoadmapPhases({ slide, page }: { slide: Extract<Slide, { kind: 'roadmapPhases' }>; page: number }) {
  return (
    <div className={`frame theme-${slide.theme} roadmapphases`}>
      <Chrome page={page} />
      <div className="title">{inline(slide.title || 'Roadmap')}</div>
      {slide.subtitle && <div className="sub">{inline(slide.subtitle)}</div>}
      <div className="phases">
        {slide.phases.map((ph, i) => (
          <div className="phase" key={i}>
            <div className="fase">Fase 0{i + 1}</div>
            <h3>{inline(ph.name)}</h3>
            {ph.body && <p className="pbody">{inline(ph.body)}</p>}
            {ph.items.length > 0 && (
              <>
                <div className="qh">¿Qué hacemos?</div>
                <ul>
                  {ph.items.map((it, k) => (
                    <li key={k}><span className="dia">◆</span><span>{inline(it)}</span></li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
