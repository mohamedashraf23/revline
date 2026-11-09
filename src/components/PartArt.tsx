/**
 * Deterministic SVG artwork, keyed off the SKU.
 *
 * There is no product photography for 859 generated SKUs, and eight identical
 * grey "product photo" boxes in a row makes a grid unreadable. This derives a
 * hue and a geometric motif from the SKU, so every part looks like itself and
 * the same part always looks the same — on the server and in the browser, with
 * no hydration mismatch and no network request.
 */

const MOTIFS = ["disc", "canister", "coil", "pipe", "cell", "blade"] as const;
type Motif = (typeof MOTIFS)[number];

/** Motifs that actually suit the category; the rest fall back to the hash. */
const CATEGORY_MOTIF: Record<string, Motif> = {
  Brakes: "disc",
  "Filters & Fluids": "canister",
  "Batteries & Electrical": "cell",
  "Exhaust Systems": "pipe",
  "Turbo & Forced Induction": "coil",
  "Suspension & Steering": "coil",
  "Engine & Cooling": "canister",
  "Drivetrain & Clutch": "disc",
  "Wheels & Tyres": "disc",
  Lighting: "cell",
  "Interior & Cabin": "blade",
  "Workshop & Tools": "blade",
  "Body & Exterior": "pipe",
};

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function PartArt({
  sku,
  category,
  className,
}: {
  sku: string;
  category: string;
  className?: string;
}) {
  const h = hash(sku);
  const hue = h % 360;
  const motif: Motif = CATEGORY_MOTIF[category] ?? MOTIFS[h % MOTIFS.length];
  const rotation = (h >> 3) % 40 - 20;

  const base = `hsl(${hue} 42% 62%)`;
  const dark = `hsl(${hue} 46% 34%)`;
  const light = `hsl(${hue} 55% 78%)`;
  const wash = `hsl(${hue} 30% 94%)`;

  return (
    <svg
      viewBox="0 0 160 120"
      className={className}
      role="img"
      aria-label={`${category} part illustration`}
      // "slice" rather than "meet": the card art boxes are wider than this 4:3
      // viewBox, and letterboxing would show the placeholder hatch at the sides.
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="160" height="120" fill={wash} />
      <g transform={`rotate(${rotation} 80 60)`}>
        {motif === "disc" && (
          <>
            <circle cx="80" cy="60" r="36" fill={base} />
            <circle cx="80" cy="60" r="26" fill="none" stroke={dark} strokeWidth="3" />
            <circle cx="80" cy="60" r="11" fill={wash} stroke={dark} strokeWidth="2.5" />
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <line
                key={angle}
                x1="80"
                y1="34"
                x2="80"
                y2="42"
                stroke={light}
                strokeWidth="3.5"
                strokeLinecap="round"
                transform={`rotate(${angle} 80 60)`}
              />
            ))}
          </>
        )}

        {motif === "canister" && (
          <>
            <rect x="56" y="30" width="48" height="60" rx="8" fill={base} />
            <rect x="56" y="30" width="48" height="12" rx="6" fill={dark} />
            <rect x="66" y="52" width="28" height="4" rx="2" fill={light} />
            <rect x="66" y="62" width="28" height="4" rx="2" fill={light} />
            <rect x="66" y="72" width="28" height="4" rx="2" fill={light} />
          </>
        )}

        {motif === "coil" && (
          <>
            <rect x="74" y="24" width="12" height="72" rx="6" fill={dark} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <ellipse
                key={i}
                cx="80"
                cy={34 + i * 11}
                rx="24"
                ry="7"
                fill="none"
                stroke={base}
                strokeWidth="6"
              />
            ))}
          </>
        )}

        {motif === "pipe" && (
          <>
            <path
              d="M24 78 H72 Q96 78 96 58 Q96 40 118 40 H140"
              fill="none"
              stroke={base}
              strokeWidth="16"
              strokeLinecap="round"
            />
            <circle cx="140" cy="40" r="12" fill={dark} />
            <circle cx="140" cy="40" r="6" fill={wash} />
          </>
        )}

        {motif === "cell" && (
          <>
            <rect x="44" y="36" width="72" height="50" rx="6" fill={base} />
            <rect x="56" y="26" width="14" height="12" rx="3" fill={dark} />
            <rect x="92" y="26" width="14" height="12" rx="3" fill={dark} />
            <path
              d="M74 48 L68 62 H80 L74 76 L90 58 H78 L86 48 Z"
              fill={wash}
              stroke={dark}
              strokeWidth="1.5"
            />
          </>
        )}

        {motif === "blade" && (
          <>
            <path d="M28 72 Q80 50 132 44" fill="none" stroke={dark} strokeWidth="7" strokeLinecap="round" />
            <path d="M30 80 Q80 58 130 52" fill="none" stroke={base} strokeWidth="11" strokeLinecap="round" />
            <rect x="60" y="60" width="18" height="10" rx="3" fill={light} transform="rotate(-12 69 65)" />
          </>
        )}
      </g>
    </svg>
  );
}
