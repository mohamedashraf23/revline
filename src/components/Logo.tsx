/**
 * Revline identity.
 *
 * The mark is a tachometer sweep with the needle buried in the redline — the
 * literal thing the brand is named after. Geometry is a 250° arc on a 32-unit
 * grid (centre 16,16 / radius 11), opening at the bottom like a real gauge:
 * the neutral dial runs 215°→35°, the redline picks it up for the final 70°.
 *
 * Two tones:
 *   "brand" — neutral dial + orange redline and needle (light backgrounds)
 *   "mono"  — everything inherits currentColor (dark footer, one-colour print,
 *             embroidery, faxed invoices)
 *
 * Strokes are deliberately heavy so the mark survives at 20px in the header.
 * Keep the 32 viewBox if you add lockups, or the weights stop matching.
 */

type Tone = "brand" | "mono";

interface MarkProps {
  size?: number;
  tone?: Tone;
  className?: string;
}

const DIAL = "M6.99 22.31A11 11 0 0 1 25.01 9.69";
const REDLINE = "M25.01 9.69A11 11 0 0 1 25.01 22.31";
const NEEDLE = "M16 16L24.41 14.21";

export function RevlineMark({ size = 34, tone = "brand", className }: MarkProps) {
  const dial = tone === "mono" ? "currentColor" : "var(--logo-dial)";
  const hot = tone === "mono" ? "currentColor" : "var(--logo-redline)";
  const dialOpacity = tone === "mono" ? 0.45 : 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        d={DIAL}
        stroke={dial}
        strokeOpacity={dialOpacity}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path d={REDLINE} stroke={hot} strokeWidth="3.2" strokeLinecap="round" />
      <path d={NEEDLE} stroke={hot} strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.5" fill={hot} />
    </svg>
  );
}

/** Mark + wordmark. The wordmark is Sora 800 to match the rest of the display type. */
export function RevlineLogo({
  size = 34,
  tone = "brand",
  className,
}: MarkProps) {
  return (
    <span className={`logo${className ? ` ${className}` : ""}`}>
      <RevlineMark size={size} tone={tone} />
      <span className="logo__word">REVLINE</span>
    </span>
  );
}
