/** Champs formulaire — 48px min (HIG / Material touch target) */
export const TOUCH_FIELD =
  "min-h-12 w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

/** Date compacte mobile (évite débordement iOS Safari) */
export const TOUCH_DATE_FIELD =
  "min-h-12 w-[9.75rem] max-w-[42vw] rounded-xl border border-gray-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent md:w-full md:max-w-none";

/** Champ numérique compact (note max, etc.) */
export const TOUCH_NUMERIC_COMPACT =
  "min-h-12 w-[5.5rem] max-w-[28vw] shrink-0 rounded-xl border border-gray-300 px-3 py-3 text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent md:w-full md:max-w-none";

/** Zone de tap fréquente — 48×48px */
export const TOUCH_TARGET =
  "inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl transition-colors duration-150 active:scale-[0.97]";
