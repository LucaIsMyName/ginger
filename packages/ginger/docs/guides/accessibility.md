# Accessibility checklist

Baseline expectations when composing **custom** UIs with Ginger. The built-in **`Ginger.Control.*`** components set reasonable defaults (`aria-label`, `aria-pressed`, slider semantics); if you replace them with headless bindings, you inherit responsibility for the same affordances.

---

## Controls baseline

- Use **semantic** elements: `button`, `input[type=range]`, `select` — not `div` with `onClick` unless you add full keyboard and role support.
- Provide **accessible names** for every interactive control (visible text, `aria-label`, or `aria-labelledby`).
- Preserve **keyboard activation** (`Enter` / `Space` on buttons) and visible **focus rings** (do not `outline-none` without a replacement).
- Use **`aria-pressed`** for toggles. Shuffle and mute are `true` / `false`. Repeat is `false` (off), `true` (all), or `mixed` (one), with the mode also in `aria-label`.
- Ginger draws a focus ring on controls and playlist rows inside `[data-ginger-root]` using **`--ginger-focus-ring`**. Override that variable to match your theme; do not remove `:focus-visible` without a replacement.
- Pair sliders with **`aria-valuetext`** when a raw 0–1 number is not meaningful (Ginger’s volume/seek bindings help here).

---

## Label patterns

- Prefer **visible** labels for primary actions (“Play”, “Next track”).
- **Icon-only** controls need an explicit **`aria-label`** (and ideally `title` only as a supplement, not the sole hint).
- Keep **visible** copy and **`aria-label`** in sync so voice control users get predictable names.

---

## Playlist and queue

- Make each track row **focusable** (`button` or `a` wrapping the row).
- Expose **which** track is playing with text (“Playing”) and/or **`aria-current="true"`** on the active row when appropriate.
- Avoid conveying state **only** through color or animation; pair with text (“Paused”, “Playing”).

---

## Motion and reduced motion

- If you animate seek handles or volume, respect **`prefers-reduced-motion`** where possible. Ginger’s player can be composed with CSS that reduces transitions when the media query matches.

---

## Testing recommendations

- Assert control names with **`getByRole('button', { name: '…' })`** rather than test IDs.
- After toggling shuffle, mute, or repeat, assert **`aria-pressed`** matches expectation.
- Include at least one **keyboard-only** path in integration tests (Tab to control, Space to activate).

For end-to-end patterns with Testing Library, see [`testing.md`](./testing.md).
