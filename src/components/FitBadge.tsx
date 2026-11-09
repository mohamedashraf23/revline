import type { FitStatus } from "@/lib/types";

/**
 * The four fitment states, kept visually distinct.
 *
 * `null` renders nothing: no vehicle was selected, so the part's fitment was
 * never evaluated, and showing a grey "unknown" pill would imply we checked.
 * "partial" is the one worth spelling out — the part is right for the car but
 * wrong for the year, which is a different shopping decision from "no".
 */
const LABELS: Record<FitStatus, { text: string; className: string }> = {
  universal: { text: "Universal fit", className: "fit fit--universal" },
  fits: { text: "Fits your vehicle", className: "fit fit--yes" },
  partial: { text: "Wrong year for your car", className: "fit fit--partial" },
  no: { text: "Does not fit", className: "fit fit--no" },
};

export function FitBadge({
  status,
  vehicleLabel,
  compact = false,
}: {
  status: FitStatus | null;
  vehicleLabel?: string | null;
  compact?: boolean;
}) {
  if (!status) return null;
  const { text, className } = LABELS[status];

  return (
    <span className={`${className}${compact ? " fit--compact" : ""}`}>
      <span aria-hidden className="fit__dot" />
      {compact ? text : vehicleLabel && status === "fits" ? `Fits your ${vehicleLabel}` : text}
    </span>
  );
}
