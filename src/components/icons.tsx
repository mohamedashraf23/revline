/**
 * Inlined icons — tree-shaken SVG, no runtime dependency.
 *
 * Sources, all permissive (see "Icon licences" in the README):
 *   Lucide     — ISC        — https://lucide.dev
 *   IconPark   — Apache 2.0 — https://github.com/bytedance/IconPark
 *   Tabler     — MIT        — https://tabler.io/icons
 *
 * Mixing sets only works because all three draw on a square grid with a 1:12
 * stroke-to-grid ratio (Lucide/Tabler 2 on 24, IconPark 4 on 48), so they carry
 * identical optical weight once normalised. `iconAttrs` derives the stroke from
 * the grid to enforce that — pass the icon's native grid rather than rescaling
 * path data by hand.
 */

type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

function iconAttrs({ size = 24, strokeWidth, className }: IconProps, grid = 24) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: `0 0 ${grid} ${grid}`,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth ?? grid / 12,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
    focusable: false,
  };
}

/** lucide.dev/icons/shopping-cart */
export function ShoppingCartIcon(props: IconProps) {
  return (
    <svg {...iconAttrs(props)}>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

/* ------------------------------------------------------- category glyphs */

/**
 * IconPark Solid "brake-pads" (Apache 2.0). Native 48 grid, so the stroke comes
 * out at 4 — same optical weight as the Lucide icons beside it.
 */
export function BrakePadsIcon(props: IconProps) {
  return (
    <svg {...iconAttrs(props, 48)}>
      <path d="M24 40c8.837 0 16-7.163 16-16S32.837 8 24 8S8 15.163 8 24s7.163 16 16 16" />
      <path
        fill="currentColor"
        d="M24 28a4 4 0 1 0 0-8a4 4 0 0 0 0 8m0-24a20 20 0 0 1 20 20h-7.994A12.006 12.006 0 0 0 24 11.994z"
      />
    </svg>
  );
}

/** lucide.dev/icons/droplet */
export function DropletIcon(props: IconProps) {
  return (
    <svg {...iconAttrs(props)}>
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
    </svg>
  );
}

/** lucide.dev/icons/battery-charging */
export function BatteryChargingIcon(props: IconProps) {
  return (
    <svg {...iconAttrs(props)}>
      <path d="m11 7-3 5h4l-3 5" />
      <path d="M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935" />
      <path d="M22 14v-4" />
      <path d="M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936" />
    </svg>
  );
}

/** lucide.dev/icons/wind — flowing gas, the closest thing to an exhaust note. */
export function WindIcon(props: IconProps) {
  return (
    <svg {...iconAttrs(props)}>
      <path d="M12.8 19.6A2 2 0 1 0 14 16H2" />
      <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" />
      <path d="M9.8 4.4A2 2 0 1 1 11 8H2" />
    </svg>
  );
}

/** lucide.dev/icons/fan — the compressor wheel of a turbo. */
export function FanIcon(props: IconProps) {
  return (
    <svg {...iconAttrs(props)}>
      <path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z" />
      <path d="M12 12v.01" />
    </svg>
  );
}

/** Tabler "car-suspension" (MIT) — a coil-over: spring stack over the hub. */
export function CarSuspensionIcon(props: IconProps) {
  return (
    <svg {...iconAttrs(props)}>
      <path d="M12 22a3 3 0 1 1 0-6a3 3 0 0 1 0 6m0-6V4m1-2h-2v2h2zm-4 9l6-1m-6 4l6-1M9 8l6-1" />
    </svg>
  );
}

/**
 * Which glyph fronts each catalogue category. Keyed by the category id the API
 * returns; anything unmapped (a category added later) falls back to the wrench,
 * so the grid never renders a hole.
 */
export const CATEGORY_ICONS: Record<string, (props: IconProps) => React.JSX.Element> = {
  Brakes: BrakePadsIcon,
  "Filters & Fluids": DropletIcon,
  "Batteries & Electrical": BatteryChargingIcon,
  "Exhaust Systems": WindIcon,
  "Turbo & Forced Induction": FanIcon,
  "Suspension & Steering": CarSuspensionIcon,
};

/** lucide.dev/icons/wrench — fallback for unmapped categories. */
export function WrenchIcon(props: IconProps) {
  return (
    <svg {...iconAttrs(props)}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />
    </svg>
  );
}

export const categoryIcon = (id: string) => CATEGORY_ICONS[id] ?? WrenchIcon;
