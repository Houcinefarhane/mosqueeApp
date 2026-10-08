/**
 * Design tokens tactile — mobile 48px min sur champs principaux.
 */

export const TOUCH_FEEDBACK =
  "transition-all duration-150 active:scale-[0.98]";

export const TOUCH_CONTROL =
  "min-h-12 w-full rounded-2xl border border-filet bg-blanc px-4 py-2.5 text-sm text-brun focus:outline-none focus:ring-2 focus:ring-or focus:border-transparent transition-all duration-150 md:min-h-11";

export const TOUCH_FIELD = TOUCH_CONTROL;

export const TOUCH_SEARCH =
  "min-h-12 w-full rounded-2xl border border-filet bg-blanc py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-or focus:border-transparent transition-all duration-150 md:min-h-11";

export const TOUCH_DATE_FIELD =
  "min-h-12 w-[9rem] max-w-[40vw] rounded-2xl border border-filet bg-blanc px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-or md:w-full md:max-w-none";

export const TOUCH_NUMERIC_COMPACT =
  "min-h-12 w-[4.5rem] max-w-[26vw] shrink-0 rounded-2xl border border-filet bg-blanc px-2.5 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-or md:w-full md:max-w-none";

export const TOUCH_TARGET =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl transition-all duration-150 active:scale-[0.97]";

export const TOUCH_BADGE =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full";

export const TOUCH_EMPHASIS_VARIANTS = new Set([
  "primary",
  "secondary",
  "danger",
]);
