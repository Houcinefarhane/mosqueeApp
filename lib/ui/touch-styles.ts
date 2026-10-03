/**
 * Design tokens tactile — mobile-first (48px actions fréquentes, 44px minimum).
 * Utilisés par components/ui/* et pages prof/admin mobile.
 */

/** Feedback immédiat au tap (<100ms perçu) */
export const TOUCH_FEEDBACK =
  "transition-all duration-150 active:scale-[0.98]";

/** Champs formulaire pleine largeur — 48px mobile, compact desktop */
export const TOUCH_CONTROL =
  "min-h-12 w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150 md:min-h-0 md:rounded-lg md:py-2.5 md:text-sm";

/** Alias explicite (pages prof appel/notes) */
export const TOUCH_FIELD = TOUCH_CONTROL;

/** Champ recherche avec icône gauche */
export const TOUCH_SEARCH =
  "min-h-12 w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150 md:min-h-0 md:rounded-lg md:py-2.5 md:text-sm";

/** Date compacte mobile (évite débordement iOS Safari) */
export const TOUCH_DATE_FIELD =
  "min-h-12 w-[9.75rem] max-w-[42vw] rounded-xl border border-gray-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent md:w-full md:max-w-none";

/** Champ numérique compact (note max, etc.) */
export const TOUCH_NUMERIC_COMPACT =
  "min-h-12 w-[5.5rem] max-w-[28vw] shrink-0 rounded-xl border border-gray-300 px-3 py-3 text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent md:w-full md:max-w-none";

/** Zone de tap fréquente — 48×48px */
export const TOUCH_TARGET =
  "inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl transition-all duration-150 active:scale-[0.97]";

/** Variantes Button qui doivent rester 48px sur mobile même en size="sm" */
export const TOUCH_EMPHASIS_VARIANTS = new Set([
  "primary",
  "secondary",
  "danger",
]);
