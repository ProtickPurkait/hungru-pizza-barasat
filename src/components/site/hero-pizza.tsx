"use client";

import { animate, motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useId, useRef, type RefObject } from "react";
import { PizzaGraphic } from "@/components/ui/food-art";

/**
 * Signature interaction: a slice pulls away from the pizza on load, and the cheese
 * stretches (and finally snaps) as you scroll. Tap the pizza to tug the slice.
 * Everything is one SVG driven by motion values, animating transforms and path data only.
 */

const C = 200; // centre of the pizza in SVG units
const R = 182; // pizza radius
const S = R / 93; // scale of the 200×200 PizzaGraphic (radius ≈ 93)
const PHI = (157.5 * Math.PI) / 180; // slice direction (between two cut lines)
const HALF = (22.5 * Math.PI) / 180; // half slice angle (8 slices)
const INTRO_PULL = 30;

const pt = (angle: number, radius: number) => [C + Math.cos(angle) * radius, C + Math.sin(angle) * radius] as const;
const f = (n: number) => n.toFixed(1);

function wedgePath(extra = 8) {
  const [x1, y1] = pt(PHI - HALF, R + extra);
  const [x2, y2] = pt(PHI + HALF, R + extra);
  return `M${C} ${C} L${f(x1)} ${f(y1)} A${R + extra} ${R + extra} 0 0 1 ${f(x2)} ${f(y2)} Z`;
}
function bodyPath(extra = 8) {
  const [x1, y1] = pt(PHI + HALF, R + extra);
  const [x2, y2] = pt(PHI - HALF, R + extra);
  return `M${C} ${C} L${f(x1)} ${f(y1)} A${R + extra} ${R + extra} 0 1 1 ${f(x2)} ${f(y2)} Z`;
}

type Strand = { side: -1 | 1; r: number; width: number; snapAt: number; sag: number };
const STRANDS: Strand[] = [
  { side: -1, r: 26, width: 9, snapAt: 118, sag: 0.42 },
  { side: -1, r: 64, width: 6.5, snapAt: 96, sag: 0.3 },
  { side: -1, r: 110, width: 5, snapAt: 80, sag: 0.24 },
  { side: 1, r: 34, width: 8, snapAt: 108, sag: 0.38 },
  { side: 1, r: 80, width: 5.5, snapAt: 88, sag: 0.28 },
  { side: 1, r: 128, width: 4, snapAt: 72, sag: 0.2 },
  { side: 1, r: 8, width: 12, snapAt: 140, sag: 0.5 },
];

function strandGeometry(strand: Strand, pull: number) {
  // Anchor on the pizza's cut edge, and the same point on the slice after it moved.
  const angle = PHI + strand.side * HALF * 0.86;
  const [ax, ay] = pt(angle, strand.r);
  const bx = ax + Math.cos(PHI) * pull;
  const by = ay + Math.sin(PHI) * pull;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2 + pull * strand.sag; // gravity sag
  const progress = Math.min(1, pull / strand.snapAt);
  const snapped = pull > strand.snapAt;
  return { ax, ay, bx, by, mx, my, progress, snapped };
}

function useStrand(strand: Strand, pull: MotionValue<number>) {
  const d = useTransform(pull, (p) => {
    const g = strandGeometry(strand, p);
    if (g.snapped) {
      // After snapping, leave two short drips hanging from each side.
      const drip = 10 + (p - strand.snapAt) * 0.15;
      return `M${f(g.ax)} ${f(g.ay)} Q${f(g.ax + 3)} ${f(g.ay + drip * 0.6)} ${f(g.ax + 1)} ${f(g.ay + Math.min(drip, 26))} M${f(g.bx)} ${f(g.by)} Q${f(g.bx - 3)} ${f(g.by + drip * 0.6)} ${f(g.bx - 1)} ${f(g.by + Math.min(drip, 22))}`;
    }
    return `M${f(g.ax)} ${f(g.ay)} Q${f(g.mx)} ${f(g.my)} ${f(g.bx)} ${f(g.by)}`;
  });
  const width = useTransform(pull, (p) => {
    const g = strandGeometry(strand, p);
    return g.snapped ? strand.width * 0.55 : Math.max(1.4, strand.width * (1 - g.progress * 0.8));
  });
  const opacity = useTransform(pull, (p) => {
    if (p < 3) return 0;
    const g = strandGeometry(strand, p);
    return g.snapped ? Math.max(0, 1 - (p - strand.snapAt) / 60) : 1;
  });
  return { d, width, opacity };
}

function CheeseStrand({ strand, pull }: { strand: Strand; pull: MotionValue<number> }) {
  const { d, width, opacity } = useStrand(strand, pull);
  const outline = useTransform(width, (w) => w + 2);
  const highlight = useTransform(width, (w) => Math.max(0.6, w * 0.3));
  return (
    <motion.g style={{ opacity }}>
      <motion.path d={d} stroke="#f7b733" strokeWidth={outline} strokeLinecap="round" fill="none" />
      <motion.path d={d} stroke="#ffd966" strokeWidth={width} strokeLinecap="round" fill="none" />
      <motion.path d={d} stroke="#fff3b8" strokeWidth={highlight} strokeLinecap="round" fill="none" opacity={0.8} />
    </motion.g>
  );
}

export function HeroPizza({ scrollTarget, className }: { scrollTarget: RefObject<HTMLElement | null>; className?: string }) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const intro = useMotionValue(reduce ? INTRO_PULL : 0);
  const tug = useMotionValue(0);
  const wobble = useMotionValue(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const { scrollYProgress } = useScroll({ target: scrollTarget, offset: ["start start", "end start"] });
  const scrollPull = useTransform(scrollYProgress, [0, 0.75], [0, reduce ? 0 : 150]);
  const pull = useTransform(() => intro.get() + tug.get() + scrollPull.get());
  const sliceX = useTransform(pull, (p) => Math.cos(PHI) * p);
  const sliceY = useTransform(pull, (p) => Math.sin(PHI) * p);
  const sliceRotate = useTransform(pull, (p) => Math.min(p, 120) * -0.06);
  const pizzaRotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 38]);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(intro, INTRO_PULL, { delay: 0.9, type: "spring", stiffness: 55, damping: 9, mass: 1 });
    const idle = animate(wobble, [0, 1, 0], { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 });
    return () => {
      controls.stop();
      idle.stop();
    };
  }, [intro, wobble, reduce]);

  const idleRotate = useTransform(wobble, [0, 1], [-3, 3]);
  const totalRotate = useTransform(() => pizzaRotate.get() + idleRotate.get());

  const tugSlice = () => {
    if (reduce) return;
    animate(tug, [0, 46, 0], { duration: 1.4, times: [0, 0.35, 1], ease: ["easeOut", "backOut"] });
  };

  return (
    <div className={className}>
      <motion.svg
        ref={svgRef}
        viewBox="-40 -40 480 480"
        role="img"
        aria-label="Illustration of a pizza with a slice being pulled away, stretching the melted cheese"
        className="h-full w-full cursor-grab overflow-visible active:cursor-grabbing"
        onPointerDown={tugSlice}
        style={{ rotate: totalRotate }}
      >
        <defs>
          <clipPath id={`body-${uid}`}>
            <path d={bodyPath()} />
          </clipPath>
          <clipPath id={`slice-${uid}`}>
            <path d={wedgePath()} />
          </clipPath>
          <g id={`art-${uid}`}>
            <g transform={`translate(${C - 100 * S} ${C - 100 * S}) scale(${S})`}>
              <PizzaGraphic name="pepperoni mushroom olive basil margherita" />
            </g>
          </g>
          <radialGradient id={`gloss-${uid}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* The pizza with one slice missing, plus the saucy cut faces. */}
        <g clipPath={`url(#body-${uid})`}>
          <use href={`#art-${uid}`} />
          <circle cx={C} cy={C} r={R - 12} fill={`url(#gloss-${uid})`} />
        </g>
        <path
          d={`M${C} ${C} L${f(pt(PHI + HALF, R - 14)[0])} ${f(pt(PHI + HALF, R - 14)[1])}`}
          stroke="#9e2a13"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d={`M${C} ${C} L${f(pt(PHI - HALF, R - 14)[0])} ${f(pt(PHI - HALF, R - 14)[1])}`}
          stroke="#9e2a13"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.55"
        />

        {/* Cheese strands between the pizza and the slice. */}
        {STRANDS.map((strand, i) => (
          <CheeseStrand key={i} strand={strand} pull={pull} />
        ))}

        {/* The slice itself. */}
        <motion.g style={{ x: sliceX, y: sliceY, rotate: sliceRotate }}>
          <g clipPath={`url(#slice-${uid})`} filter="drop-shadow(0 10px 12px rgb(0 0 0 / 0.35))">
            <use href={`#art-${uid}`} />
            <circle cx={C} cy={C} r={R - 12} fill={`url(#gloss-${uid})`} />
          </g>
        </motion.g>
      </motion.svg>
    </div>
  );
}
