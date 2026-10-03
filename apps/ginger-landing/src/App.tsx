import { Ginger } from "@lucaismyname/ginger";
import {
  Activity,
  ChartNoAxesColumn,
  CircleEllipsis,
  Code,
  Command,
  Copy,
  EyeIcon,
  Globe,
  Hammer,
  Link2,
  List,
  MonitorUp,
  Package,
  Palette,
  Shell,
} from "lucide-react";
import { Suspense, lazy } from "react";
import { LandingPlayerControls } from "./components/LandingPlayerControls";
import { PlayerErrorBoundary } from "./components/PlayerErrorBoundary";
import { SectionLabel } from "./components/SectionLabel";
import { ThemeToggle } from "./components/ThemeToggle";
import {
  NPM_CMD,
  NPM_URL,
  PERSONAL_WEBSITE_URL,
  REPO_URL,
  TOOLTIP_EXAMPLE_SNIPPET,
} from "./data/constants";
import { LANDING_TRACKS } from "./data/tracks";
import { useCopyFeedback } from "./hooks/useCopyFeedback";

const CodeTooltipLazy = lazy(async () => {
  const m = await import("./components/CodeTooltip");
  return { default: m.CodeTooltip };
});

export function App() {
  const installCopy = useCopyFeedback();
  const tooltipCopy = useCopyFeedback();

  return (
    <div className="relative flex min-h-screen w-full flex-col px-6 py-6 md:items-start md:justify-center md:py-16 sm:px-10 lg:px-16">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <ThemeToggle />
      <output id="install-copy-status" aria-live="polite" className="sr-only">
        {installCopy.label === "Copy" ? "" : `Install command ${installCopy.label.toLowerCase()}.`}
      </output>
      <output id="tooltip-copy-status" aria-live="polite" className="sr-only">
        {tooltipCopy.label === "Copy" ? "" : `Tooltip example ${tooltipCopy.label.toLowerCase()}.`}
      </output>

      <main id="main-content" className="mx-auto w-full max-w-2xl text-left">
        <section className="flex flex-col items-start justify-start">
          {/* Title with hover code tooltip */}
          <div className="group relative inline-flex flex-col items-start rounded-sm md:-ml-9">
            <h1 className="font-pixel text-3xl font-normal text-zinc-300 sm:text-5xl dark:text-zinc-700">
              &lt;
              <span className="font-mono font-bold text-orange-600 dark:text-orange-500">
                Ginger
              </span>{" "}
              /&gt;
            </h1>
            <span className="sr-only">
              Hover the title to preview a Quick Start code example in a tooltip.
            </span>
            <Suspense fallback={null}>
              <CodeTooltipLazy
                tooltipCopyLabel={tooltipCopy.label}
                onCopy={() => void tooltipCopy.copy(TOOLTIP_EXAMPLE_SNIPPET)}
              />
            </Suspense>
          </div>

          {/* Tagline */}
          <p className="mt-4 text-balance text-base leading-relaxed text-zinc-600 md:-mr-0 md:ml-0 dark:text-zinc-400 sm:text-lg">
            A headless React audio player primitive component{" "}
            <Code
              aria-hidden
              className="inline-block h-[0.95em] w-[0.95em] align-[-0.12em] text-zinc-400/70 dark:text-zinc-500/70"
            />
            . Build your own UI{" "}
            <Palette className="inline-block h-[0.95em] w-[0.95em] align-[-0.12em] text-zinc-400/70 dark:text-zinc-500/70" />{" "}
            with playlists{" "}
            <List
              aria-hidden
              className="inline-block h-[0.95em] w-[0.95em] align-[-0.12em] text-zinc-400/70 dark:text-zinc-500/70"
            />
            , keyboard shortcuts{" "}
            <Command
              aria-hidden
              className="inline-block h-[0.95em] w-[0.95em] align-[-0.12em] text-zinc-400/70 dark:text-zinc-500/70"
            />
            , remote-control{" "}
            <MonitorUp
              aria-hidden
              className="inline-block h-[0.95em] w-[0.95em] align-[-0.12em] text-zinc-400/70 dark:text-zinc-500/70"
            />
            , spatial{" "}
            <Activity
              aria-hidden
              className="inline-block h-[0.95em] w-[0.95em] align-[-0.12em] text-zinc-400/70 dark:text-zinc-500/70"
            />
            , audio analyzers{" "}
            <ChartNoAxesColumn
              aria-hidden
              className="inline-block h-[0.95em] w-[0.95em] align-[-0.12em] text-zinc-400/70 dark:text-zinc-500/70"
            />
            , media sessions{" "}
            <Shell
              aria-hidden
              className="inline-block h-[0.95em] w-[0.95em] align-[-0.12em] text-zinc-400/70 dark:text-zinc-500/70"
            />
            , and much more{" "}
            <CircleEllipsis
              aria-hidden
              className="inline-block h-[0.95em] w-[0.95em] align-[-0.12em] text-zinc-400/70 dark:text-zinc-500/70"
            />{" "}
            — without fighting{" "}
            <Hammer
              aria-hidden
              className="inline-block h-[0.95em] w-[0.95em] align-[-0.12em] text-zinc-400/70 dark:text-zinc-500/70"
            />{" "}
            the DOM{" "}
            <Globe
              aria-hidden
              className="inline-block h-[0.95em] w-[0.95em] align-[-0.12em] text-zinc-400/70 dark:text-zinc-500/70"
            />{" "}
            inside the library{" "}
            <Package
              aria-hidden
              className="inline-block h-[0.95em] w-[0.95em] align-[-0.12em] text-zinc-400/70 dark:text-zinc-500/70"
            />
            .
          </p>

          {/* Live player example */}
          <div className="mt-8 w-full max-w-full">
            <SectionLabel icon={EyeIcon}>Example</SectionLabel>
            <PlayerErrorBoundary>
              <Ginger.Provider initialTracks={LANDING_TRACKS}>
                <Ginger.Player className="hidden" />
                <LandingPlayerControls />
              </Ginger.Provider>
            </PlayerErrorBoundary>
          </div>

          {/* Install + Links */}
          <section className="items-start justify-start gap-6 md:flex md:w-full md:flex-row">
            <div className="mt-8 w-full max-w-full flex-1 grow-1">
              <SectionLabel icon={Package}>Install</SectionLabel>
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100/80 py-2 pl-4 pr-2 dark:border-zinc-600/60 dark:bg-transparent">
                <pre className="min-w-0 w-full flex-1 overflow-x-hidden whitespace-nowrap font-mono text-base text-zinc-900 dark:text-zinc-100">
                  <code className="font-mono whitespace-nowrap">{NPM_CMD}</code>
                </pre>
                <button
                  aria-describedby="install-copy-status"
                  aria-label="Copy install command"
                  className="rounded-md border border-zinc-300/70 bg-zinc-50 p-1.5 text-xs text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                  onClick={() => void installCopy.copy(NPM_CMD)}
                  type="button"
                >
                  <Copy className="h-[14px] w-[14px]" aria-hidden />
                </button>
              </div>
            </div>

            <div className="mt-8 text-zinc-600 dark:text-zinc-400">
              <SectionLabel icon={Globe}>Links</SectionLabel>
              <section className="flex flex-row items-center justify-start gap-0">
                <a
                  href={NPM_URL}
                  aria-label="Open NPM package"
                  title="NPM"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg rounded-br-none rounded-tr-none border border-zinc-300/70 bg-zinc-50/90 text-zinc-950 transition-colors hover:border-zinc-500 hover:bg-zinc-100/80 dark:border-zinc-700/80 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/60"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Package className="h-4 w-4" aria-hidden />
                </a>
                <a
                  href={REPO_URL}
                  aria-label="Open GitHub repository"
                  title="GitHub"
                  className="inline-flex h-11 w-11 items-center justify-center border border-zinc-300/70 bg-zinc-50/90 text-zinc-950 transition-colors hover:border-zinc-500 hover:bg-zinc-100/80 dark:border-zinc-700/80 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/60"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Link2 className="h-4 w-4" aria-hidden />
                </a>
                <a
                  href={PERSONAL_WEBSITE_URL}
                  aria-label="Open personal website"
                  title="Website"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg rounded-bl-none rounded-tl-none border border-zinc-300/70 bg-zinc-50/90 text-zinc-950 transition-colors hover:border-zinc-500 hover:bg-zinc-100/80 dark:border-zinc-700/80 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/60"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Globe className="h-4 w-4" aria-hidden />
                </a>
              </section>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
