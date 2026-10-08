"use client";

import { Capacitor } from "@capacitor/core";

export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
