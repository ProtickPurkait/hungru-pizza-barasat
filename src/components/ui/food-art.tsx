/**
 * Deterministic illustrated food art (SVG). Used whenever a menu item or offer has no photo.
 * These are clearly illustrations, never passed off as photos of Hungru's food.
 */
import type { SVGProps } from "react";

export type ArtKind = "pizza" | "drink" | "side" | "combo" | "dessert";

type Topping =
  | "pepperoni"
  | "mushroom"
  | "olive"
  | "capsicum"
  | "onion"
  | "paneer"
  | "chicken"
  | "corn"
  | "jalapeno"
  | "basil"
  | "tomato";

const TOPPING_WORDS: [RegExp, Topping[]][] = [
  [/pepperoni|salami/, ["pepperoni"]],
  [/mushroom/, ["mushroom"]],
  [/olive/, ["olive"]],
  [/capsicum|pepper(?!oni)|veggie|veg supreme|farm/, ["capsicum"]],
  [/onion|farm|supreme/, ["onion"]],
  [/paneer/, ["paneer", "capsicum", "onion"]],
  [/chicken|tikka|bbq|keema|wings/, ["chicken"]],
  [/corn|farm/, ["corn"]],
  [/jalap|spicy|peri|fiery|hot/, ["jalapeno"]],
  [/margherita|margarita|classic|cheese/, ["basil", "tomato"]],
  [/tomato/, ["tomato"]],
  [/supreme|loaded|mexican|deluxe/, ["olive", "jalapeno", "corn"]],
  [/mushroom|farm/, ["mushroom"]],
];

export function detectArtKind(name: string, category = ""): ArtKind {
  const text = `${name} ${category}`.toLowerCase();
  if (/combo|meal|duo|family|party|deal/.test(text)) return "combo";
  if (/cola|coke|pepsi|drink|beverage|coffee|shake|soda|juice|lassi|mojito|lemon|water|tea|sprite|thums|fanta/.test(text)) return "drink";
  if (/cake|brownie|dessert|sweet|ice cream|choco lava|lava/.test(text)) return "dessert";
  if (/fries|bread|garlic|side|wings|dip|nugget|pasta|taco|wrap|potato|stick/.test(text) && !/pizza/.test(text)) return "side";
  return "pizza";
}

function toppingsFor(name: string): Topping[] {
  const text = name.toLowerCase();
  const found = new Set<Topping>();
  for (const [pattern, toppings] of TOPPING_WORDS) if (pattern.test(text)) toppings.forEach((t) => found.add(t));
  if (found.size === 0) ["basil", "tomato"].forEach((t) => found.add(t as Topping));
  return [...found].slice(0, 4);
}

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Wobbly closed blob around (cx, cy). */
function blobPath(rand: () => number, cx: number, cy: number, radius: number, wobble: number, points = 14) {
  const pts = Array.from({ length: points }, (_, i) => {
    const angle = (i / points) * Math.PI * 2;
    const r = radius + (rand() - 0.5) * wobble;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  });
  let d = "";
  for (let i = 0; i < points; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % points];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    d += i === 0 ? `M${r1(mx)} ${r1(my)}` : "";
    const [nx, ny] = pts[(i + 1) % points];
    const [nnx, nny] = pts[(i + 2) % points];
    d += ` Q${r1(nx)} ${r1(ny)} ${r1((nx + nnx) / 2)} ${r1((ny + nny) / 2)}`;
  }
  return `${d}Z`;
}

function scatter(rand: () => number, count: number, maxRadius: number, minGap: number, taken: [number, number][]) {
  const out: [number, number][] = [];
  let attempts = 0;
  while (out.length < count && attempts < count * 40) {
    attempts++;
    const angle = rand() * Math.PI * 2;
    const dist = Math.sqrt(rand()) * maxRadius;
    const x = 100 + Math.cos(angle) * dist;
    const y = 100 + Math.sin(angle) * dist;
    if ([...taken, ...out].every(([ox, oy]) => (ox - x) ** 2 + (oy - y) ** 2 > minGap * minGap)) out.push([x, y]);
  }
  taken.push(...out);
  return out;
}

function ToppingShape({ kind, x, y, rot, blob }: { kind: Topping; x: number; y: number; rot: number; blob?: string }) {
  const t = `translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rot)})`;
  switch (kind) {
    case "pepperoni":
      return (
        <g transform={t}>
          <circle r="11" fill="#b3261e" />
          <circle r="11" fill="none" stroke="#8e1b14" strokeWidth="1.5" />
          <circle cx="-3" cy="-2" r="1.8" fill="#e0563f" />
          <circle cx="4" cy="3" r="1.4" fill="#e0563f" />
          <circle cx="2" cy="-5" r="1.1" fill="#7a1510" />
        </g>
      );
    case "mushroom":
      return (
        <g transform={t}>
          <path d="M-9 0 C-9 -9 9 -9 9 0 Z" fill="#efe0cc" stroke="#9b7652" strokeWidth="1.4" />
          <path d="M-3 0 L-3 7 Q0 9 3 7 L3 0 Z" fill="#e6d2b8" stroke="#9b7652" strokeWidth="1.4" />
        </g>
      );
    case "olive":
      return (
        <g transform={t}>
          <ellipse rx="5.5" ry="4.8" fill="none" stroke="#1f1b1a" strokeWidth="3.2" />
        </g>
      );
    case "capsicum":
      return (
        <g transform={t}>
          <path d="M-9 3 Q0 -9 9 3" fill="none" stroke="#2f8f3a" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "onion":
      return (
        <g transform={t}>
          <path d="M-8 4 Q0 -8 8 4" fill="none" stroke="#a45bb0" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M-5 5 Q0 -3 5 5" fill="none" stroke="#c98bd1" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    case "paneer":
      return (
        <g transform={t}>
          <rect x="-6.5" y="-6.5" width="13" height="13" rx="2.5" fill="#fff6e6" stroke="#e07a3a" strokeWidth="2" />
          <path d="M-6 -2 L6 -4" stroke="#e8995c" strokeWidth="1.2" />
        </g>
      );
    case "chicken":
      return (
        <g transform={t}>
          <path d={blob} fill="#c7853f" stroke="#8f5a26" strokeWidth="1.2" />
          <path d="M-3 -1 L3 1" stroke="#e3a867" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      );
    case "corn":
      return (
        <g transform={t}>
          <ellipse rx="3.4" ry="3" fill="#f7c62f" stroke="#d99f14" strokeWidth="0.8" />
        </g>
      );
    case "jalapeno":
      return (
        <g transform={t}>
          <circle r="6.5" fill="#4d9a37" />
          <circle r="4" fill="#b9dd8a" />
          <circle cx="-1" cy="1" r="0.9" fill="#f4f0c8" />
          <circle cx="1.5" cy="-1" r="0.9" fill="#f4f0c8" />
        </g>
      );
    case "basil":
      return (
        <g transform={t}>
          <path d="M0 -10 Q9 -3 0 10 Q-9 -3 0 -10 Z" fill="#2f7d32" />
          <path d="M0 -8 L0 8" stroke="#56a85a" strokeWidth="1" />
        </g>
      );
    case "tomato":
      return (
        <g transform={t}>
          <circle r="9" fill="#e2482d" stroke="#b8311b" strokeWidth="1.5" />
          <circle r="5.5" fill="#f06d4f" />
          <circle cx="-2" cy="-1" r="1" fill="#ffd9a8" />
          <circle cx="2" cy="1.5" r="1" fill="#ffd9a8" />
        </g>
      );
  }
}

/** Top-down pizza drawn in a 200×200 box (radius ≈ 93 around 100,100). */
export function PizzaGraphic({ name }: { name: string }) {
  return <Pizza seed={hash(name)} name={name} />;
}

function Pizza({ seed, name }: { seed: number; name: string }) {
  const rand = rng(seed);
  const toppings = toppingsFor(name);
  const taken: [number, number][] = [];
  const perTopping = toppings.length === 1 ? 11 : toppings.length === 2 ? 7 : 5;
  const gap = toppings.includes("pepperoni") ? 16 : 13;
  const placed = toppings.flatMap((kind) =>
    scatter(rand, kind === "corn" ? perTopping + 4 : perTopping, 60, gap, taken).map(([x, y]) => ({
      kind,
      x,
      y,
      rot: rand() * 360,
      // Pre-computed here (not in the child) so renders stay deterministic.
      blob: kind === "chicken" ? blobPath(rand, 0, 0, 7, 4, 7) : undefined,
    })),
  );
  const specks = Array.from({ length: 26 }, () => [100 + (rand() - 0.5) * 140, 100 + (rand() - 0.5) * 140]).filter(
    ([x, y]) => (x - 100) ** 2 + (y - 100) ** 2 < 70 ** 2,
  );
  const browning = Array.from({ length: 9 }, () => {
    const angle = rand() * Math.PI * 2;
    const dist = 20 + rand() * 50;
    return [100 + Math.cos(angle) * dist, 100 + Math.sin(angle) * dist, 3 + rand() * 5];
  });
  return (
    <g>
      <circle cx="100" cy="104" r="93" fill="#000" opacity="0.18" />
      <circle cx="100" cy="100" r="93" fill="#d98b3a" />
      <circle cx="100" cy="100" r="93" fill="none" stroke="#b86a24" strokeWidth="2" />
      <circle cx="100" cy="100" r="86" fill="#eba95a" />
      <circle cx="100" cy="100" r="78" fill="#c9321c" />
      <path d={blobPath(rand, 100, 100, 73, 10, 16)} fill="#ffcf5c" />
      <path d={blobPath(rand, 100, 100, 62, 14, 12)} fill="#ffdf85" opacity="0.8" />
      {browning.map(([x, y, r], i) => (
        <circle key={i} cx={r1(x)} cy={r1(y)} r={r1(r)} fill="#f0a93c" opacity="0.55" />
      ))}
      {placed.map((p, i) => (
        <ToppingShape key={i} {...p} />
      ))}
      {specks.map(([x, y], i) => (
        <circle key={`s${i}`} cx={r1(x)} cy={r1(y)} r="0.9" fill="#335c2a" opacity="0.8" />
      ))}
      <g stroke="#7a3a12" strokeOpacity="0.18" strokeWidth="1.6">
        <line x1="100" y1="14" x2="100" y2="186" />
        <line x1="14" y1="100" x2="186" y2="100" />
        <line x1="39" y1="39" x2="161" y2="161" />
        <line x1="161" y1="39" x2="39" y2="161" />
      </g>
    </g>
  );
}

function Drink({ name }: { name: string }) {
  const text = name.toLowerCase();
  const liquid = /cola|coke|pepsi|thums/.test(text)
    ? "#3b1d12"
    : /coffee|shake|choco/.test(text)
      ? "#b07a4f"
      : /mojito|lemon|lime|sprite|soda|water/.test(text)
        ? "#bfe38a"
        : /lassi|milk/.test(text)
          ? "#fff4dc"
          : "#ff8a2a";
  return (
    <g>
      <ellipse cx="100" cy="182" rx="44" ry="7" fill="#000" opacity="0.18" />
      <path d="M126 20 L112 70" stroke="#e5311b" strokeWidth="7" strokeLinecap="round" />
      <path d="M126 20 L144 14" stroke="#e5311b" strokeWidth="7" strokeLinecap="round" />
      <path d="M58 52 L142 52 L132 178 Q100 186 68 178 Z" fill="#fff3df" opacity="0.5" stroke="#141110" strokeWidth="4" strokeLinejoin="round" />
      <path d="M62 78 L138 78 L131 172 Q100 179 69 172 Z" fill={liquid} />
      <ellipse cx="100" cy="78" rx="38" ry="5" fill="#fff" opacity="0.35" />
      <rect x="72" y="92" width="14" height="14" rx="3" fill="#fff" opacity="0.5" transform="rotate(-12 79 99)" />
      <rect x="104" y="110" width="12" height="12" rx="3" fill="#fff" opacity="0.4" transform="rotate(15 110 116)" />
      <path d="M76 60 L74 170" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      <path d="M58 52 L142 52" stroke="#141110" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

function Side({ name, seed }: { name: string; seed: number }) {
  const text = name.toLowerCase();
  const rand = rng(seed);
  if (/fries|potato|chips|wedges/.test(text)) {
    return (
      <g>
        <ellipse cx="100" cy="182" rx="50" ry="7" fill="#000" opacity="0.18" />
        {Array.from({ length: 9 }, (_, i) => {
          const x = 62 + i * 9.5;
          const h = 70 + rand() * 30;
          return (
            <rect key={i} x={r1(x)} y={r1(110 - h)} width="10" height={r1(h)} rx="2" fill="#ffc94a" stroke="#d99a1d" strokeWidth="1.5" transform={`rotate(${r1((rand() - 0.5) * 16)} ${r1(x + 5)} 110)`} />
          );
        })}
        <path d="M52 96 L148 96 L136 180 L64 180 Z" fill="#e5311b" stroke="#141110" strokeWidth="4" strokeLinejoin="round" />
        <path d="M78 128 Q100 146 122 128" fill="none" stroke="#fff3df" strokeWidth="6" strokeLinecap="round" />
      </g>
    );
  }
  if (/wing|drum|nugget|chicken/.test(text)) {
    return (
      <g>
        <ellipse cx="100" cy="170" rx="72" ry="16" fill="#000" opacity="0.15" />
        <ellipse cx="100" cy="150" rx="74" ry="22" fill="#fff3df" stroke="#141110" strokeWidth="4" />
        {[
          [70, 128, -20],
          [104, 118, 10],
          [132, 134, 30],
          [92, 146, -5],
        ].map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <path d="M-22 -12 Q-30 4 -14 14 Q8 20 16 4 Q20 -12 2 -18 Q-14 -22 -22 -12 Z" fill="#b2561f" stroke="#7a3510" strokeWidth="2" />
            <path d="M-12 -6 Q-2 -12 8 -6" fill="none" stroke="#e08a3c" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ))}
      </g>
    );
  }
  if (/dip/.test(text)) {
    return (
      <g>
        <ellipse cx="100" cy="160" rx="62" ry="14" fill="#000" opacity="0.15" />
        <path d="M40 100 Q100 190 160 100 Z" fill="#fff3df" stroke="#141110" strokeWidth="4" strokeLinejoin="round" />
        <ellipse cx="100" cy="100" rx="60" ry="16" fill="#ffd45a" stroke="#141110" strokeWidth="4" />
        <path d="M78 98 Q100 88 122 100" fill="none" stroke="#fff" strokeWidth="4" opacity="0.6" strokeLinecap="round" />
      </g>
    );
  }
  // Garlic bread (default side)
  return (
    <g>
      <ellipse cx="100" cy="170" rx="70" ry="12" fill="#000" opacity="0.15" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${60 + i * 38} ${100 + (i % 2) * 12}) rotate(${-14 + i * 12})`}>
          <path d="M-24 -40 Q0 -54 24 -40 L22 44 Q0 52 -22 44 Z" fill="#e8a24c" stroke="#9c5a1c" strokeWidth="3" strokeLinejoin="round" />
          <path d="M-17 -34 Q0 -44 17 -34 L16 38 Q0 44 -16 38 Z" fill="#ffe08a" />
          <circle cx="-6" cy="-10" r="2" fill="#3b7d32" />
          <circle cx="7" cy="6" r="2" fill="#3b7d32" />
          <circle cx="-4" cy="20" r="2" fill="#3b7d32" />
        </g>
      ))}
    </g>
  );
}

function Dessert() {
  return (
    <g>
      <ellipse cx="100" cy="172" rx="70" ry="12" fill="#000" opacity="0.15" />
      <ellipse cx="100" cy="160" rx="72" ry="18" fill="#fff3df" stroke="#141110" strokeWidth="4" />
      <path d="M58 90 Q100 70 142 90 L140 150 Q100 164 60 150 Z" fill="#4a2616" stroke="#2a130a" strokeWidth="3" />
      <ellipse cx="100" cy="90" rx="42" ry="12" fill="#6b3a22" />
      <path d="M84 92 Q88 118 80 136 Q92 130 96 104 Z" fill="#2a130a" />
      <circle cx="112" cy="84" r="6" fill="#e5311b" />
    </g>
  );
}

export function FoodArt({
  name,
  category,
  kind,
  className,
  ...rest
}: { name: string; category?: string; kind?: ArtKind; className?: string } & Omit<SVGProps<SVGSVGElement>, "name">) {
  const artKind = kind ?? detectArtKind(name, category);
  const seed = hash(name);
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={`Illustration of ${name}`} className={className} {...rest}>
      {artKind === "pizza" && <Pizza seed={seed} name={name} />}
      {artKind === "drink" && <Drink name={name} />}
      {artKind === "side" && <Side name={name} seed={seed} />}
      {artKind === "dessert" && <Dessert />}
      {artKind === "combo" && (
        <g>
          <g transform="translate(-14 10) scale(0.82)">
            <Pizza seed={seed} name={name} />
          </g>
          <g transform="translate(96 62) scale(0.55)">
            <Drink name="cola" />
          </g>
        </g>
      )}
    </svg>
  );
}
