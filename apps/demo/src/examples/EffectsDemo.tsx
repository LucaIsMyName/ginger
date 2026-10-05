import { Ginger, useGinger } from "@lucaismyname/ginger";
import {
  BUILTIN_EFFECT_TYPES,
  type BuiltinEffectType,
  type GingerEffectSpec,
  useGingerEffects,
} from "@lucaismyname/ginger/effects";
import { demoTracks } from "../fixtures";

const EFFECT_LABELS: Record<BuiltinEffectType, string> = {
  delay: "Delay",
  reverb: "Reverb",
  distortion: "Distortion",
  phaser: "Phaser",
  chorus: "Chorus",
  octaver: "Octaver",
};

const DEFAULT_SPECS: Record<BuiltinEffectType, GingerEffectSpec> = {
  delay: { type: "delay", enabled: true, mix: 0.3, time: 0.28, feedback: 0.35 },
  reverb: { type: "reverb", enabled: true, mix: 0.25, decay: 2.2 },
  distortion: { type: "distortion", enabled: true, mix: 0.25, amount: 0.4, oversample: "none" },
  phaser: {
    type: "phaser",
    enabled: true,
    mix: 0.3,
    rate: 0.5,
    depth: 600,
    stages: 4,
    feedback: 0.4,
  },
  chorus: {
    type: "chorus",
    enabled: true,
    mix: 0.25,
    rate: 1.2,
    depth: 0.004,
    delay: 0.03,
    voices: 2,
  },
  octaver: { type: "octaver", enabled: true, mix: 0.4, mode: "down", tone: 400 },
};

function readNumber(spec: GingerEffectSpec, key: string, fallback: number): number {
  const value = (spec as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readString(spec: GingerEffectSpec, key: string, fallback: string): string {
  const value = (spec as Record<string, unknown>)[key];
  return typeof value === "string" ? value : fallback;
}

function isBuiltin(type: string): type is BuiltinEffectType {
  return (BUILTIN_EFFECT_TYPES as readonly string[]).includes(type);
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between text-[11px] font-medium text-orange-800">
        <span>{label}</span>
        <span className="font-mono">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-orange-600"
      />
    </label>
  );
}

function EffectParams({
  spec,
  onPatch,
}: {
  spec: GingerEffectSpec;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const mix = readNumber(spec, "mix", 0.3);

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <Slider
        label="Dry / wet"
        min={0}
        max={1}
        step={0.01}
        value={mix}
        onChange={(value) => onPatch({ mix: value })}
        format={(value) => `${Math.round(value * 100)}% wet`}
      />

      {spec.type === "delay" ? (
        <>
          <Slider
            label="Time"
            min={0}
            max={1.5}
            step={0.01}
            value={readNumber(spec, "time", 0.28)}
            onChange={(value) => onPatch({ time: value })}
            format={(value) => `${value.toFixed(2)} s`}
          />
          <Slider
            label="Feedback"
            min={0}
            max={0.95}
            step={0.01}
            value={readNumber(spec, "feedback", 0.35)}
            onChange={(value) => onPatch({ feedback: value })}
            format={(value) => value.toFixed(2)}
          />
        </>
      ) : null}

      {spec.type === "reverb" ? (
        <Slider
          label="Decay"
          min={0.1}
          max={8}
          step={0.05}
          value={readNumber(spec, "decay", 2.2)}
          onChange={(value) => onPatch({ decay: value })}
          format={(value) => `${value.toFixed(2)} s`}
        />
      ) : null}

      {spec.type === "distortion" ? (
        <>
          <Slider
            label="Amount"
            min={0}
            max={1}
            step={0.01}
            value={readNumber(spec, "amount", 0.4)}
            onChange={(value) => onPatch({ amount: value })}
            format={(value) => value.toFixed(2)}
          />
          <label className="flex flex-col gap-1 text-[11px] font-medium text-orange-800">
            Oversample
            <select
              value={readString(spec, "oversample", "none")}
              onChange={(e) => onPatch({ oversample: e.target.value })}
              className="rounded-lg border border-orange-200 bg-white px-2 py-1.5 text-xs text-orange-900"
            >
              <option value="none">none</option>
              <option value="2x">2x</option>
              <option value="4x">4x</option>
            </select>
          </label>
        </>
      ) : null}

      {spec.type === "phaser" ? (
        <>
          <Slider
            label="Rate"
            min={0.05}
            max={8}
            step={0.05}
            value={readNumber(spec, "rate", 0.5)}
            onChange={(value) => onPatch({ rate: value })}
            format={(value) => `${value.toFixed(2)} Hz`}
          />
          <Slider
            label="Depth"
            min={20}
            max={2000}
            step={10}
            value={readNumber(spec, "depth", 600)}
            onChange={(value) => onPatch({ depth: value })}
            format={(value) => `${Math.round(value)} Hz`}
          />
          <Slider
            label="Stages"
            min={2}
            max={8}
            step={1}
            value={readNumber(spec, "stages", 4)}
            onChange={(value) => onPatch({ stages: Math.round(value) })}
            format={(value) => `${Math.round(value)}`}
          />
          <Slider
            label="Feedback"
            min={0}
            max={0.9}
            step={0.01}
            value={readNumber(spec, "feedback", 0.4)}
            onChange={(value) => onPatch({ feedback: value })}
            format={(value) => value.toFixed(2)}
          />
        </>
      ) : null}

      {spec.type === "chorus" ? (
        <>
          <Slider
            label="Rate"
            min={0.05}
            max={6}
            step={0.05}
            value={readNumber(spec, "rate", 1.2)}
            onChange={(value) => onPatch({ rate: value })}
            format={(value) => `${value.toFixed(2)} Hz`}
          />
          <Slider
            label="Depth"
            min={0.0005}
            max={0.02}
            step={0.0005}
            value={readNumber(spec, "depth", 0.004)}
            onChange={(value) => onPatch({ depth: value })}
            format={(value) => `${(value * 1000).toFixed(1)} ms`}
          />
          <Slider
            label="Delay"
            min={0.005}
            max={0.08}
            step={0.001}
            value={readNumber(spec, "delay", 0.03)}
            onChange={(value) => onPatch({ delay: value })}
            format={(value) => `${(value * 1000).toFixed(1)} ms`}
          />
          <Slider
            label="Voices"
            min={1}
            max={3}
            step={1}
            value={readNumber(spec, "voices", 2)}
            onChange={(value) => onPatch({ voices: Math.round(value) })}
            format={(value) => `${Math.round(value)}`}
          />
        </>
      ) : null}

      {spec.type === "octaver" ? (
        <>
          <Slider
            label="Tone"
            min={80}
            max={2000}
            step={10}
            value={readNumber(spec, "tone", 400)}
            onChange={(value) => onPatch({ tone: value })}
            format={(value) => `${Math.round(value)} Hz`}
          />
          <label className="flex flex-col gap-1 text-[11px] font-medium text-orange-800">
            Mode
            <select
              value={readString(spec, "mode", "down")}
              onChange={(e) => onPatch({ mode: e.target.value })}
              className="rounded-lg border border-orange-200 bg-white px-2 py-1.5 text-xs text-orange-900"
            >
              <option value="down">Down (octave)</option>
              <option value="up">Up (octave)</option>
              <option value="both">Both</option>
            </select>
          </label>
        </>
      ) : null}
    </div>
  );
}

function EffectsPanel() {
  const g = useGinger();
  const { chain, setChain, setEffect, setEffectEnabled, error } = useGingerEffects({
    enabled: true,
    chain: [],
  });

  function addEffect(type: BuiltinEffectType) {
    setChain([...chain, { ...DEFAULT_SPECS[type] }]);
  }

  function removeEffect(index: number) {
    setChain(chain.filter((_, i) => i !== index));
  }

  function moveEffect(index: number, direction: -1 | 1) {
    const next = [...chain];
    const swap = index + direction;
    if (swap < 0 || swap >= next.length) return;
    const current = next[index];
    const other = next[swap];
    if (!current || !other) return;
    next[index] = other;
    next[swap] = current;
    setChain(next);
  }

  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-5 shadow-sm ring-1 ring-orange-100">
      <div className="text-xs font-semibold uppercase tracking-wide text-orange-700">Effects</div>
      <p className="mt-2 text-sm leading-relaxed text-orange-900">
        Serial rack after EQ / spatial (
        <code className="rounded bg-white/80 px-1 font-mono text-[11px]">
          @lucaismyname/ginger/effects
        </code>
        ). Add as many as you want, including duplicates. Dry/wet is per effect.
      </p>

      {error ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Add effect">
        {BUILTIN_EFFECT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addEffect(type)}
            className="rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-medium text-orange-900 hover:bg-orange-100"
          >
            + {EFFECT_LABELS[type]}
          </button>
        ))}
        {chain.length > 0 ? (
          <button
            type="button"
            onClick={() => setChain([])}
            className="rounded-lg border border-orange-200 bg-orange-100/80 px-3 py-1.5 text-xs font-medium text-orange-800 hover:bg-orange-200"
          >
            Clear rack
          </button>
        ) : null}
      </div>

      {chain.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-orange-300 bg-white/60 px-4 py-6 text-center text-sm text-orange-800">
          No effects yet. Add delay, reverb, or anything else above — they run in order on the
          current track.
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {chain.map((spec, index) => {
            const id = spec.id ?? index;
            const label = isBuiltin(spec.type) ? EFFECT_LABELS[spec.type] : spec.type;
            const enabled = spec.enabled !== false;
            return (
              <li
                key={String(id)}
                className={`rounded-xl border bg-white/85 p-3 shadow-sm ${
                  enabled ? "border-orange-200/80" : "border-orange-100 opacity-70"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-orange-950">
                    {index + 1}. {label}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveEffect(index, -1)}
                      disabled={index === 0}
                      className="rounded-md border border-orange-200 px-2 py-1 text-[11px] text-orange-900 disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveEffect(index, 1)}
                      disabled={index === chain.length - 1}
                      className="rounded-md border border-orange-200 px-2 py-1 text-[11px] text-orange-900 disabled:opacity-40"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => setEffectEnabled(id, !enabled)}
                      className="rounded-md border border-orange-200 px-2 py-1 text-[11px] text-orange-900"
                    >
                      {enabled ? "Bypass" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEffect(index)}
                      className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <EffectParams spec={spec} onPatch={(patch) => setEffect(id, patch)} />
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-5 space-y-3 border-t border-orange-200/80 pt-4">
        <div className="flex items-center justify-between font-mono text-xs text-orange-800">
          <Ginger.Current.Elapsed />
          <span className="truncate text-[11px]">{g.currentTrack?.title}</span>
          <Ginger.Current.Duration />
        </div>
        <Ginger.Control.SeekBar className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-orange-200 accent-orange-700" />
        <div className="flex flex-wrap items-center gap-2">
          <Ginger.Control.Previous className="rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-sm text-orange-900 hover:bg-orange-100" />
          <Ginger.Control.PlayPause className="rounded-lg bg-orange-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-800" />
          <Ginger.Control.Next className="rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-sm text-orange-900 hover:bg-orange-100" />
          <Ginger.Control.Volume className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-orange-200 accent-orange-700" />
        </div>
        <Ginger.Playlist className="rounded-xl border border-orange-200/80 bg-white/70 p-2" />
      </div>
    </div>
  );
}

export function EffectsDemo() {
  return (
    <Ginger.Provider initialTracks={demoTracks}>
      <Ginger.Player preload="auto" className="sr-only" />
      <EffectsPanel />
    </Ginger.Provider>
  );
}
