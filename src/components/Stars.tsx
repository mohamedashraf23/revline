/**
 * Five stars with a clipped overlay for the fractional part, so 4.3 reads as
 * 4.3 rather than rounding to 4. The numeric value is in the aria-label; the
 * stars themselves are decorative.
 */
export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  const clamped = Math.max(0, Math.min(5, rating));
  const percent = (clamped / 5) * 100;

  return (
    <span
      className="stars"
      role="img"
      aria-label={`${clamped.toFixed(1)} out of 5`}
      style={{ fontSize: size }}
    >
      <span className="stars__track" aria-hidden>
        ★★★★★
      </span>
      <span className="stars__fill" aria-hidden style={{ width: `${percent}%` }}>
        ★★★★★
      </span>
    </span>
  );
}
