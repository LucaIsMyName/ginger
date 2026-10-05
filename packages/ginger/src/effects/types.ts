export type EffectInstance = {
  input: AudioNode;
  output: AudioNode;
  setParam: (key: string, value: unknown) => void;
  setEnabled: (enabled: boolean) => void;
  dispose: () => void;
};

export type EffectFactory = (
  context: AudioContext,
  params: Record<string, unknown>,
) => EffectInstance;

export type DelayEffectSpec = {
  id?: string;
  type: "delay";
  enabled?: boolean;
  mix?: number;
  time?: number;
  feedback?: number;
};

export type ReverbEffectSpec = {
  id?: string;
  type: "reverb";
  enabled?: boolean;
  mix?: number;
  decay?: number;
  impulseBuffer?: AudioBuffer;
};

export type DistortionEffectSpec = {
  id?: string;
  type: "distortion";
  enabled?: boolean;
  mix?: number;
  amount?: number;
  oversample?: OverSampleType;
};

export type PhaserEffectSpec = {
  id?: string;
  type: "phaser";
  enabled?: boolean;
  mix?: number;
  rate?: number;
  depth?: number;
  stages?: number;
  feedback?: number;
};

export type ChorusEffectSpec = {
  id?: string;
  type: "chorus";
  enabled?: boolean;
  mix?: number;
  rate?: number;
  depth?: number;
  delay?: number;
  voices?: number;
};

export type OctaverMode = "down" | "up" | "both";

export type OctaverEffectSpec = {
  id?: string;
  type: "octaver";
  enabled?: boolean;
  mix?: number;
  mode?: OctaverMode;
  tone?: number;
};

export type CustomEffectSpec = {
  id?: string;
  type: "custom";
  enabled?: boolean;
  create: (context: AudioContext) => EffectInstance;
};

export type RegisteredEffectSpec = {
  id?: string;
  type: string;
  enabled?: boolean;
  [key: string]: unknown;
};

export type GingerEffectSpec =
  | DelayEffectSpec
  | ReverbEffectSpec
  | DistortionEffectSpec
  | PhaserEffectSpec
  | ChorusEffectSpec
  | OctaverEffectSpec
  | CustomEffectSpec
  | RegisteredEffectSpec;

export const BUILTIN_EFFECT_TYPES = [
  "delay",
  "reverb",
  "distortion",
  "phaser",
  "chorus",
  "octaver",
] as const;

export type BuiltinEffectType = (typeof BUILTIN_EFFECT_TYPES)[number];
