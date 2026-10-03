import { Copy, Rocket } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import Prism from "prismjs";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { TOOLTIP_EXAMPLE_SNIPPET } from "../data/constants";

function useDocumentDarkClass() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : false,
  );

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return isDark;
}

export function CodeTooltip({
  tooltipCopyLabel,
  onCopy,
}: {
  tooltipCopyLabel: string;
  onCopy: () => void;
}) {
  const isDark = useDocumentDarkClass();
  const theme = isDark ? themes.vsDark : themes.github;

  return (
    <div
      className="pointer-events-none invisible absolute left-0 top-full z-20 w-[min(90vw,28rem)] pt-2.5 opacity-0 transition duration-150 ease-out motion-reduce:transition-none group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100"
      id="ginger-title-tooltip"
      role="tooltip"
    >
      <div className="absolute left-8 top-1 h-3 w-3 rotate-45 border-l border-t border-zinc-300 bg-zinc-100/95 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/95" />
      <div className="translate-y-1 rounded-lg border border-zinc-300 bg-zinc-50/75 p-3 shadow-xl shadow-black/20 backdrop-blur-sm transition duration-150 ease-out motion-reduce:translate-y-0 motion-reduce:transition-none group-hover:translate-y-0 group-focus-within:translate-y-0 dark:border-zinc-700 dark:bg-zinc-900/75">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-pixel text-[12px] tracking-wide text-black dark:text-white">
            <Rocket className="inline-block h-[0.95em] w-[0.95em] align-[-0.12em] text-orange-400/70 dark:text-orange-500/70" />{" "}
            Quick Start
          </p>
          <button
            aria-describedby="tooltip-copy-status"
            aria-label={`Copy tooltip example code (${tooltipCopyLabel})`}
            className="rounded-md border border-zinc-300/70 bg-zinc-50 p-1.5 text-xs text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
            onClick={onCopy}
            type="button"
          >
            <Copy className="h-[14px] w-[14px]" aria-hidden />
          </button>
        </div>
        <div className="overflow-x-auto rounded-md border border-zinc-300/80 bg-transparent px-3 py-2 text-left text-xs leading-relaxed dark:border-zinc-600/60">
          <Highlight code={TOOLTIP_EXAMPLE_SNIPPET} language="tsx" prism={Prism} theme={theme}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => {
              const preStyle: CSSProperties = {
                ...style,
                backgroundColor: "transparent",
                backgroundImage: "none",
              };
              return (
                <pre
                  className={`${className} m-0 select-text bg-transparent p-0 font-mono`}
                  style={preStyle}
                >
                  {tokens.map((line, i) => {
                    const lineProps = getLineProps({ line });
                    const lineStyle: CSSProperties = {
                      ...(lineProps.style as CSSProperties | undefined),
                      backgroundColor: "transparent",
                    };
                    return (
                      <div key={String(i)} {...lineProps} style={lineStyle}>
                        {line.map((token, key) => {
                          const tp = getTokenProps({ token });
                          const tokenStyle: CSSProperties = {
                            ...(tp.style as CSSProperties | undefined),
                            backgroundColor: "transparent",
                            backgroundImage: "none",
                          };
                          return (
                            <span key={String(key)} {...tp} style={tokenStyle}>
                              {tp.children}
                            </span>
                          );
                        })}
                      </div>
                    );
                  })}
                </pre>
              );
            }}
          </Highlight>
        </div>
      </div>
    </div>
  );
}
