/**
 * Design tokens tactile — mobile compact (44px min, text-sm).
 */

export const TOUCH_FEEDBACK =
  "transition-all duration-150 active:scale-[0.98]";

/** Champs formulaire — 44px mobile, compact desktop */
export const TOUCH_CONTROL =
  "min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150 md:min-h-0 md:rounded-lg md:py-2.5 md:px-4";

export const TOUCH_FIELD = TOUCH_CONTROL;

export const TOUCH_SEARCH =
  "min-h-11 w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150 md:min-h-0 md:py-2.5 md:pl-10 md:pr-4";

export const TOUCH_DATE_FIELD =
  "min-h-11 w-[9rem] max-w-[40vw] rounded-lg border border-gray-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent md:w-full md:max-w-none";

export const TOUCH_NUMERIC_COMPACT =
  "min-h-11 w-[4.5rem] max-w-[26vw] shrink-0 rounded-lg border border-gray-300 px-2.5 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent md:w-full md:max-w-none";

/** Zone de tap — 44×44px minimum */
export const TOUCH_TARGET =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-all duration-150 active:scale-[0.97]";

/** Pastille statut dans une ligne compacte */
export const TOUCH_BADGE =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full";

export const TOUCH_EMPHASIS_VARIANTS = new Set([
  "primary",
  "secondary",
  "danger",
]);
