"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNativePlatform } from "@/lib/native/is-native";

const APP_HOSTS = [
  "madrasa-app-pi.vercel.app",
  "localhost",
  "127.0.0.1",
];

function isInAppUrl(href: string): boolean {
  try {
    const u = new URL(href, window.location.origin);
    if (u.protocol !== "http:" && u.protocol !== "https:") return true;
    return APP_HOSTS.some(
      (h) => u.hostname === h || u.hostname.endsWith(".vercel.app")
    );
  } catch {
    return true;
  }
}

export default function NativeSystemBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativePlatform()) return;

    void (async () => {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      const { SplashScreen } = await import("@capacitor/splash-screen");
      const { App } = await import("@capacitor/app");
      const { Keyboard } = await import("@capacitor/keyboard");

      try {
        await StatusBar.setBackgroundColor({ color: "#3B2216" });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {
        /* iOS ignore background */
      }

      void SplashScreen.hide();

      const { KeyboardResize } = await import("@capacitor/keyboard");
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body });

      await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          void App.exitApp();
        }
      });

      await App.addListener("appUrlOpen", (event) => {
        try {
          const u = new URL(event.url);
          const path = u.pathname + u.search + u.hash;
          if (path.startsWith("/")) router.push(path);
        } catch {
          /* ignore */
        }
      });
    })();

    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest("a");
      if (!target?.href) return;
      if (target.target === "_blank") return;
      if (isInAppUrl(target.href)) return;
      e.preventDefault();
      void import("@capacitor/browser").then(({ Browser }) =>
        Browser.open({ url: target.href })
      );
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
