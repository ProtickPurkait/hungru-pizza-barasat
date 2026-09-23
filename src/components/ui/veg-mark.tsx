import { clsx } from "clsx";

/** Indian food-labelling style mark: green square + circle (veg) / red-brown square + triangle (non-veg). */
export function VegMark({ diet, className, size = 16 }: { diet: "veg" | "non_veg"; className?: string; size?: number }) {
  const veg = diet === "veg";
  const color = veg ? "var(--color-basil)" : "var(--color-meat)";
  return (
    <span
      role="img"
      aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
      title={veg ? "Vegetarian" : "Non-vegetarian"}
      className={clsx("inline-flex shrink-0 items-center justify-center rounded-[3px] border-2 bg-white", className)}
      style={{ width: size, height: size, borderColor: color }}
    >
      {veg ? (
        <span className="rounded-full" style={{ width: size * 0.45, height: size * 0.45, background: color }} />
      ) : (
        <span
          style={{
            width: 0,
            height: 0,
            borderLeft: `${size * 0.26}px solid transparent`,
            borderRight: `${size * 0.26}px solid transparent`,
            borderBottom: `${size * 0.45}px solid ${color}`,
          }}
        />
      )}
    </span>
  );
}
