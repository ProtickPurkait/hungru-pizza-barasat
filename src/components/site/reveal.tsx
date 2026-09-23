import { clsx } from "clsx";
import type { ElementType, ReactNode } from "react";

/**
 * Marks content to fade/slide in as it scrolls into view (driven by <RevealManager/>).
 * Server-rendered and visible without JavaScript; no per-element client code.
 */
export function Reveal({
  as: Tag = "div",
  children,
  className,
  index = 0,
  ...rest
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  index?: number;
} & Record<string, unknown>) {
  return (
    <Tag className={clsx("reveal", className)} style={{ ["--i" as string]: index }} {...rest}>
      {children}
    </Tag>
  );
}
