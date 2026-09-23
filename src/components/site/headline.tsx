import { clsx } from "clsx";
import { Fragment } from "react";

/** Renders CMS headlines where *words in asterisks* get the accent treatment. */
export function Headline({
  text,
  className,
  accentClassName = "text-accent",
  wordClassName,
  wordStyle,
}: {
  text: string;
  className?: string;
  accentClassName?: string;
  wordClassName?: string;
  wordStyle?: (index: number) => React.CSSProperties;
}) {
  const tokens = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  let index = 0;
  return (
    <span className={className}>
      {tokens.map((token, i) => {
        const accent = token.startsWith("*") && token.endsWith("*");
        const words = (accent ? token.slice(1, -1) : token).split(/(\s+)/);
        return (
          <Fragment key={i}>
            {words.map((word, j) => {
              if (/^\s+$/.test(word)) return word;
              if (!word) return null;
              const current = index++;
              return (
                <span key={j} className={clsx("inline-block", wordClassName)} style={wordStyle?.(current)}>
                  <span className={clsx("inline-block", accent && accentClassName)}>{word}</span>
                </span>
              );
            })}
          </Fragment>
        );
      })}
    </span>
  );
}

export function stripHighlights(text: string) {
  return text.replace(/\*([^*]+)\*/g, "$1");
}
