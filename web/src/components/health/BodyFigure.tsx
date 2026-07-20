import React, { useMemo } from 'react';
import { Injury } from './types';

const MAN_SRC = 'https://files.catbox.moe/2benql.svg';

// native pixel space of the man image — regions below are defined in it
const IMG_W = 714;
const IMG_H = 1818;

// Addressable regions on the man. Injuries reference one of these via their
// `bodyPart` field (case / separator insensitive).
export type BodyPart =
  | 'head'
  | 'torso'
  | 'pelvis'
  | 'left-arm'
  | 'right-arm'
  | 'left-hand'
  | 'right-hand'
  | 'left-leg'
  | 'right-leg'
  | 'left-foot'
  | 'right-foot';

const PART_ALIASES: Record<string, BodyPart> = {
  head: 'head',
  skull: 'head',
  neck: 'head',
  torso: 'torso',
  chest: 'torso',
  ribs: 'torso',
  spine: 'torso',
  back: 'torso',
  pelvis: 'pelvis',
  hip: 'pelvis',
  hips: 'pelvis',
  abdomen: 'pelvis',
  stomach: 'pelvis',
  'left-arm': 'left-arm',
  'right-arm': 'right-arm',
  'left-hand': 'left-hand',
  'right-hand': 'right-hand',
  'left-leg': 'left-leg',
  'right-leg': 'right-leg',
  'left-foot': 'left-foot',
  'right-foot': 'right-foot',
};

const normalizePart = (raw?: string): BodyPart | undefined => {
  if (!raw) return undefined;
  const key = raw.toLowerCase().trim().replace(/[\s_]+/g, '-');
  return PART_ALIASES[key] ?? PART_ALIASES[key.replace(/-/g, '')];
};

// Ellipse per body part (in the image's native 714 x 1818 space) that limits
// where the recolour applies. Soft-edged, so exact alignment isn't critical.
interface Region {
  part: BodyPart;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

const REGIONS: Region[] = [
  { part: 'head', cx: 357, cy: 250, rx: 115, ry: 135 },
  { part: 'torso', cx: 357, cy: 640, rx: 160, ry: 240 },
  { part: 'pelvis', cx: 357, cy: 1000, rx: 140, ry: 120 },
  { part: 'left-arm', cx: 235, cy: 770, rx: 70, ry: 320 },
  { part: 'right-arm', cx: 479, cy: 770, rx: 70, ry: 320 },
  { part: 'left-hand', cx: 210, cy: 1140, rx: 60, ry: 65 },
  { part: 'right-hand', cx: 504, cy: 1140, rx: 60, ry: 65 },
  { part: 'left-leg', cx: 305, cy: 1400, rx: 80, ry: 360 },
  { part: 'right-leg', cx: 409, cy: 1400, rx: 80, ry: 360 },
  { part: 'left-foot', cx: 300, cy: 1780, rx: 75, ry: 55 },
  { part: 'right-foot', cx: 414, cy: 1780, rx: 75, ry: 55 },
];

// severity 0-100 -> red tint (leans redder as it gets worse)
const severityRed = (severity: number) => {
  if (severity >= 66) return 'rgb(255, 0, 40)';
  if (severity >= 33) return 'rgb(255, 55, 30)';
  return 'rgb(255, 105, 40)';
};

const pct = (n: number, base: number) => (n / base) * 100;

// mask that limits a layer to the man's lines: the image's own alpha channel
const lineMask: React.CSSProperties = {
  WebkitMaskImage: `url(${MAN_SRC})`,
  WebkitMaskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskImage: `url(${MAN_SRC})`,
  maskSize: '100% 100%',
  maskRepeat: 'no-repeat',
};

interface Props {
  injuries?: Injury[];
}

const BodyFigure: React.FC<Props> = ({ injuries }) => {
  // worst severity per part so the colour reflects the most serious wound there
  const injuredMap = useMemo(() => {
    const map: Partial<Record<BodyPart, number>> = {};
    for (const injury of injuries ?? []) {
      const part = normalizePart(injury.bodyPart);
      if (!part) continue;
      const severity = typeof injury.severity === 'number' ? injury.severity : 100;
      map[part] = Math.max(map[part] ?? 0, severity);
    }
    return map;
  }, [injuries]);

  return (
    <div className="health-figure">
      {/* base man image — never modified, so the figure stays 1:1 */}
      <img className="health-figure-img" src={MAN_SRC} alt="" />

      {/* Recolour layers: the man image is reused as a CSS mask, so a solid
          colour behind it renders as the man's own lines in that colour.
          Each layer is additionally masked to a soft ellipse over one body
          part — the lines inside that region turn red, fading back to green
          at the edges. The base image is untouched (still 1:1). */}
      {REGIONS.map((r) => {
        const severity = injuredMap[r.part];
        const injured = severity != null;
        const color = injured ? severityRed(severity!) : 'transparent';

        const regionGradient = `radial-gradient(${pct(r.rx, IMG_W)}% ${pct(r.ry, IMG_H)}% at ${pct(
          r.cx,
          IMG_W
        )}% ${pct(r.cy, IMG_H)}%, black 60%, transparent 100%)`;

        return (
          <div
            key={r.part}
            data-part={r.part}
            className="health-figure-recolor"
            style={{ filter: injured ? `drop-shadow(0 0 12px ${color})` : 'none' }}
          >
            <div style={{ position: 'absolute', inset: 0, ...lineMask }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: color,
                  opacity: injured ? 1 : 0,
                  WebkitMaskImage: regionGradient,
                  WebkitMaskRepeat: 'no-repeat',
                  maskImage: regionGradient,
                  maskRepeat: 'no-repeat',
                  transition: 'background-color 0.3s ease, opacity 0.3s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BodyFigure;
